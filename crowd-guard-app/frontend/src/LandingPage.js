import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Box, Typography, Button, IconButton, Stack, CircularProgress, Dialog, DialogContent, DialogActions, DialogTitle } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import { useNavigate } from 'react-router-dom';


const socket = io('http://127.0.0.1:5000');

function VideoUploadIcons({ onUploadClick, onCameraClick }) {
  console.log("VideoUploadIcons: ", onUploadClick, onCameraClick);
  return (
    <Stack direction="row">
      <IconButton sx={{ color: "#D59F39" }} onClick={onCameraClick}>
        <CameraAltIcon />
      </IconButton>
      <IconButton sx={{ color: "#D59F39" }} onClick={onUploadClick}>
        <DriveFolderUploadIcon />
      </IconButton>
    </Stack>
  );
}

function MyButton({ onClick }) {
  return (
    <Button
      onClick={onClick}
      sx={{
        backgroundColor: "#D59F39",
        color: "#E6E6E6",
        "&:hover": {
          backgroundColor: "#E6E6E6",
          color: "#D59F39"
        }
      }}
    >
      Upload Media
    </Button>
  );
}

export default function LandingPage() {

  const [file, setFile] = useState(null);
  const [currentFrame, setCurrentFrame] = useState("");
  const [firstFrame, setFirstFrame] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [points, setPoints] = useState([]);
  const [videoPath, setVideoPath] = useState("");
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const dialogContentRef = useRef(null);


  useEffect(() => {
    socket.on('frame', data => {
        setCurrentFrame(data.frame_density);
        setIsProcessing(false);
        setIsStreaming(true);
        setIsComplete(false);
    });

    socket.on('processing_complete', () => {
        console.log('Processing complete');
        setIsProcessing(false);
        setIsStreaming(false);
        setIsComplete(true);
    });

    return () => {
        socket.off('frame');
        socket.off('processing_complete');
    };
    }, []);

    useEffect(() => {
    if (!isStreaming && videoPath) {
        // If streaming is stopped but videoPath is set, reset the backend state
        //resetBackendState();
    }
    }, [isStreaming, videoPath]);

    const resetBackendState = async () => {
    try {
        await axios.post('http://127.0.0.1:5000/reset'); // Adjust endpoint for resetting backend state
        console.log('Backend state reset successfully');
    } catch (error) {
        console.error('Error resetting backend state:', error);
    }
    };

    const resetStates = () => {
        setCurrentFrame("");
        setIsUploading(false);
        setIsProcessing(false);
        setIsStreaming(false);
        setIsComplete(false);
        setFirstFrame("");
        setPoints([]);
        setVideoPath("");
    };


  const [showCamera, setShowCamera] = useState(false);
  //const [isProcessing, setIsProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openWarningDialog, setOpenWarningDialog] = useState(false);
  //const [points, setPoints] = useState([]);
  const navigate = useNavigate();

  const handleFileChange = async (e) => {
    console.log("handleFileChange: File selected"); 
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type;
      if (fileType === 'image/jpeg' || fileType === 'image/png' || fileType === 'image/jpg') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageSrc(e.target.result);
          setOpenDialog(true);
        };
        reader.readAsDataURL(file);
      } else if (fileType === 'video/mp4' || fileType === 'video/avi' || fileType === 'video/mov') {
        setFile(e.target.files[0]);

        setIsProcessing(true);
        resetStates();
        setIsProcessing(true);

        // SEND VIDEO TO BACKEND

        const formData = new FormData();
        formData.append('video', file);

        try {
            const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setFirstFrame(response.data.first_frame);
            setVideoPath(response.data.video_path);
            setIsUploading(false);
            // setImageSrc(response.data.first_frame);
            setOpenDialog(true);

        } catch (error) {
            console.error('Error uploading the video:', error);
            resetStates();
            alert('Error uploading the video. Please try again.');
        }
        // Simulate video processing
        // setTimeout(() => {
        //   setIsProcessing(false);
        //   console.log("File processed: ", file);
        //   navigate('/crowd-stats');
        // }, 3000);
      } else {
        // Unsupported file type
        setOpenWarningDialog(true);
      }
    }
     
  };

  const drawImageOnCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const ctx = canvas.getContext('2d');
    if (firstFrame) {
      const img = new Image();
      img.onload = () => {
        // Set canvas size to image's natural size
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
      };
      img.src = `data:image/jpeg;base64,${firstFrame}`;
    }
  };


  useEffect(() => {
    if (openDialog && firstFrame) {
      drawImageOnCanvas();
    }
  }, [openDialog, firstFrame]);

  const handleCanvasClick = (e) => {

    // drawImageOnCanvas();
    if (points.length >= 2) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoints = [...points, { x, y }];
    setPoints(newPoints);
    drawPoints(newPoints);

    if (newPoints.length === 2) {
        calculateOtherPoints(newPoints);
    }
};

