"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Flame, Radio, Shield, Plane } from "lucide-react"

interface MissionTriggerProps {
  isIncidentMode: boolean
  onTrigger: () => void
  onLaunchDrone?: () => void
}

export function MissionTrigger({ isIncidentMode, onTrigger, onLaunchDrone }: MissionTriggerProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleClick = () => {
    if (isIncidentMode) {
      onTrigger()
      setIsConfirming(false)
      return
    }

    if (!isConfirming) {
      setIsConfirming(true)
      setTimeout(() => setIsConfirming(false), 5000)
      return
    }

    onTrigger()
    setIsConfirming(false)
  }

  return (
    <Card className={`border-2 transition-all ${
      isIncidentMode 
        ? "border-[oklch(0.55_0.22_25)] bg-[oklch(0.55_0.22_25/0.1)]" 
        : isConfirming
        ? "border-primary bg-primary/5"
        : "border-border/50 bg-card/80"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isIncidentMode ? (
              <div className="p-3 rounded-full bg-[oklch(0.55_0.22_25)] animate-pulse">
                <Flame className="h-6 w-6 text-white" />
              </div>
            ) : (
              <div className="p-3 rounded-full bg-secondary">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h3 className={`font-bold text-lg ${isIncidentMode ? "text-[oklch(0.55_0.22_25)]" : "text-foreground"}`}>
                {isIncidentMode ? "INCIDENT MODE ACTIVE" : "Mission Control"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isIncidentMode 
                  ? "All emergency protocols activated"
                  : isConfirming 
                  ? "Click again to confirm activation"
                  : "Ready to confirm fire authorization"
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isIncidentMode && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.55_0.22_25/0.2)] border border-[oklch(0.55_0.22_25/0.5)]">
                  <Radio className="h-4 w-4 text-[oklch(0.55_0.22_25)] animate-pulse" />
                  <span className="text-sm font-mono text-[oklch(0.55_0.22_25)]">TRANSMITTING</span>
                </div>
                <Button
                  size="lg"
                  onClick={onLaunchDrone}
                  className="h-14 px-6 font-bold bg-[oklch(0.50_0.15_280)] hover:bg-[oklch(0.45_0.15_280)] text-white"
                >
                  <Plane className="mr-2 h-5 w-5" />
                  VIEW DRONE FEED
                </Button>
              </>
            )}

            <Button
              size="lg"
              onClick={handleClick}
              className={`min-w-[280px] h-14 font-bold text-base transition-all ${
                isIncidentMode
                  ? "bg-[oklch(0.65_0.18_145)] hover:bg-[oklch(0.60_0.18_145)] text-white"
                  : isConfirming
                  ? "bg-[oklch(0.55_0.22_25)] hover:bg-[oklch(0.50_0.22_25)] text-white animate-pulse"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
            >
              {isIncidentMode ? (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  END INCIDENT MODE
                </>
              ) : isConfirming ? (
                <>
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  CONFIRM ACTIVATION
                </>
              ) : (
                <>
                  <Flame className="mr-2 h-5 w-5" />
                  CONFIRM FIRE & ACTIVATE PILOT
                </>
              )}
            </Button>
          </div>
        </div>

        {isIncidentMode && (
          <div className="mt-4 pt-4 border-t border-[oklch(0.55_0.22_25/0.3)]">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Assigned Assets", value: "3", status: "active" },
                { label: "Response Time", value: "4:32", status: "counting" },
                { label: "Risk Area", value: "2.4 km²", status: "warning" },
                { label: "Threat Level", value: "SEVERE", status: "critical" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold font-mono ${
                    stat.status === "critical" ? "text-[oklch(0.55_0.22_25)]" :
                    stat.status === "warning" ? "text-primary" :
                    "text-foreground"
                  }`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
