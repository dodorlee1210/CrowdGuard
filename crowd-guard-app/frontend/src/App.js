// src/App.js

import React from 'react';
import VideoUploader from './components/VideoUploader';
import './App.css'; // You can add some global styles here if needed
// import '@fontsource/roboto/300.css';
// import '@fontsource/roboto/400.css';
// import '@fontsource/roboto/500.css';
// import '@fontsource/roboto/700.css';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import CrowdStats from './CrowdStats';
import Map from './Map';
import CameraView from './CameraView';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Welcome to the Crowd Guard App</h1>
            </header>
            <main>
                <VideoUploader />
            </main>
        </div>

        // <Router>
        //   <Navbar />
        //     <Routes>
        //         <Route path="/" element={<LandingPage />} />
        //         <Route path="/crowd-stats" element={<CrowdStats />} />
        //         <Route path="/map" element={<Map />} />
        //         <Route path="/camera-view" element={<CameraView />} />
        //     </Routes>
        // </Router>
    );
}

export default App;





// export default function App() {
//   return (
//     <Router>
//       <Navbar />
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route path="/crowd-stats" element={<CrowdStats />} />
//         <Route path="/map" element={<Map />} />
//         <Route path="/camera-view" element={<CameraView />} />
//       </Routes>
//     </Router>
//   );
// }

