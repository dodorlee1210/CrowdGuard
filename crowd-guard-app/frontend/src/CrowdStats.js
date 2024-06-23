import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import io from 'socket.io-client';

const socket = io('http://127.0.0.1:5000');

export default function CrowdStats() {
    const [riskScore, setRiskScore] = useState(null);
    const [currentFrame, setCurrentFrame] = useState("");

    useEffect(() => {
        socket.on('frame', data => {
            setCurrentFrame(data.frame_density);
        });

        socket.on('processing_complete', () => {
            console.log('Processing complete');
        });

        return () => {
            socket.off('frame');
            socket.off('processing_complete');
        };
    }, []);

    useEffect(() => {
        setTimeout(() => {
            const score = 1; // eventually replace with backend output
            setRiskScore(score);
        }, 2000);
    }, []);

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
        <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <Stack direction="row" spacing={5} sx={{ alignItems: 'center' }}>
                <Box
                    sx={{
                        backgroundColor: 'grey',
                        height: '55vh',
                        width: '55vw',
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                    }}
                >
                    {currentFrame && (
                        <img 
                            src={`data:image/jpeg;base64,${currentFrame}`}
                            alt="Video Frame"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    )}
                </Box>
                <Stack direction="column" spacing={2} sx={{ alignItems: 'center' }}>
                    <Typography sx={{ fontFamily: 'Roboto Mono', color: '#D59F39', fontSize: '1.2rem', textAlign: 'center' }}>
                        Disaster Risk
                    </Typography>
                    <Box
                        sx={{
                            backgroundColor: 'grey',
                            height: '15vh',
                            width: '19.5vw',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 5,
                            border: `2px solid ${borderColor}`,
                        }}
                    >
                        <Typography sx={{ fontFamily: 'Roboto Mono', color: borderColor, fontSize: '2.5rem' }}>
                            {riskText}
                        </Typography>
                    </Box>
                </Stack>
            </Stack>
        </Box>
    );
}
