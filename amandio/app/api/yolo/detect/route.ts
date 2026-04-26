"use server"

import { NextRequest, NextResponse } from "next/server"

// Simulated YOLO detection classes for fire/smoke scenarios
const DETECTION_CLASSES = {
  fire: { id: 0, name: "fire", color: "#FF4500" },
  smoke: { id: 1, name: "smoke", color: "#708090" },
  ember: { id: 2, name: "ember", color: "#FF6B35" },
  hotspot: { id: 3, name: "hotspot", color: "#FFD700" },
}

interface Detection {
  class_id: number
  class_name: string
  confidence: number
  bbox: {
    x: number
    y: number
    width: number
    height: number
  }
  color: string
}

interface DetectionResponse {
  detections: Detection[]
  frame_id: number
  timestamp: string
  processing_time_ms: number
  model: string
  fire_detected: boolean
  smoke_detected: boolean
  max_confidence: number
  alert_level: "none" | "low" | "medium" | "high" | "critical"
}

// Simulate realistic detection patterns
function generateDetections(frameId: number, scenario: string): Detection[] {
  const detections: Detection[] = []
  const time = Date.now()
  
  // Use frame ID and time to create varied but consistent patterns
  const seed = (frameId * 13 + Math.floor(time / 1000)) % 100
  
  if (scenario === "active_fire") {
    // Always detect fire in active fire scenario
    if (seed > 10) {
      detections.push({
        class_id: DETECTION_CLASSES.fire.id,
        class_name: DETECTION_CLASSES.fire.name,
        confidence: 0.85 + (seed % 15) / 100,
        bbox: {
          x: 0.3 + (seed % 20) / 100,
          y: 0.4 + (seed % 15) / 100,
          width: 0.15 + (seed % 10) / 100,
          height: 0.2 + (seed % 8) / 100,
        },
        color: DETECTION_CLASSES.fire.color,
      })
    }
    
    // Often detect smoke
    if (seed > 20) {
      detections.push({
        class_id: DETECTION_CLASSES.smoke.id,
        class_name: DETECTION_CLASSES.smoke.name,
        confidence: 0.75 + (seed % 20) / 100,
        bbox: {
          x: 0.25 + (seed % 25) / 100,
          y: 0.2 + (seed % 20) / 100,
          width: 0.3 + (seed % 15) / 100,
          height: 0.35 + (seed % 10) / 100,
        },
        color: DETECTION_CLASSES.smoke.color,
      })
    }
    
    // Sometimes detect embers
    if (seed > 60) {
      detections.push({
        class_id: DETECTION_CLASSES.ember.id,
        class_name: DETECTION_CLASSES.ember.name,
        confidence: 0.65 + (seed % 25) / 100,
        bbox: {
          x: 0.5 + (seed % 30) / 100,
          y: 0.5 + (seed % 25) / 100,
          width: 0.08,
          height: 0.08,
        },
        color: DETECTION_CLASSES.ember.color,
      })
    }
  } else if (scenario === "smoke_plume") {
    // Smoke plume scenario - early detection
    if (seed > 15) {
      detections.push({
        class_id: DETECTION_CLASSES.smoke.id,
        class_name: DETECTION_CLASSES.smoke.name,
        confidence: 0.70 + (seed % 25) / 100,
        bbox: {
          x: 0.35 + (seed % 20) / 100,
          y: 0.15 + (seed % 15) / 100,
          width: 0.25 + (seed % 20) / 100,
          height: 0.4 + (seed % 15) / 100,
        },
        color: DETECTION_CLASSES.smoke.color,
      })
    }
    
    // Sometimes detect hotspot
    if (seed > 50) {
      detections.push({
        class_id: DETECTION_CLASSES.hotspot.id,
        class_name: DETECTION_CLASSES.hotspot.name,
        confidence: 0.60 + (seed % 30) / 100,
        bbox: {
          x: 0.4 + (seed % 15) / 100,
          y: 0.55 + (seed % 10) / 100,
          width: 0.1,
          height: 0.1,
        },
        color: DETECTION_CLASSES.hotspot.color,
      })
    }
  } else if (scenario === "patrol") {
    // Patrol mode - occasional detections
    if (seed > 85) {
      detections.push({
        class_id: DETECTION_CLASSES.smoke.id,
        class_name: DETECTION_CLASSES.smoke.name,
        confidence: 0.55 + (seed % 35) / 100,
        bbox: {
          x: 0.2 + (seed % 40) / 100,
          y: 0.3 + (seed % 30) / 100,
          width: 0.15 + (seed % 20) / 100,
          height: 0.2 + (seed % 15) / 100,
        },
        color: DETECTION_CLASSES.smoke.color,
      })
    }
    
    if (seed > 95) {
      detections.push({
        class_id: DETECTION_CLASSES.hotspot.id,
        class_name: DETECTION_CLASSES.hotspot.name,
        confidence: 0.45 + (seed % 40) / 100,
        bbox: {
          x: 0.5 + (seed % 25) / 100,
          y: 0.6 + (seed % 20) / 100,
          width: 0.08,
          height: 0.08,
        },
        color: DETECTION_CLASSES.hotspot.color,
      })
    }
  }
  
  return detections
}

function calculateAlertLevel(detections: Detection[]): "none" | "low" | "medium" | "high" | "critical" {
  if (detections.length === 0) return "none"
  
  const hasFire = detections.some(d => d.class_name === "fire")
  const hasSmoke = detections.some(d => d.class_name === "smoke")
  const maxConfidence = Math.max(...detections.map(d => d.confidence))
  
  if (hasFire && maxConfidence > 0.9) return "critical"
  if (hasFire && maxConfidence > 0.7) return "high"
  if (hasFire || (hasSmoke && maxConfidence > 0.8)) return "medium"
  if (hasSmoke) return "low"
  
  return "none"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { frame_id = 0, scenario = "patrol" } = body
    
    // Simulate processing time (30-80ms like real YOLO)
    const processingTime = 30 + Math.random() * 50
    await new Promise(resolve => setTimeout(resolve, processingTime))
    
    const detections = generateDetections(frame_id, scenario)
    const fireDetected = detections.some(d => d.class_name === "fire")
    const smokeDetected = detections.some(d => d.class_name === "smoke")
    const maxConfidence = detections.length > 0 
      ? Math.max(...detections.map(d => d.confidence)) 
      : 0
    
    const response: DetectionResponse = {
      detections,
      frame_id,
      timestamp: new Date().toISOString(),
      processing_time_ms: Math.round(processingTime),
      model: "yolov8n-fire-v2.0",
      fire_detected: fireDetected,
      smoke_detected: smokeDetected,
      max_confidence: Math.round(maxConfidence * 100) / 100,
      alert_level: calculateAlertLevel(detections),
    }
    
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: "Detection failed", details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    model: "yolov8n-fire-v2.0",
    classes: Object.values(DETECTION_CLASSES),
    supported_scenarios: ["patrol", "smoke_plume", "active_fire"],
  })
}
