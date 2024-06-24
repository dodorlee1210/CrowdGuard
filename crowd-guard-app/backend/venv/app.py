from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import cv2
import logging
import base64
import numpy as np
from pipeline import CG_Pipeline


app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

UPLOAD_FOLDER = 'crowd-guard-app/backend/venv/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# input_video_path = ''
model = None  # Initialize the model globally

logging.basicConfig(level=logging.DEBUG)

@app.route('/upload', methods=['POST'])
def receive_video():
    global model  # Use the global model variable
    if 'video' not in request.files:
        logging.error('No video uploaded')
        return jsonify({'error': 'No video uploaded'}), 400

    file = request.files['video']
    input_video_path = os.path.join(UPLOAD_FOLDER, file.filename)

    logging.info(f"Saving uploaded video to {input_video_path}")
    file.save(input_video_path)

    # Reset the model and any state related to the previous video
    model = None

    # Get the first frame of the video
    cap = cv2.VideoCapture(input_video_path)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        logging.error('Failed to capture the first frame')
        return None

    # Encode the frame to base64
    _, buffer = cv2.imencode('.jpg', frame)
    first_frame_base64 = base64.b64encode(buffer).decode('utf-8')

    return jsonify({
        'message': 'Video upload successful, streaming will start',
        'first_frame': first_frame_base64,
        'video_path': input_video_path
    }), 200

@app.route('/points', methods=['POST'])
def receive_points():
    global model  # Use the global model variable
    data = request.json
    points = data.get('points', [])
    path = data.get('video_path', '')
    
    if len(points) != 4:
        return jsonify({'error': 'Exactly 4 points are required'}), 400
    
    # Process the points
    # Assuming you have some logic to process these points
    print('Received points:', points)
    # Should be ordered in [[top right],[bottom right],[bottom left],[top lef]]
    points = [
        [points[0]['x'], points[0]['y']],
        [points[3]['x'], points[3]['y']],
        [points[1]['x'], points[1]['y']],
        [points[2]['x'], points[2]['y']]
    ]
    corner_points_arr = np.float32(points[:4])
    model = CG_Pipeline(fps=30, corners=corner_points_arr, interval_speed_calculation=2)

    socketio.start_background_task(target=process_video_stream, video_path=path)
    #test
    
    return jsonify({'message': 'Points received successfully'})

@app.route('/reset', methods=['POST'])
def reset_backend_state():
    global model
    model = None
    # Add any other necessary state resets here
    return jsonify({'message': 'Backend state reset successfully'})

def process_video_stream(video_path):
    global model
    cap = cv2.VideoCapture(video_path)
    frame_number = 0

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_number += 1

            # Process the frame using the pipeline
            if model is not None:
                bird_eye_view_image, labeled_crowd_density, potential_for_crowd_crush = model.pipeline(frame, frame_number)

                # Encode the images to base64
                _, buffer_ax1 = cv2.imencode('.jpg', labeled_crowd_density)
                frame_encoded_density = base64.b64encode(buffer_ax1).decode('utf-8')

                # _, buffer_ax2 = cv2.imencode('.jpg', bird_eye_view_image)
                # frame_encoded_view = base64.b64encode(buffer_ax2).decode('utf-8')

                buffered = BytesIO()
                bird_eye_view_image.save(buffered, format="JPEG")
                bird_eye_view_image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

                # Emit the frames via WebSocket
                socketio.emit('frame_density', {'frame_density': frame_encoded_density})
                socketio.emit('crowd_crush', {'crowd_crush': potential_for_crowd_crush})
                # logging.info(f"Emitting frame density number {frame_number}")

                socketio.emit('frame_view', {'frame_view': bird_eye_view_image_base64})
                # logging.info(f"Emitting frame number {frame_number}")

            socketio.sleep(0.03)  # Adjust for a smoother frame rate
    finally:
        cap.release()
        try:
            # socketio.emit('processing_complete')
            os.remove(video_path) 
            logging.info(f"Deleted input video file: {video_path}")
        except Exception as e:
            logging.error(f"Error deleting input video file: {e}")

if __name__ == '__main__':
    socketio.run(app, debug=True)
