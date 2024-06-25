import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://127.0.0.1:5000');

export default function CrowdStats() {
    const [riskScore, setRiskScore] = useState(null);
    const [currentFrame, setCurrentFrame] = useState("");
    const [currentView, setCurrentView] = useState("");
    // const [currentStatus, setCurrentStatus] = useState("");

    useEffect(() => {
        socket.on('frame_density', data => {
            setCurrentFrame(data.frame_density);
        });

        socket.on('frame_view', data => {
            setCurrentView(data.frame_view);
        });

        socket.on('crowd_crush', data => {
            setRiskScore(data.crowd_crush);
        });

        socket.on('processing_complete', () => {
            console.log('Processing complete');
        });

        return () => {
            socket.off('frame_density');
            socket.off('frame_view');
            socket.off('crowd_crush');
            socket.off('processing_complete');
        };
    }, []);

    // useEffect(() => {
    //     setTimeout(() => {
    //         const score = 1; // eventually replace with backend output
    //         setRiskScore(score);
    //     }, 2000);
    // }, []);

    // const resetBackendState = async () => {
    //     try {
    //         await axios.post('http://127.0.0.1:5000/reset'); // Adjust endpoint for resetting backend state
    //         console.log('Backend state reset successfully');
    //     } catch (error) {
    //         console.error('Error resetting backend state:', error);
    //     }
    // };

    // const handleStopStreaming = async () => {
    //     handleReset();
    //     socket.disconnect();
    //     setIsStreaming(false);
    //     setCurrentFrame("");
    //     // Optionally, reset backend state when stopping streaming
    //     // resetBackendState();
    // };

    let borderColor;
    let riskText;

    switch (riskScore) {
        case 0:
            borderColor = '#B2FBA5';
            riskText = 'Low';
            break;
        case 1:
            borderColor = '#FFEE93';
            riskText = 'Medium';
            break;
        case 2:
            borderColor = '#FF7F78';
            riskText = 'High';
            break;
        default:
            borderColor = '#D59F39';
            riskText = 'Loading...';
    }

    return (
        <Box
          sx={{
            minHeight: '90vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <Stack direction="row" spacing={5} sx={{ alignItems: 'center' }}>
            {/* Left Section: Current Frame */}
            <Box
              sx={{
                backgroundColor: 'grey',
                height: '56vh',
                width: '50vw',
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              {currentFrame && (
                <img
                  src={`data:image/jpeg;base64,${currentFrame}`}
                  alt="Video Frame"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              )}
            </Box>
      
            {/* Right Section: Current View (top) and Current Status (bottom) */}
            <Stack direction="column" spacing={2} sx={{ alignItems: 'center' }}>
              {/* Current View */}
              <Box
                sx={{
                  backgroundColor: 'grey',
                  height: '35vh', // Adjust height for smaller box
                  width: '24.34vw', // Adjust width for smaller box
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  border: '2px solid #D59F39',
                  marginBottom: '2.5vh', // Spacing between Current View and Current Status
                }}
              >
                {currentView && (
                  <img
                    src={`data:image/jpeg;base64,${currentView}`}
                    alt="Crowd View"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                )}
              </Box>
      
              {/* Current Status */}
              <Box
                sx={{
                  backgroundColor: 'grey',
                  height: '15vh', // Adjust height for smaller box
                  width: '10vw', // Adjust width for smaller box
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 5,
                  border: `2px solid ${borderColor}`,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Roboto Mono',
                    color: borderColor,
                    fontSize: '1.5rem', // Adjust font size for Current Status
                  }}
                >
                  {/* {riskScore} */}
                  {riskText}
                </Typography>
              </Box>
      
              {/* Disaster Risk */}
              <Typography
                sx={{
                  fontFamily: 'Roboto Mono',
                  color: '#D59F39',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  marginTop: '2.5vh', // Spacing above Disaster Risk
                }}
              >
                Disaster Risk
              </Typography>
            </Stack>
          </Stack>
        </Box>
      );
      
}
