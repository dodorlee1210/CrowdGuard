// src/App.js

import React from 'react';
import VideoUploader from './components/VideoUploader';
import './App.css'; // You can add some global styles here if needed

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Welcome to the Video Streaming App</h1>
            </header>
            <main>
                <VideoUploader />
            </main>
        </div>
    );
}

export default App;
