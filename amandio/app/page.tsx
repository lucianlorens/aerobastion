"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { GasAnalyticsCard } from "@/components/dashboard/gas-analytics-card"
import { ThermalMap } from "@/components/dashboard/thermal-map"
import { EnvironmentalKPIs } from "@/components/dashboard/environmental-kpis"
import { AerialAssets } from "@/components/dashboard/aerial-assets"
import { EventLog } from "@/components/dashboard/event-log"
import { MissionTrigger } from "@/components/dashboard/mission-trigger"
import { DroneVideoFeed } from "@/components/dashboard/drone-video-feed"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function FireCommandDashboard() {
  const [isIncidentMode, setIsIncidentMode] = useState(false)
  const [isDroneFeedOpen, setIsDroneFeedOpen] = useState(false)

  const handleIncidentTrigger = () => {
    if (!isIncidentMode) {
      // Activating incident mode - open drone feed popup
      setIsIncidentMode(true)
      setIsDroneFeedOpen(true)
    } else {
      // Deactivating incident mode - close drone feed
      setIsIncidentMode(false)
      setIsDroneFeedOpen(false)
    }
  }

  return (
    <div className={`min-h-screen bg-background transition-all duration-500 ${
      isIncidentMode ? "border-4 border-[oklch(0.55_0.22_25)] animate-incident-flash" : ""
    }`}>
      <Header isIncidentMode={isIncidentMode} />
      
      <main className="p-6 space-y-6">
        {/* Mission Control */}
        <MissionTrigger 
          isIncidentMode={isIncidentMode} 
          onTrigger={handleIncidentTrigger}
          onLaunchDrone={() => setIsDroneFeedOpen(true)}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Gas Analytics & KPIs */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <GasAnalyticsCard isIncidentMode={isIncidentMode} />
            <EnvironmentalKPIs />
          </div>

          {/* Center Column - Thermal Map */}
          <div className="col-span-12 lg:col-span-6">
            <ThermalMap isIncidentMode={isIncidentMode} />
          </div>

          {/* Right Column - Assets & Events */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <AerialAssets isIncidentMode={isIncidentMode} onLaunchDrone={() => setIsDroneFeedOpen(true)} />
            <EventLog isIncidentMode={isIncidentMode} />
          </div>
        </div>
      </main>

      {/* Drone Feed Popup */}
      <Dialog open={isDroneFeedOpen} onOpenChange={setIsDroneFeedOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 bg-card border-2 border-[oklch(0.55_0.22_25)] overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-[oklch(0.55_0.22_25/0.5)] bg-[oklch(0.55_0.22_25/0.1)]">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.55_0.22_25)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[oklch(0.55_0.22_25)]"></span>
              </span>
              <span className="text-[oklch(0.55_0.22_25)]">DRONE FEED - YOLO v8 REAL-TIME DETECTION</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4">
            <DroneVideoFeed 
              incidentMode={isIncidentMode}
              onFireDetected={(detected, confidence) => {
                if (detected && confidence > 0.8) {
              console.log("[v0] High confidence fire detected:", confidence)
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer Status Bar */}
      <footer className={`fixed bottom-0 left-0 right-0 border-t px-6 py-2 backdrop-blur-sm transition-all ${
        isIncidentMode 
          ? "border-[oklch(0.55_0.22_25)] bg-[oklch(0.55_0.22_25/0.05)]"
          : "border-border/50 bg-card/80"
      }`}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-6">
            <span>System Uptime: <span className="text-foreground font-mono">99.97%</span></span>
            <span>Sensor Towers: <span className="text-[oklch(0.65_0.18_145)] font-mono">12/12 Online</span></span>
            <span>Sat Coverage: <span className="text-foreground font-mono">100%</span></span>
            <span>Network Latency: <span className="text-foreground font-mono">12ms</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span>Last Update: <span className="font-mono">2s ago</span></span>
            <span className="text-primary font-semibold">AEROBASTION v2.4.1</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
