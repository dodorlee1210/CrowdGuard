import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Box, Typography, Button, IconButton, Stack, CircularProgress, Dialog, DialogContent, DialogActions, DialogTitle } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import { useNavigate } from 'react-router-dom';

function VideoUploadIcons({ onUploadClick, onCameraClick }) {
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
  const [firstFrame, setFirstFrame] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [points, setPoints] = useState([]);
  const [videoPath, setVideoPath] = useState("");
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const dialogContentRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openWarningDialog, setOpenWarningDialog] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = async (e) => {
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
        } catch (error) {
          console.error('Error uploading the video:', error);
          alert('Error uploading the video. Please try again.');
        }

        
      } else {
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
    if (points.length >= 2) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoints = [...points, { x, y }];
    setPoints(newPoints);
    drawPoints(newPoints);

    if (newPoints.length === 2) {
      calculateOtherPoints(newPoints);
      setTimeout(() => {
        setIsProcessing(false);
        navigate('/crowd-stats');
      }, 3000);
      
    }
  };

  const calculateOtherPoints = (points) => {
    const [p1, p2] = points;

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
    document.getElementById('fileInput').click();
  };

  const toggleIcons = () => {
    setShowCamera(!showCamera);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setPoints([]);
  };

  const handleCloseWarningDialog = () => {
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
