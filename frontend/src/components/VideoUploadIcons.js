import React, { useState } from 'react';
import { IconButton, Stack, CircularProgress } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import { useNavigate } from 'react-router-dom';

export default function VideoUploadIcons({ onClick }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("File selected: ", file);
      setIsProcessing(true);

      // Simulate video processing
      setTimeout(() => {
        setIsProcessing(false);
        console.log("File processed: ", file);
        navigate('/crowd-stats');
      }, 3000);
    }
  };

  const handleUploadClick = () => {
    document.getElementById('fileInput').click();
  };

  return (
    <Stack direction="row">
      {isProcessing ? (
        <CircularProgress sx={{ color: "#D59F39" }} />
      ) : (
        <>
          <IconButton sx={{ color: "#D59F39" }} onClick={onClick}>
            <CameraAltIcon />
          </IconButton>
          <IconButton sx={{ color: "#D59F39" }} onClick={handleUploadClick}>
            <DriveFolderUploadIcon />
          </IconButton>
          <input
            type="file"
            id="fileInput"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </>
      )}
    </Stack>
  );
}