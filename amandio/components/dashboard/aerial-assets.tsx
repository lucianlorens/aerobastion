"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane, Battery, Wifi, MapPin, Send } from "lucide-react"

type AssetStatus = "READY" | "STANDBY" | "IN_MISSION" | "MAINTENANCE"

interface Asset {
  id: string
  name: string
  type: "drone" | "aircraft"
  status: AssetStatus
  battery?: number
  location: string
  pilot?: string
}

const assets: Asset[] = [
  {
    id: "DA1",
    name: "Drone Alpha-1",
    type: "drone",
    status: "READY",
    battery: 98,
    location: "North Base",
  },
  {
    id: "DA2",
    name: "Drone Alpha-2",
    type: "drone",
    status: "IN_MISSION",
    battery: 67,
    location: "Sector 5-Bravo",
  },
  {
    id: "DB1",
    name: "Drone Beta-1",
    type: "drone",
    status: "READY",
    battery: 100,
    location: "South Base",
  },
  {
    id: "C01",
    name: "Canadair 01",
    type: "aircraft",
    status: "STANDBY",
    location: "Central Airfield",
    pilot: "Cap. Silva",
  },
  {
    id: "C02",
    name: "Canadair 02",
    type: "aircraft",
    status: "MAINTENANCE",
    location: "Hangar 3",
  },
  {
    id: "H01",
    name: "Helicopter 01",
    type: "aircraft",
    status: "STANDBY",
    location: "North Heliport",
    pilot: "Lt. Costa",
  },
]

const statusConfig: Record<AssetStatus, { color: string; bg: string }> = {
  READY: { color: "text-[oklch(0.65_0.18_145)]", bg: "bg-[oklch(0.65_0.18_145/0.2)]" },
  STANDBY: { color: "text-primary", bg: "bg-primary/20" },
  IN_MISSION: { color: "text-[oklch(0.60_0.12_200)]", bg: "bg-[oklch(0.60_0.12_200/0.2)]" },
  MAINTENANCE: { color: "text-muted-foreground", bg: "bg-secondary" },
}

const statusDisplay: Record<AssetStatus, string> = {
  READY: "READY",
  STANDBY: "STANDBY",
  IN_MISSION: "IN MISSION",
  MAINTENANCE: "MAINTENANCE",
}

interface AerialAssetsProps {
  isIncidentMode: boolean
  onLaunchDrone?: () => void
}

export function AerialAssets({ isIncidentMode, onLaunchDrone }: AerialAssetsProps) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Plane className="h-5 w-5 text-primary" />
            Aerial Assets Status
          </CardTitle>
            <Badge variant="outline" className="border-[oklch(0.65_0.18_145/0.5)] text-[oklch(0.65_0.18_145)]">
            {assets.filter(a => a.status === "READY" || a.status === "STANDBY").length} AVAILABLE
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={`flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30 transition-all ${
                isIncidentMode && (asset.status === "READY" || asset.status === "STANDBY")
                  ? "border-primary/50 bg-primary/5"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${statusConfig[asset.status].bg}`}>
                  {asset.type === "drone" ? (
                    <Wifi className={`h-4 w-4 ${statusConfig[asset.status].color}`} />
                  ) : (
                    <Plane className={`h-4 w-4 ${statusConfig[asset.status].color}`} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{asset.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">#{asset.id}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{asset.location}</span>
                    {asset.pilot && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{asset.pilot}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {asset.battery !== undefined && (
                  <div className="flex items-center gap-1">
                    <Battery className={`h-4 w-4 ${asset.battery > 50 ? "text-[oklch(0.65_0.18_145)]" : asset.battery > 20 ? "text-primary" : "text-[oklch(0.55_0.22_25)]"}`} />
                    <span className="text-xs font-mono">{asset.battery}%</span>
                  </div>
                )}
                <Badge 
                  variant="secondary"
                  className={`${statusConfig[asset.status].bg} ${statusConfig[asset.status].color} border-0 text-[10px] font-semibold`}
                >
                  {statusDisplay[asset.status]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
