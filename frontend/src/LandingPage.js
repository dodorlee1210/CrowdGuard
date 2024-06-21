import React, { useState } from 'react';
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
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openWarningDialog, setOpenWarningDialog] = useState(false);
  const [points, setPoints] = useState([]);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
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
        setIsProcessing(true);
        // SEND VIDEO TO BACKEND
        // Simulate video processing
        setTimeout(() => {
          setIsProcessing(false);
          console.log("File processed: ", file);
          navigate('/crowd-stats');
        }, 3000);
      } else {
        // Unsupported file type
        setOpenWarningDialog(true);
      }
    }
  };

  const handleUploadClick = () => {
    document.getElementById('fileInput').click();
  };

  const toggleIcons = () => {
    setShowCamera(!showCamera);
  };

  const handleImageClick = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const newPoints = [...points, [x, y]];
    setPoints(newPoints);
    if (newPoints.length === 2) {
      // After selecting the second point, process the remaining two coordinates
      const [point1, point2] = newPoints;
      const topLeft = [Math.min(point1[0], point2[0]), Math.min(point1[1], point2[1])];
      const bottomRight = [Math.max(point1[0], point2[0]), Math.max(point1[1], point2[1])];
      const topRight = [bottomRight[0], topLeft[1]];
      const bottomLeft = [topLeft[0], bottomRight[1]];

      setOpenDialog(false);
      const numpyArray = JSON.stringify([topRight, bottomLeft, bottomRight, topLeft]); 
      console.log(numpyArray);  
      // SEND THIS TO BACKEND
    }
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

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogContent>
          {imageSrc && (
            <img src={imageSrc} alt="Uploaded" style={{ maxWidth: '100%' }} onClick={handleImageClick} />
          )}
        </DialogContent>
      </Dialog>

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
