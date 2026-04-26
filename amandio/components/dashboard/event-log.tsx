"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Eye, Radio, Cpu, Shield, Flame } from "lucide-react"

type EventType = "sensor" | "ai" | "system" | "alert" | "mission"

interface LogEvent {
  id: string
  time: string
  type: EventType
  source: string
  message: string
  severity: "info" | "warning" | "critical"
}

const initialEvents: LogEvent[] = [
  {
    id: "1",
    time: "12:06:42",
    type: "ai",
    source: "AI VISION",
    message: "94% probability of smoke plume detected",
    severity: "critical",
  },
  {
    id: "2",
    time: "12:06:38",
    type: "sensor",
  source: "SENSOR TOWER 04",
  message: "CO spike detected: 42ppm",
    severity: "critical",
  },
  {
    id: "3",
    time: "12:06:15",
    type: "sensor",
  source: "SENSOR TOWER 04",
  message: "Thermal anomaly confirmed +15°C above baseline",
    severity: "warning",
  },
  {
    id: "4",
    time: "12:05:52",
    type: "system",
  source: "DRONE ALPHA-2",
  message: "Surveillance position reached in Sector 5-B",
    severity: "info",
  },
  {
    id: "5",
    time: "12:05:30",
    type: "ai",
  source: "PREDICTIVE MODEL",
  message: "Spread pattern calculated: SW direction, 2.3km/h",
    severity: "warning",
  },
  {
    id: "6",
    time: "12:05:12",
    type: "sensor",
  source: "SENSOR TOWER 03",
  message: "Relative humidity dropped below 25%",
    severity: "warning",
  },
  {
    id: "7",
    time: "12:04:45",
    type: "system",
  source: "COMMAND CENTER",
  message: "Alert level raised for Sector 7-Alpha",
    severity: "warning",
  },
  {
    id: "8",
    time: "12:04:20",
    type: "sensor",
  source: "THERMAL SAT",
  message: "Infrared image updated - anomaly confirmed",
    severity: "info",
  },
]

const newEventTemplates: Omit<LogEvent, "id" | "time">[] = [
  { type: "sensor", source: "SENSOR TOWER 02", message: "Wind speed increased to 22km/h", severity: "warning" },
  { type: "ai", source: "AI VISION", message: "Confirmation of visible flames - confidence 98%", severity: "critical" },
  { type: "system", source: "DRONE ALPHA-1", message: "Activation requested - awaiting confirmation", severity: "info" },
  { type: "sensor", source: "SENSOR TOWER 04", message: "CO₂ rising rapidly: +45ppm/min", severity: "critical" },
  { type: "ai", source: "PREDICTIVE MODEL", message: "Risk area expanded by 340m²", severity: "warning" },
]

const eventIcons: Record<EventType, React.ElementType> = {
  sensor: Radio,
  ai: Cpu,
  system: Shield,
  alert: AlertTriangle,
  mission: Flame,
}

const severityColors: Record<string, string> = {
  info: "text-muted-foreground",
  warning: "text-primary",
  critical: "text-[oklch(0.55_0.22_25)]",
}

export function EventLog({ isIncidentMode }: { isIncidentMode: boolean }) {
  const [events, setEvents] = useState<LogEvent[]>(initialEvents)

  useEffect(() => {
    if (!isIncidentMode) return

    const interval = setInterval(() => {
      const template = newEventTemplates[Math.floor(Math.random() * newEventTemplates.length)]
      const now = new Date()
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      
      setEvents(prev => [{
        id: Date.now().toString(),
        time,
        ...template
      }, ...prev.slice(0, 14)])
    }, 3000)

    return () => clearInterval(interval)
  }, [isIncidentMode])

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Eye className="h-5 w-5 text-primary" />
            Event Log
          </CardTitle>
          <Badge variant="secondary" className="bg-secondary/80 font-mono text-xs">
            {events.length} EVENTS
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-2">
            {events.map((event, index) => {
              const Icon = eventIcons[event.type]
              return (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
                    index === 0 && isIncidentMode ? "bg-[oklch(0.55_0.22_25/0.1)] border border-[oklch(0.55_0.22_25/0.3)]" : "bg-secondary/20"
                  }`}
                >
                  <div className={`mt-0.5 ${severityColors[event.severity]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono text-muted-foreground">[{event.time}]</span>
                              <span className={`text-xs font-semibold ${severityColors[event.severity]}`}>
                                {event.source}:
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 mt-0.5">{event.message}</p>
                  </div>
                  {event.severity === "critical" && (
                    <Badge variant="destructive" className="text-[9px] shrink-0">
                      CRITICAL
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
