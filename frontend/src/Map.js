import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Box, Typography, Button, IconButton, Stack } from '@mui/material';

const containerStyle = {
    width: '65vw',
    height: '70vh',
    borderRadius: 10,
};

const defaultCenter = {
    lat: 45.530835,
    lng: -73.613303,
};

function MapLocationBox({}) {
    return (
      <Box
        // onClick={onClick}
        sx={{
          backgroundColor:"#D59F39",
          color:"#E6E6E6",
          "&:hover":{ 
            backgroundColor:"#E6E6E6",
            color:"#D59F39"
          }
        }}
      >
        Upload Video
      </Box>
    )
  } 

export default function Map() {
    const [userLocation, setUserLocation] = useState(null);
    
    const fetchUserLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                },
                (error) => {
                    console.error("Error getting user's location: ", error);
                    setUserLocation(defaultCenter);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0,
                }
            ); 
        } else {
            setUserLocation(defaultCenter);
        }
    }, []);

    useEffect(() => {
        fetchUserLocation();
    }, [fetchUserLocation]);

    return (
        <Box className="App" sx={{minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <Stack direction="row" spacing={15} sx={{ alignItems: 'center'}}>
                <Box sx={{
                    height: '70vh', 
                    width: '65vw', 
                    display: 'flex', 
                    borderRadius: 15}}>
                    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={userLocation || defaultCenter}
                            zoom={15}
                        >
                            {userLocation && <Marker position={userLocation} />}
                        </GoogleMap>
                    </LoadScript>
                </Box>
                <Stack direction="column" spacing={5}>
                    
                </Stack>
            </Stack>
            
    </Box>
    );
}

