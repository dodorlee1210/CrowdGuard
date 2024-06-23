import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
// import '../VideoUploader.css';

const socket = io('http://127.0.0.1:5000');

function VideoUploader() {
    const [file, setFile] = useState(null);
    const [currentFrame, setCurrentFrame] = useState("");
    const [firstFrame, setFirstFrame] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [points, setPoints] = useState([]);
    const [videoPath, setVideoPath] = useState("");
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        socket.on('frame', data => {
            setCurrentFrame(data.frame_density);
            setIsProcessing(false);
            setIsStreaming(true);
            setIsComplete(false);
        });

        socket.on('processing_complete', () => {
            console.log('Processing complete');
            setIsProcessing(false);
            setIsStreaming(false);
            setIsComplete(true);
        });

        return () => {
            socket.off('frame');
            socket.off('processing_complete');
        };
    }, []);

    useEffect(() => {
        if (!isStreaming && videoPath) {
            // If streaming is stopped but videoPath is set, reset the backend state
            //resetBackendState();
        }
    }, [isStreaming, videoPath]);

    const resetBackendState = async () => {
        try {
            await axios.post('http://127.0.0.1:5000/reset'); // Adjust endpoint for resetting backend state
            console.log('Backend state reset successfully');
        } catch (error) {
            console.error('Error resetting backend state:', error);
        }
    };

    const resetStates = () => {
        setCurrentFrame("");
        setIsUploading(false);
        setIsProcessing(false);
        setIsStreaming(false);
        setIsComplete(false);
        setFirstFrame("");
        setPoints([]);
        setVideoPath("");
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        resetStates();
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a video file first.');
            return;
        }

        resetStates();
        setIsUploading(true);
        setIsProcessing(true);

        const formData = new FormData();
        formData.append('video', file);

        try {
            const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setFirstFrame(response.data.first_frame);
            setVideoPath(response.data.video_path);
            setIsUploading(false);
        } catch (error) {
            console.error('Error uploading the video:', error);
            resetStates();
            alert('Error uploading the video. Please try again.');
        }
    };

    const handleCanvasClick = (e) => {
        if (points.length >= 2) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newPoints = [...points, { x, y }];
        setPoints(newPoints);
        drawPoints(newPoints);

        if (newPoints.length === 2) {
            calculateOtherPoints(newPoints);
        }
    };

    const calculateOtherPoints = (points) => {
        const [p1, p2] = points;

        // Simple calculation of the other two points based on the condition
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        const dx = midX - p1.x;
        const dy = midY - p1.y;

        const p3 = { x: midX - dy, y: midY + dx };
        const p4 = { x: midX + dy, y: midY - dx };

        setPoints([...points, p3, p4]);

        sendPointsToBackend([p1, p2, p3, p4])
    };

    const sendPointsToBackend = async (points) => {
        try {
            await axios.post('http://127.0.0.1:5000/points', {
                points: points,
                video_path: videoPath
            });
            console.log('Points sent to backend successfully');
        } catch (error) {
            console.error('Error sending points to backend:', error);
        }
    };

    const drawPoints = (points) => {
        console.log('Drawing points:', points);
        const ctx = canvasRef.current.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            ctx.drawImage(img, 0, 0);
            points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI, false);
                ctx.fillStyle = 'red';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#003300';
                ctx.stroke();
            });
        };
        img.src = 'data:image/jpeg;base64,' + firstFrame;
    };

    useEffect(() => {
        if (firstFrame && canvasRef.current) {
            drawPoints(points);
        }
    }, [firstFrame, points]);

    const handleReset = () => {
        setFile(null);
        resetStates();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleToggleStreaming = () => {
        if (isStreaming) {
            handleStopStreaming();
        } else {
            //handleUploadAndStream();
        }
    };

    const handleStopStreaming = async () => {
        handleReset();
        socket.disconnect();
        setIsStreaming(false);
        setCurrentFrame("");
        // Optionally, reset backend state when stopping streaming
        // resetBackendState();
    };

    return (
        <div className="video-uploader">
            <h2>Video Upload and Streaming</h2>
            <div className="upload-section">
                <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleFileChange} 
                    className="file-input"
                    ref={fileInputRef}
                />
                <button 
                    onClick={handleUpload} 
                    disabled={isUploading || !file}
                    className="upload-button"
                >
                    {isUploading ? 'Uploading...' : (isStreaming ? 'Stop Streaming' : 'Upload and Stream')}
                </button>
            </div>
            <div className="stream-section">
                {isProcessing && <p>Processing the video...</p>}
                {isStreaming && <p>Streaming in progress...</p>}
                {currentFrame && !isComplete && (
                    <img 
                        src={`data:image/jpeg;base64,${currentFrame}`} 
                        alt="Current Frame" 
                        className="frame-image"
                    />
                )}
                {firstFrame && !isStreaming && (
                    <div>
                        <canvas
                            ref={canvasRef}
                            style={{ border: '1px solid black' }}
                            onClick={handleCanvasClick}
                        />
                        <p>Click on the image to select two diagonal points.</p>
                        {points.length === 4 && (
                            <div>
                                <p>Selected Points:</p>
                                <ul>
                                    {points.map((point, index) => (
                                        <li key={index}>{`Point ${index + 1}: (${point.x}, ${point.y})`}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                {isComplete && (
                    <div className="completion-message">
                        <p>Processing is complete!</p>
                        <button onClick={handleReset} className="reset-button">
                            Upload Another Video
                        </button>
                    </div>
                )}
                {!isProcessing && !isStreaming && !currentFrame && !isComplete && !firstFrame && (
                    <p>No stream available. Upload a video to start.</p>
                )}
            </div>
        </div>
    );
}

export default VideoUploader;
