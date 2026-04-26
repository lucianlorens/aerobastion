"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Video,
  Upload,
  Play,
  Square,
  AlertTriangle,
  Flame,
  Wind,
  Loader2,
  RefreshCw,
  Crosshair,
  Gauge,
} from "lucide-react"

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

interface VideoFile {
  name: string
  path: string
  size: number
}

interface DroneVideoFeedProps {
  incidentMode: boolean
  onFireDetected?: (detected: boolean, confidence: number) => void
}

export function DroneVideoFeed({
  incidentMode,
  onFireDetected,
}: DroneVideoFeedProps) {
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [selectedVideo, setSelectedVideo] = useState<string>("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [detection, setDetection] = useState<DetectionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [frameCount, setFrameCount] = useState(0)
  const [fps, setFps] = useState(0)
  const [scenario, setScenario] = useState<"patrol" | "smoke_plume" | "active_fire">("patrol")
  const [detectionHistory, setDetectionHistory] = useState<{ time: number; detected: boolean }[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const fpsCounterRef = useRef<number>(0)

  // Fetch available videos
  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/videos")
      const data = await res.json()
      setVideos(data.videos || [])
      if (data.videos?.length > 0 && !selectedVideo) {
        setSelectedVideo(data.videos[0].path)
      }
    } catch {
      // No videos available yet
    }
  }, [selectedVideo])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  // Notify parent of fire detection
  useEffect(() => {
    if (detection && onFireDetected) {
      onFireDetected(detection.fire_detected, detection.max_confidence)
    }
  }, [detection, onFireDetected])

  // Run YOLO detection on current frame
  const runDetection = useCallback(async (frameId: number) => {
    try {
      const res = await fetch("/api/yolo/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame_id: frameId, scenario }),
      })
      const data: DetectionResponse = await res.json()
      setDetection(data)
      
      // Update detection history
      setDetectionHistory(prev => {
        const newHistory = [...prev, { time: Date.now(), detected: data.fire_detected || data.smoke_detected }]
        return newHistory.slice(-50) // Keep last 50 entries
      })
      
      return data
    } catch (err) {
      console.error("Detection error:", err)
      return null
    }
  }, [scenario])

  // Draw detection boxes on canvas
  const drawDetections = useCallback((detections: Detection[]) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 360

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw each detection box
    detections.forEach((det) => {
      const x = det.bbox.x * canvas.width
      const y = det.bbox.y * canvas.height
      const width = det.bbox.width * canvas.width
      const height = det.bbox.height * canvas.height

      // Draw box
      ctx.strokeStyle = det.color
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, width, height)

      // Draw filled corners for better visibility
      const cornerSize = 10
      ctx.fillStyle = det.color
      // Top-left
      ctx.fillRect(x, y, cornerSize, 3)
      ctx.fillRect(x, y, 3, cornerSize)
      // Top-right
      ctx.fillRect(x + width - cornerSize, y, cornerSize, 3)
      ctx.fillRect(x + width - 3, y, 3, cornerSize)
      // Bottom-left
      ctx.fillRect(x, y + height - 3, cornerSize, 3)
      ctx.fillRect(x, y + height - cornerSize, 3, cornerSize)
      // Bottom-right
      ctx.fillRect(x + width - cornerSize, y + height - 3, cornerSize, 3)
      ctx.fillRect(x + width - 3, y + height - cornerSize, 3, cornerSize)

      // Draw label background
      const label = `${det.class_name.toUpperCase()} ${(det.confidence * 100).toFixed(0)}%`
      ctx.font = "bold 14px monospace"
      const textMetrics = ctx.measureText(label)
      const textHeight = 20
      const padding = 6

      ctx.fillStyle = det.color
      ctx.fillRect(x, y - textHeight - padding, textMetrics.width + padding * 2, textHeight + padding)

      // Draw label text
      ctx.fillStyle = "#000"
      ctx.fillText(label, x + padding, y - padding - 2)
    })

    // Draw crosshair in center
    ctx.strokeStyle = "rgba(255, 165, 0, 0.5)"
    ctx.lineWidth = 1
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    ctx.beginPath()
    ctx.moveTo(centerX - 20, centerY)
    ctx.lineTo(centerX + 20, centerY)
    ctx.moveTo(centerX, centerY - 20)
    ctx.lineTo(centerX, centerY + 20)
    ctx.stroke()

    // Draw frame info
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(canvas.width - 150, 10, 140, 60)
    ctx.fillStyle = "#FF9500"
    ctx.font = "bold 12px monospace"
    ctx.fillText(`FRAME: ${frameCountRef.current}`, canvas.width - 140, 28)
    ctx.fillText(`FPS: ${fps}`, canvas.width - 140, 44)
    ctx.fillText(`MODEL: YOLOv8`, canvas.width - 140, 60)
  }, [fps])

  // Animation loop
  const processFrame = useCallback(async () => {
    if (!isStreaming) return

    const now = performance.now()
    const elapsed = now - lastFrameTimeRef.current

    // Run at ~15 FPS for detection
    if (elapsed >= 66) {
      frameCountRef.current++
      fpsCounterRef.current++
      setFrameCount(frameCountRef.current)

      // Calculate FPS every second
      if (elapsed >= 1000) {
        setFps(Math.round(fpsCounterRef.current * (1000 / elapsed)))
        fpsCounterRef.current = 0
        lastFrameTimeRef.current = now
      }

      // Run detection and draw
      const result = await runDetection(frameCountRef.current)
      if (result) {
        drawDetections(result.detections)
      }
    }

    animationRef.current = requestAnimationFrame(processFrame)
  }, [isStreaming, runDetection, drawDetections])

  // Start streaming
  const startStreaming = useCallback(() => {
    if (isStreaming) return

    setIsLoading(true)
    setError("")
    setFrameCount(0)
    setDetectionHistory([])
    frameCountRef.current = 0
    fpsCounterRef.current = 0
    lastFrameTimeRef.current = performance.now()

    const video = videoRef.current
    if (video && selectedVideo) {
      video.src = selectedVideo
      video.load()
      
      video.onloadeddata = () => {
        video.play()
        setIsStreaming(true)
        setIsLoading(false)
        animationRef.current = requestAnimationFrame(processFrame)
      }

      video.onerror = () => {
        setError("Failed to load video")
        setIsLoading(false)
      }

      video.onended = () => {
        // Loop the video
        video.currentTime = 0
        video.play()
      }
    } else {
      // Demo mode without video
      setIsStreaming(true)
      setIsLoading(false)
      animationRef.current = requestAnimationFrame(processFrame)
    }
  }, [isStreaming, selectedVideo, processFrame])

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    const video = videoRef.current
    if (video) {
      video.pause()
      video.currentTime = 0
    }

    setIsStreaming(false)
    setDetection(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Auto-escalate scenario based on detections
  useEffect(() => {
    if (incidentMode && scenario !== "active_fire") {
      setScenario("active_fire")
    }
  }, [incidentMode, scenario])

  const alertLevelColors = {
    none: "border-[oklch(0.65_0.18_145)] text-[oklch(0.65_0.18_145)]",
    low: "border-[oklch(0.80_0.18_85)] text-[oklch(0.80_0.18_85)]",
    medium: "border-[oklch(0.70_0.20_45)] text-[oklch(0.70_0.20_45)]",
    high: "border-[oklch(0.60_0.20_35)] text-[oklch(0.60_0.20_35)]",
    critical: "bg-[oklch(0.55_0.22_25)] text-white animate-pulse",
  }

  return (
    <Card
      className={`border-2 ${incidentMode ? "animate-incident-flash border-[oklch(0.55_0.22_25)]" : "border-border"} bg-card`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Video className="h-5 w-5 text-[oklch(0.70_0.20_45)]" />
            Drone Feed - YOLO v8 Detection
          </CardTitle>
          <div className="flex items-center gap-2">
            {detection && (
              <Badge
                variant="outline"
                className={alertLevelColors[detection.alert_level]}
              >
                {detection.alert_level === "critical" ? "CRITICAL" :
                 detection.alert_level === "high" ? "HIGH" :
                 detection.alert_level === "medium" ? "MEDIUM" :
                 detection.alert_level === "low" ? "LOW" : "NORMAL"}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={
                isStreaming
                  ? "border-[oklch(0.65_0.18_145)] text-[oklch(0.65_0.18_145)]"
                  : "border-muted-foreground text-muted-foreground"
              }
            >
              {isStreaming ? "LIVE" : "OFFLINE"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scenario Selection */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground mr-2">Scenario:</span>
          {(["patrol", "smoke_plume", "active_fire"] as const).map((s) => (
            <Button
              key={s}
              variant={scenario === s ? "default" : "outline"}
              size="sm"
              onClick={() => setScenario(s)}
              disabled={isStreaming}
              className={scenario === s 
                ? "bg-[oklch(0.70_0.20_45)] text-black" 
                : "border-border hover:border-[oklch(0.70_0.20_45)]"
              }
            >
              {s === "patrol" ? "Patrol" : s === "smoke_plume" ? "Smoke Plume" : "Active Fire"}
            </Button>
          ))}
        </div>

        {/* Video Upload & Selection */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVideos}
            className="border-border"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh List
          </Button>
          <span className="text-sm text-muted-foreground flex items-center">
            <Upload className="mr-1 h-4 w-4" />
            Place videos in: /public/videos/
          </span>
        </div>

        {/* Video List */}
        {videos.length > 0 && (
          <ScrollArea className="h-20 rounded-md border border-border bg-background/50 p-2">
            <div className="space-y-1">
              {videos.map((video) => (
                <div
                  key={video.name}
                  className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                    selectedVideo === video.path
                      ? "bg-[oklch(0.70_0.20_45)]/20 text-[oklch(0.70_0.20_45)]"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => !isStreaming && setSelectedVideo(video.path)}
                >
                  <span className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    {video.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(video.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Video Feed Display */}
        <div className="relative aspect-video overflow-hidden rounded-lg border-2 border-border bg-black">
          {/* Hidden video element */}
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-contain"
            muted
            playsInline
          />
          
          {/* Canvas overlay for detections */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
          />

          {/* Placeholder when not streaming */}
          {!isStreaming && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-muted-foreground">
                <Crosshair className="mx-auto h-16 w-16 opacity-30 text-[oklch(0.70_0.20_45)]" />
                <p className="mt-2 text-sm">
                  {videos.length > 0 
                    ? "Select a video and start detection"
                    : "Demo mode - Start to see simulated detections"}
                </p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-[oklch(0.70_0.20_45)]" />
                <p className="mt-2 text-sm text-muted-foreground">Loading YOLO model...</p>
              </div>
            </div>
          )}

          {/* Detection Overlay */}
          {detection && isStreaming && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {detection.fire_detected && (
                    <Badge className="animate-pulse bg-[oklch(0.55_0.22_25)] text-white">
                      <Flame className="mr-1 h-3 w-3" />
                      FIRE: {(detection.max_confidence * 100).toFixed(0)}%
                    </Badge>
                  )}
                  {detection.smoke_detected && (
                    <Badge className="bg-[oklch(0.50_0.08_250)] text-white">
                      <Wind className="mr-1 h-3 w-3" />
                      SMOKE
                    </Badge>
                  )}
                  {!detection.fire_detected && !detection.smoke_detected && (
                    <Badge variant="outline" className="border-[oklch(0.65_0.18_145)] text-[oklch(0.65_0.18_145)]">
                      CLEAR
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Gauge className="h-3 w-3" />
                  {detection.processing_time_ms}ms
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          {!isStreaming ? (
            <Button
              onClick={startStreaming}
              disabled={isLoading}
              className="flex-1 bg-[oklch(0.70_0.20_45)] text-black hover:bg-[oklch(0.75_0.20_45)] font-semibold"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isLoading ? "Initializing..." : "Launch Drone & Start Detection"}
            </Button>
          ) : (
            <Button
              onClick={stopStreaming}
              variant="destructive"
              className="flex-1"
            >
              <Square className="mr-2 h-4 w-4" />
              Retrieve Drone
            </Button>
          )}
        </div>

        {/* Detection Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-md border border-border bg-background/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">Frames</p>
            <p className="text-lg font-bold font-mono text-foreground">
              {frameCount}
            </p>
          </div>
          <div className="rounded-md border border-border bg-background/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">FPS</p>
            <p className="text-lg font-bold font-mono text-[oklch(0.70_0.20_45)]">
              {fps}
            </p>
          </div>
          <div className="rounded-md border border-border bg-background/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">Detections</p>
            <p className={`text-lg font-bold font-mono ${detection?.detections.length ? "text-[oklch(0.55_0.22_25)]" : "text-foreground"}`}>
              {detection?.detections.length || 0}
            </p>
          </div>
          <div className="rounded-md border border-border bg-background/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">Latency</p>
            <p className="text-lg font-bold font-mono text-foreground">
              {detection?.processing_time_ms || 0}ms
            </p>
          </div>
        </div>

        {/* Detection History Mini Graph */}
        {isStreaming && detectionHistory.length > 0 && (
          <div className="rounded-md border border-border bg-background/50 p-2">
            <p className="text-xs text-muted-foreground mb-2">Detection History</p>
            <div className="flex items-end gap-0.5 h-8">
              {detectionHistory.slice(-50).map((entry, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all ${
                    entry.detected 
                      ? "bg-[oklch(0.55_0.22_25)]" 
                      : "bg-[oklch(0.65_0.18_145)]"
                  }`}
                  style={{ height: entry.detected ? "100%" : "20%" }}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
