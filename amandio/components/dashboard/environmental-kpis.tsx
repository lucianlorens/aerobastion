"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Droplets, Thermometer, Wind, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KPIData {
  label: string
  value: string
  unit: string
  status: "normal" | "warning" | "critical"
  trend: "up" | "down" | "stable"
  icon: React.ElementType
  description: string
}

const kpis: KPIData[] = [
  {
    label: "Teor de Humidade do Combustível",
    value: "12",
    unit: "%",
    status: "critical",
    trend: "down",
    icon: Droplets,
    description: "Vegetação extremamente seca",
  },
  {
    label: "Temperatura Ambiente",
    value: "38",
    unit: "°C",
    status: "warning",
    trend: "up",
    icon: Thermometer,
    description: "Acima da média sazonal",
  },
  {
    label: "Humidade do Ar",
    value: "22",
    unit: "%",
    status: "warning",
    trend: "down",
    icon: Wind,
    description: "Condições de baixa humidade",
  },
]

const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
  if (trend === "up") return <TrendingUp className="h-3 w-3" />
  if (trend === "down") return <TrendingDown className="h-3 w-3" />
  return <Minus className="h-3 w-3" />
}

export function EnvironmentalKPIs() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        Environmental KPIs
      </h3>
      <div className="grid gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    kpi.status === "critical" 
                      ? "bg-[oklch(0.55_0.22_25/0.2)] text-[oklch(0.55_0.22_25)]"
                      : kpi.status === "warning"
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-2xl font-bold ${
                        kpi.status === "critical" 
                          ? "text-[oklch(0.55_0.22_25)]"
                          : kpi.status === "warning"
                          ? "text-primary"
                          : "text-foreground"
                      }`}>
                        {kpi.value}
                      </span>
                      <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Badge 
                    variant={kpi.status === "critical" ? "destructive" : kpi.status === "warning" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {kpi.status === "critical" ? "CRITICAL" : kpi.status === "warning" ? "WARNING" : "NORMAL"}
                  </Badge>
                  <div className={`flex items-center gap-0.5 text-xs ${
                    kpi.trend === "up" ? "text-[oklch(0.55_0.22_25)]" : kpi.trend === "down" ? "text-[oklch(0.60_0.12_200)]" : "text-muted-foreground"
                  }`}>
                    <TrendIcon trend={kpi.trend} />
                    <span>{kpi.trend === "up" ? "Rising" : kpi.trend === "down" ? "Falling" : "Stable"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