const calculateOtherPoints = (points) => {
      const [p1, p2] = points;

      // Simple calculation of the other two points based on the condition
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      const dx = midX - p1.x;
      const dy = midY - p1.y;

      const p3 = { x: midX - dy, y: midY + dx };
      const p4 = { x: midX + dy, y: midY - dx };

      setPoints([...points, p3, p4]);

      sendPointsToBackend([p1, p2, p3, p4])
  };

  const sendPointsToBackend = async (points) => {
      try {
          await axios.post('http://127.0.0.1:5000/points', {
              points: points,
              video_path: videoPath
          });
          console.log('Points sent to backend successfully');
      } catch (error) {
          console.error('Error sending points to backend:', error);
      }
  };

  const drawPoints = (points) => {
      console.log('Drawing points:', points);
      const ctx = canvasRef.current.getContext('2d');
      const img = new Image();
      img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          ctx.drawImage(img, 0, 0);
          points.forEach(point => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI, false);
              ctx.fillStyle = 'red';
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = '#003300';
              ctx.stroke();
          });
      };
      img.src = 'data:image/jpeg;base64,' + firstFrame;
  };

  useEffect(() => {
      if (firstFrame && canvasRef.current) {
          drawPoints(points);
      }
  }, [firstFrame, points]);


  const handleUploadClick = async () => {
    console.log("Upload button clicked");
    document.getElementById('fileInput').click();
  };

  const toggleIcons = () => {
    console.log("Toggle icons");
    setShowCamera(!showCamera);
  };

  // const handleImageClick = (event) => {
  //   console.log("Image clicked");
  //   const rect = event.target.getBoundingClientRect();
  //   const x = event.clientX - rect.left;
  //   const y = event.clientY - rect.top;
  //   const newPoints = [...points, [x, y]];
  //   setPoints(newPoints);
  //   if (newPoints.length === 2) {
  //     // After selecting the second point, process the remaining two coordinates
  //     const [point1, point2] = newPoints;
  //     const topLeft = [Math.min(point1[0], point2[0]), Math.min(point1[1], point2[1])];
  //     const bottomRight = [Math.max(point1[0], point2[0]), Math.max(point1[1], point2[1])];
  //     const topRight = [bottomRight[0], topLeft[1]];
  //     const bottomLeft = [topLeft[0], bottomRight[1]];

  //     setOpenDialog(false);
  //     const numpyArray = JSON.stringify([topRight, bottomLeft, bottomRight, topLeft]); 
  //     console.log(numpyArray);  
  //     // SEND THIS TO BACKEND
  //   }
  // };

  const handleCloseDialog = () => {
    console.log("Dialog closed");
    setOpenDialog(false);
    setPoints([]);
  };

  const handleCloseWarningDialog = () => {
    console.log("Warning dialog closed");
    setOpenWarningDialog(false);
  };

  return (
    <Box className="App" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#343434' }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        flex: 1
      }}>
        <Typography variant="h2"
          noWrap
          sx={{
            display: 'flex',
            fontFamily: 'Orbitron',
            fontWeight: 700,
            color: '#D59F39',
          }}>CrowdGuard</Typography>
        <Typography variant="h6"
          noWrap
          sx={{
            display: 'flex',
            fontFamily: 'Roboto Mono',
            fontWeight: 400,
            color: 'white',
            margin: 2
          }}>Your dedicated community guard</Typography>
        {isProcessing ? (
          <CircularProgress sx={{ color: "#D59F39" }} />
        ) : (
          showCamera ? (
            <>
              <VideoUploadIcons onUploadClick={handleUploadClick} />
              <input
                type="file"
                id="fileInput"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </>
          ) : (
            <MyButton onClick={toggleIcons}>Upload Media</MyButton>
          )
        )}
      </Box>

   {/* <Dialog open={openDialog} onClose={handleCloseDialog}>
   <DialogContent ref={dialogContentRef}>
        {firstFrame && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <canvas
              ref={canvasRef}
              style={{ 
                border: '1px solid black',
                maxWidth: '100%',
                maxHeight: '70vh',
                width: 'auto',
                height: 'auto'
              }}
              onClick={handleCanvasClick}
          />
          <p>Click on the image to select two diagonal points.</p>
          {points.length === 2 && (
            <div>
              <p>Selected Points:</p>
              <ul>
                {points.map((point, index) => (
                  <li key={index}>{`Point ${index + 1}: (${point.x}, ${point.y})`}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
        </DialogContent>
      </Dialog>  */}

<Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogContent>
          {imageSrc && (
            <img src={imageSrc} alt="Uploaded" style={{ maxWidth: '100%' }} onClick={handleCanvasClick} />
          )}
        </DialogContent>
      </Dialog>


{/*  */}

      <Dialog open={openWarningDialog} onClose={handleCloseWarningDialog}>
        <DialogTitle>Unsupported File Type</DialogTitle>
        <DialogContent>
          <Typography>Please upload a valid video (.mp4, .avi, .mov) or image (.jpg, .jpeg, .png) file.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWarningDialog}>OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
