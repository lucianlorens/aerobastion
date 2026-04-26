from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
# Import ultralytics lazily inside load_model() to allow the app to start
# even when heavy ML dependencies are not yet installed.
import asyncio
import base64
import os
from pathlib import Path
import json
from typing import Optional
import time

app = FastAPI(title="Aerobastion Fire Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
# Keep model dynamic (avoid referencing YOLO at import time)
model = None
VIDEOS_DIR = Path(__file__).parent / "videos"
VIDEOS_DIR.mkdir(exist_ok=True)

# Detection state
detection_active = False
current_video_path: Optional[str] = None


def load_model():
    """Load YOLOv8 model for fire detection"""
    global model
    if model is None:
        # Import YOLO here so the FastAPI app can start without ultralytics
        # installed. Calling endpoints that use the model will raise a
        # RuntimeError if ultralytics is missing.
        try:
            from ultralytics import YOLO
        except Exception as e:
            raise RuntimeError(
                "ultralytics is not installed or failed to import. "
                "Install the backend dependencies or run without detection. "
                f"Original error: {e}"
            )

        # Use YOLOv8n (nano) for speed, can upgrade to yolov8s/m for accuracy
        model = YOLO("yolov8n.pt")
    return model


def detect_fire_in_frame(frame: np.ndarray) -> dict:
    """
    Run fire detection on a single frame.
    Returns detection results with bounding boxes and confidence.
    """
    global model
    if model is None:
        load_model()
    
    results = model(frame, verbose=False)
    
    detections = []
    fire_detected = False
    fire_confidence = 0.0
    
    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            class_name = model.names[cls]
            
            # YOLOv8 base model doesn't have fire class, 
            # but we simulate fire detection based on bright/orange regions
            # In production, use a fire-specific trained model
            
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            detections.append({
                "class": class_name,
                "confidence": conf,
                "bbox": [int(x1), int(y1), int(x2), int(y2)]
            })
    
    # Simulate fire detection using color analysis (for demo)
    # In production, replace with fire-trained YOLO model
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    # Fire color ranges (orange/red/yellow)
    lower_fire1 = np.array([0, 100, 100])
    upper_fire1 = np.array([25, 255, 255])
    lower_fire2 = np.array([160, 100, 100])
    upper_fire2 = np.array([180, 255, 255])
    
    mask1 = cv2.inRange(hsv, lower_fire1, upper_fire1)
    mask2 = cv2.inRange(hsv, lower_fire2, upper_fire2)
    fire_mask = cv2.bitwise_or(mask1, mask2)
    
    # Calculate fire probability based on pixel coverage
    fire_pixels = cv2.countNonZero(fire_mask)
    total_pixels = frame.shape[0] * frame.shape[1]
    fire_ratio = fire_pixels / total_pixels
    
    if fire_ratio > 0.01:  # More than 1% fire-colored pixels
        fire_detected = True
        fire_confidence = min(fire_ratio * 10, 0.99)  # Scale confidence
        
        # Find contours for fire regions
        contours, _ = cv2.findContours(fire_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            if cv2.contourArea(contour) > 500:  # Minimum area threshold
                x, y, w, h = cv2.boundingRect(contour)
                detections.append({
                    "class": "FIRE",
                    "confidence": fire_confidence,
                    "bbox": [x, y, x + w, y + h]
                })
    
    # Smoke detection (gray/white regions with low saturation)
    lower_smoke = np.array([0, 0, 150])
    upper_smoke = np.array([180, 50, 255])
    smoke_mask = cv2.inRange(hsv, lower_smoke, upper_smoke)
    
    smoke_pixels = cv2.countNonZero(smoke_mask)
    smoke_ratio = smoke_pixels / total_pixels
    
    if smoke_ratio > 0.05:  # More than 5% smoke-colored pixels
        smoke_confidence = min(smoke_ratio * 5, 0.95)
        contours, _ = cv2.findContours(smoke_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            if cv2.contourArea(contour) > 1000:
                x, y, w, h = cv2.boundingRect(contour)
                detections.append({
                    "class": "SMOKE",
                    "confidence": smoke_confidence,
                    "bbox": [x, y, x + w, y + h]
                })
    
    return {
        "fire_detected": fire_detected or any(d["class"] == "FIRE" for d in detections),
        "smoke_detected": any(d["class"] == "SMOKE" for d in detections),
        "fire_confidence": max([d["confidence"] for d in detections if d["class"] == "FIRE"], default=0),
        "detections": detections,
        "timestamp": time.time()
    }


def draw_detections(frame: np.ndarray, detections: list) -> np.ndarray:
    """Draw bounding boxes and labels on frame"""
    annotated = frame.copy()
    
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        conf = det["confidence"]
        cls = det["class"]
        
        # Color based on class
        if cls == "FIRE":
            color = (0, 0, 255)  # Red for fire
        elif cls == "SMOKE":
            color = (128, 128, 128)  # Gray for smoke
        else:
            color = (0, 255, 0)  # Green for other
        
        # Draw box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        
        # Draw label
        label = f"{cls}: {conf:.2f}"
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(annotated, (x1, y1 - label_size[1] - 10), (x1 + label_size[0], y1), color, -1)
        cv2.putText(annotated, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    return annotated


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "aerobastion-fire-detection"}


@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file for analysis"""
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid file format. Supported: mp4, avi, mov, mkv"}
        )
    
    file_path = VIDEOS_DIR / file.filename
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    return {
        "message": "Video uploaded successfully",
        "filename": file.filename,
        "path": str(file_path)
    }


@app.get("/videos")
async def list_videos():
    """List all available videos in the videos directory"""
    videos = []
    for f in VIDEOS_DIR.iterdir():
        if f.suffix.lower() in ['.mp4', '.avi', '.mov', '.mkv']:
            videos.append({
                "name": f.name,
                "path": str(f),
                "size": f.stat().st_size
            })
    return {"videos": videos}


@app.delete("/videos/{filename}")
async def delete_video(filename: str):
    """Delete a video file"""
    file_path = VIDEOS_DIR / filename
    if file_path.exists():
        file_path.unlink()
        return {"message": f"Video {filename} deleted"}
    return JSONResponse(status_code=404, content={"error": "Video not found"})


@app.post("/start-detection")
async def start_detection(video_name: str = ""):
    """Start fire detection on a video"""
    global detection_active, current_video_path
    
    if video_name:
        video_path = VIDEOS_DIR / video_name
        if not video_path.exists():
            return JSONResponse(status_code=404, content={"error": "Video not found"})
        current_video_path = str(video_path)
    
    detection_active = True
    load_model()  # Pre-load model
    
    return {
        "status": "detection_started",
        "video": current_video_path or "webcam"
    }


@app.post("/stop-detection")
async def stop_detection():
    """Stop fire detection"""
    global detection_active
    detection_active = False
    return {"status": "detection_stopped"}


@app.get("/detection-status")
async def detection_status():
    """Get current detection status"""
    return {
        "active": detection_active,
        "video": current_video_path,
        "model_loaded": model is not None
    }


@app.websocket("/ws/detection")
async def websocket_detection(websocket: WebSocket):
    """WebSocket endpoint for real-time fire detection streaming"""
    global detection_active, current_video_path
    
    await websocket.accept()
    
    try:
        # Wait for start command
        data = await websocket.receive_json()
        video_name = data.get("video", "")
        
        if video_name:
            video_path = VIDEOS_DIR / video_name
            if not video_path.exists():
                await websocket.send_json({"error": "Video not found"})
                return
            current_video_path = str(video_path)
        else:
            await websocket.send_json({"error": "No video specified"})
            return
        
        detection_active = True
        load_model()
        
        cap = cv2.VideoCapture(current_video_path)
        
        if not cap.isOpened():
            await websocket.send_json({"error": "Could not open video"})
            return
        
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        frame_delay = 1.0 / fps
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        await websocket.send_json({
            "status": "started",
            "fps": fps,
            "total_frames": total_frames
        })
        
        frame_count = 0
        
        while detection_active and cap.isOpened():
            ret, frame = cap.read()
            
            if not ret:
                # Loop video
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            
            frame_count += 1
            
            # Run detection
            detection_result = detect_fire_in_frame(frame)
            
            # Draw detections on frame
            annotated_frame = draw_detections(frame, detection_result["detections"])
            
            # Resize for transmission (reduce bandwidth)
            scale = 0.5
            annotated_frame = cv2.resize(annotated_frame, None, fx=scale, fy=scale)
            
            # Encode frame to JPEG
            _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Send frame and detection data
            await websocket.send_json({
                "frame": frame_base64,
                "frame_number": frame_count,
                "total_frames": total_frames,
                "progress": (frame_count / total_frames) * 100,
                "detection": detection_result
            })
            
            await asyncio.sleep(frame_delay)
        
        cap.release()
        await websocket.send_json({"status": "stopped"})
        
    except WebSocketDisconnect:
        detection_active = False
    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        detection_active = False


@app.post("/analyze-frame")
async def analyze_frame(file: UploadFile = File(...)):
    """Analyze a single frame/image for fire detection"""
    load_model()
    
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if frame is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image"})
    
    result = detect_fire_in_frame(frame)
    
    # Optionally return annotated image
    annotated = draw_detections(frame, result["detections"])
    _, buffer = cv2.imencode('.jpg', annotated)
    annotated_base64 = base64.b64encode(buffer).decode('utf-8')
    
    result["annotated_frame"] = annotated_base64
    
    return result
