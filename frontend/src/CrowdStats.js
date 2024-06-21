import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, IconButton, Stack } from '@mui/material';
  
export default function CrowdStats() {

    const [riskScore, setRiskScore] = useState(null);

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
      <Box className="App" sx={{minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        
        <Stack direction="row" spacing={10} sx={{ alignItems: 'center'}}>
            <Box
                sx={{
                    backgroundColor: 'grey',
                    height: '55vh',
                    width: '55vw',
                    borderRadius: 2,
                  }}>
            </Box>
            <Stack direction="column" spacing={2}>
                <Typography sx={{fontFamily: 'Roboto Mono', color: '#D59F39', fontSize: '1.2rem'}}>Disaster Risk</Typography>
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
                    <Typography sx={{ fontFamily: 'Roboto Mono', color: borderColor, fontSize: '2.5rem'}}>
                        {riskText}</Typography>
                </Box>
                {/* <Stack direction="row" spacing={2}>
                    <Box 
                        sx={{ 
                            backgroundColor: 'grey', 
                            height: '30vh', 
                            width: '15vw', 
                            display: 'flex', 
                            alignItems: 'stretch', 
                            justifyContent: 'center',
                            borderRadius: 5,
                            border: '2px solid #D59F39',
                        }}
                    >
                        <Typography>Crowd Flow</Typography>
                    </Box>
                    <Box 
                        sx={{ 
                            backgroundColor: 'grey', 
                            height: '30vh', 
                            width: '15vw', 
                            display: 'flex', 
                            alignItems: 'stretch', 
                            justifyContent: 'center',
                            borderRadius: 5,
                            border: '2px solid #D59F39',
                        }}
                    >
                        <Typography>Crowd Density</Typography>
                    </Box>
                </Stack> */}
            </Stack>
        </Stack>
      </Box>
    );
}

