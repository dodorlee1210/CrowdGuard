import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import CrowdStats from './CrowdStats';
import Map from './Map';
import CameraView from './CameraView';

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/crowd-stats" element={<CrowdStats />} />
        <Route path="/map" element={<Map />} />
        <Route path="/camera-view" element={<CameraView />} />
      </Routes>
    </Router>
  );
}
