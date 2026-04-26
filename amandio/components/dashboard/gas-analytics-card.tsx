"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { Activity, AlertTriangle } from "lucide-react"

interface GasDataPoint {
  time: string
  co: number
  co2: number
}

const generateInitialData = (): GasDataPoint[] => {
  const data: GasDataPoint[] = []
  for (let i = 0; i < 20; i++) {
    data.push({
      time: `${i}s`,
      co: 15 + Math.random() * 10,
      co2: 400 + Math.random() * 50,
    })
  }
  return data
}

export function GasAnalyticsCard({ isIncidentMode }: { isIncidentMode: boolean }) {
  const [data, setData] = useState<GasDataPoint[]>(generateInitialData())
  const [coLevel, setCoLevel] = useState(18)
  const [co2Level, setCo2Level] = useState(425)

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newData = [...prev.slice(1)]
        const spike = isIncidentMode ? Math.random() > 0.5 : Math.random() > 0.85
        const newCo = spike ? 35 + Math.random() * 25 : 15 + Math.random() * 10
        const newCo2 = spike ? 550 + Math.random() * 100 : 400 + Math.random() * 50
        
        setCoLevel(Math.round(newCo))
        setCo2Level(Math.round(newCo2))
        
        newData.push({
          time: `${Date.now() % 100}s`,
          co: newCo,
          co2: newCo2,
        })
        return newData
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isIncidentMode])

  const coStatus = coLevel > 35 ? "CRITICAL" : coLevel > 25 ? "WARNING" : "NORMAL"
  const co2Status = co2Level > 600 ? "CRITICAL" : co2Level > 500 ? "WARNING" : "NORMAL"

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Activity className="h-5 w-5 text-primary" />
            Real-time Gas Analysis
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            TRANSMITTING
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Carbon Monoxide (CO)</span>
              <Badge 
                variant={coStatus === "CRITICAL" ? "destructive" : coStatus === "WARNING" ? "default" : "secondary"}
                className={coStatus === "CRITICAL" ? "animate-pulse" : ""}
              >
                {coStatus}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${coLevel > 35 ? "text-[oklch(0.55_0.22_25)]" : coLevel > 25 ? "text-primary" : "text-foreground"}`}>
                {coLevel}
              </span>
              <span className="text-sm text-muted-foreground">ppm</span>
            </div>
            {coLevel > 25 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-[oklch(0.55_0.22_25)]">
                <AlertTriangle className="h-3 w-3" />
                Elevated levels detected
              </div>
            )}
          </div>
          
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">CO₂ Concentration</span>
              <Badge 
                variant={co2Status === "CRITICAL" ? "destructive" : co2Status === "WARNING" ? "default" : "secondary"}
                className={co2Status === "CRITICAL" ? "animate-pulse" : ""}
              >
                {co2Status}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${co2Level > 600 ? "text-[oklch(0.55_0.22_25)]" : co2Level > 500 ? "text-primary" : "text-foreground"}`}>
                {co2Level}
              </span>
              <span className="text-sm text-muted-foreground">ppm</span>
            </div>
            {co2Level > 500 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-[oklch(0.55_0.22_25)]">
                <AlertTriangle className="h-3 w-3" />
                Above baseline threshold
              </div>
            )}
          </div>
        </div>

        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="coGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.70 0.20 45)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.70 0.20 45)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.22 25)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.55 0.22 25)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                tick={{ fill: 'oklch(0.65 0.02 250)', fontSize: 10 }}
                axisLine={{ stroke: 'oklch(0.28 0.015 250)' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'oklch(0.65 0.02 250)', fontSize: 10 }}
                axisLine={{ stroke: 'oklch(0.28 0.015 250)' }}
                tickLine={false}
                domain={[0, 80]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'oklch(0.16 0.008 250)', 
                  border: '1px solid oklch(0.28 0.015 250)',
                  borderRadius: '8px',
                  color: 'oklch(0.92 0.01 250)'
                }}
              />
              <Area
                type="monotone"
                dataKey="co"
                stroke="oklch(0.70 0.20 45)"
                strokeWidth={2}
                fill="url(#coGradient)"
                name="CO (ppm)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
