import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, Stack } from '@mui/material';
  
export default function CameraView() {
    return (
      <Box className="App" sx={{minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        
        <Stack direction="row" spacing={15} sx={{ alignItems: 'center'}}>
            <Box
                sx={{
                    backgroundColor: 'grey',
                    height: '60vh',
                    width: '45vw',
                    borderRadius: 2,
                  }}>
            </Box>
            <Stack direction="column" spacing={2}>
                <Box 
                    sx={{ 
                        backgroundColor: 'grey', 
                        height: '30vh', 
                        width: '25vw', 
                        display: 'flex', 
                        alignItems: 'stretch', 
                        justifyContent: 'center',
                        borderRadius: 5,
                        border: '2px solid #D59F39', 
                    }}
                >
                    <Typography>Disaster Probability</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
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
                </Stack>
            </Stack>
        </Stack>
      </Box>
    );
}

