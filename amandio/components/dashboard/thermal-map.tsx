"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Wind, MapPin, Thermometer, Satellite } from "lucide-react"

interface ThermalMapProps {
  isIncidentMode: boolean
}

export function ThermalMap({ isIncidentMode }: ThermalMapProps) {
  const windDirection = 225
  const windSpeed = 18

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Satellite className="h-5 w-5 text-primary" />
            Thermal Map - Sector 7-Alpha
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/50 text-primary">
              SAT-LINK ACTIVE
            </Badge>
            <Badge variant="secondary" className="bg-secondary/80">
              IR THERMAL
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-[oklch(0.10_0.02_250)] border border-border/50">
          {/* Topographic grid overlay */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.70 0.20 45)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Terrain contours */}
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,30 50,45 T100,40" fill="none" stroke="oklch(0.50 0.08 145)" strokeWidth="0.5" />
            <path d="M0,60 Q30,45 55,55 T100,50" fill="none" stroke="oklch(0.45 0.08 145)" strokeWidth="0.5" />
            <path d="M0,70 Q35,55 60,65 T100,60" fill="none" stroke="oklch(0.40 0.08 145)" strokeWidth="0.5" />
          </svg>

          {/* Thermal heat zones */}
          <div className="absolute top-1/3 left-1/4 w-32 h-24 rounded-full bg-gradient-radial from-[oklch(0.55_0.22_25/0.4)] via-[oklch(0.70_0.20_45/0.2)] to-transparent blur-xl" />
          <div className="absolute top-1/2 left-1/3 w-20 h-16 rounded-full bg-gradient-radial from-[oklch(0.80_0.18_85/0.3)] via-transparent to-transparent blur-lg" />

          {/* Fire Ignition Point */}
          <div className="absolute top-[35%] left-[30%] flex items-center justify-center">
            {isIncidentMode && (
              <>
                <div className="absolute w-16 h-16 rounded-full border-2 border-[oklch(0.55_0.22_25)] animate-wave-pulse" />
                <div className="absolute w-12 h-12 rounded-full border-2 border-[oklch(0.55_0.22_25)] animate-wave-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute w-8 h-8 rounded-full border-2 border-[oklch(0.55_0.22_25)] animate-wave-pulse" style={{ animationDelay: '1s' }} />
              </>
            )}
            <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${isIncidentMode ? 'bg-[oklch(0.55_0.22_25)] animate-pulse-glow' : 'bg-[oklch(0.70_0.20_45)]'}`}>
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-xs font-mono text-[oklch(0.55_0.22_25)] bg-[oklch(0.12_0.005_250/0.9)] px-2 py-0.5 rounded">
                IGNITION POINT
              </span>
            </div>
          </div>

          {/* Sensor towers */}
          {[
            { id: "T01", top: "20%", left: "15%" },
            { id: "T02", top: "60%", left: "20%" },
            { id: "T03", top: "25%", left: "70%" },
            { id: "T04", top: "70%", left: "75%" },
          ].map((tower) => (
            <div
              key={tower.id}
              className="absolute flex flex-col items-center"
              style={{ top: tower.top, left: tower.left }}
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-mono text-muted-foreground mt-0.5">{tower.id}</span>
            </div>
          ))}

          {/* Wind direction indicator */}
          <div className="absolute top-4 right-4 bg-[oklch(0.16_0.008_250/0.95)] rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
              <Wind className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">WIND VECTOR</span>
            </div>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full border-2 border-primary/50 flex items-center justify-center"
                style={{ transform: `rotate(${windDirection}deg)` }}
              >
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-primary -translate-y-0.5" />
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">{windSpeed} km/h</div>
                <div className="text-xs text-muted-foreground">{windDirection}° SO</div>
              </div>
            </div>
          </div>

          {/* Temperature legend */}
          <div className="absolute bottom-4 left-4 bg-[oklch(0.16_0.008_250/0.95)] rounded-lg p-2 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
              <Thermometer className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">THERMAL SCALE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-24 rounded-full bg-gradient-to-r from-[oklch(0.60_0.12_200)] via-[oklch(0.80_0.18_85)] to-[oklch(0.55_0.22_25)]" />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
              <span>20°C</span>
              <span>60°C</span>
              <span>100°C+</span>
            </div>
          </div>

          {/* Coordinates */}
          <div className="absolute bottom-4 right-4 text-[10px] font-mono text-muted-foreground bg-[oklch(0.16_0.008_250/0.9)] px-2 py-1 rounded">
            LAT: 38.7223° N | LON: -9.1393° W
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
