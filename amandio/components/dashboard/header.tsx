"use client"

import { Badge } from "@/components/ui/badge"
import { Shield, Wifi, Clock, MapPin, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

export function Header({ isIncidentMode }: { isIncidentMode: boolean }) {
  const [time, setTime] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString("pt-PT", { 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit" 
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className={`border-b transition-all ${
      isIncidentMode 
        ? "border-[oklch(0.55_0.22_25)] bg-[oklch(0.55_0.22_25/0.05)]" 
        : "border-border/50 bg-card/50"
    } backdrop-blur-sm`}>
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isIncidentMode ? "bg-[oklch(0.55_0.22_25)]" : "bg-primary"}`}>
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-primary">AERO</span>
                  <span className="text-foreground">BASTION</span>
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Fire Command & Control Center
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-border/50" />

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-[oklch(0.65_0.18_145/0.5)] text-[oklch(0.65_0.18_145)] gap-1">
                <Wifi className="h-3 w-3" />
                ALL SYSTEMS OPERATIONAL
              </Badge>
              <Badge variant="secondary" className="gap-1 font-mono">
                <MapPin className="h-3 w-3" />
                CENTRAL REGION, PT
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isIncidentMode && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[oklch(0.55_0.22_25/0.2)] border border-[oklch(0.55_0.22_25/0.5)] animate-pulse">
                <AlertTriangle className="h-5 w-5 text-[oklch(0.55_0.22_25)]" />
                <span className="font-bold text-[oklch(0.55_0.22_25)]">INCIDENT MODE ACTIVE</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-lg tabular-nums">{time}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isIncidentMode ? "bg-[oklch(0.55_0.22_25)] animate-pulse" : "bg-[oklch(0.65_0.18_145)]"}`} />
              <span className="text-xs font-medium text-muted-foreground">
                {isIncidentMode ? "ALERT" : "SURVEILLANCE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isIncidentMode && (
        <div className="h-1 bg-gradient-to-r from-[oklch(0.55_0.22_25)] via-primary to-[oklch(0.55_0.22_25)] animate-pulse" />
      )}
    </header>
  )
}
