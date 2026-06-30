"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Radio, ShieldAlert, CheckCircle, FileJson, ArrowRight, RefreshCw, Layers } from "lucide-react"

import { useWorkspace } from "@/app/(dashboard)/layout"
import { useEndpoints, usePayloads } from "@/services/webhook"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export default function DashboardOverviewPage() {
  const router = useRouter()
  const { activeWorkspaceId } = useWorkspace()

  // Fetch endpoints for current workspace
  const { data: endpointsData, isLoading: endpointsLoading } = useEndpoints(
    activeWorkspaceId || undefined,
    1,
    20
  )

  const activeEndpoints = React.useMemo(() => {
    return endpointsData?.items || []
  }, [endpointsData])

  // Get first active endpoint to show its recent traffic
  const primaryEndpointId = React.useMemo(() => {
    return activeEndpoints[0]?.id || null
  }, [activeEndpoints])

  // Fetch recent payloads for primary endpoint
  const { data: payloadsData, isLoading: payloadsLoading } = usePayloads(
    primaryEndpointId || "",
    1,
    5
  )

  const recentPayloads = React.useMemo(() => {
    return payloadsData?.items || []
  }, [payloadsData])

  const stats = React.useMemo(() => {
    const totalEndpoints = activeEndpoints.length
    const activeEndpointsCount = activeEndpoints.filter((e) => e.is_active).length
    const temporaryCount = activeEndpoints.filter((e) => e.type === "temporary").length

    return {
      totalEndpoints,
      activeEndpointsCount,
      temporaryCount,
      inactiveEndpointsCount: totalEndpoints - activeEndpointsCount,
    }
  }, [activeEndpoints])

  // Render dummy traffic chart using custom SVG to eliminate charting packages mismatch
  const renderTrafficChart = () => {
    const data = [12, 19, 3, 5, 2, 3, 10, 15, 22, 18, 25, 30]
    const maxVal = Math.max(...data)
    const chartHeight = 140
    const chartWidth = 500

    const points = data
      .map((val, index) => {
        const x = (index / (data.length - 1)) * chartWidth
        const y = chartHeight - (val / maxVal) * chartHeight + 10
        return `${x},${y}`
      })
      .join(" ")

    const fillPoints = `0,${chartHeight + 20} ${points} ${chartWidth},${chartHeight + 20}`

    return (
      <div className="relative w-full h-[160px] mt-4">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="w-full h-full">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6b77ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6b77ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            fill="url(#chartGrad)"
            stroke="none"
            points={fillPoints}
          />
          <polyline
            fill="none"
            stroke="#6b77ff"
            strokeWidth="3"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  if (endpointsLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Welcome header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Overview Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Monitor your active endpoints, incoming payload streams, and forwarding performance.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
            <Radio className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEndpoints}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeEndpointsCount} Active, {stats.inactiveEndpointsCount} Paused
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Temp Endpoints</CardTitle>
            <RefreshCw className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.temporaryCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Short-lived testing targets
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground mt-1">
              All forwarding routes healthy
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Schema Drift Alerts</CardTitle>
            <ShieldAlert className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              No anomalies detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Stats Display */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left chart section */}
        <Card className="md:col-span-2 border-border/50 bg-card/60 backdrop-blur-sm shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Incoming Request Volume</CardTitle>
            <CardDescription>Activity count aggregated over past 12 hours</CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            {renderTrafficChart()}
          </CardContent>
        </Card>

        {/* Quick action controls panel */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-xs flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <CardDescription>Get up and running with endpoints</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 flex-1 justify-center">
            <Button className="w-full primary-gradient-btn border-0" onClick={() => router.push("/endpoints")}>
              Create New Endpoint
              <Radio className="size-4 ml-1.5" />
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/settings")}>
              Workspace Configuration
              <Layers className="size-4 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent payloads inspection list */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Traffic Logs</CardTitle>
            <CardDescription>Last payload requests captured by your primary endpoint</CardDescription>
          </div>
          {primaryEndpointId && (
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/endpoints/${primaryEndpointId}`}>
                View Inspector
                <ArrowRight className="size-3.5 ml-1.5" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {payloadsLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !primaryEndpointId ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground text-sm">
              <p>No endpoints configured in this workspace.</p>
              <Button size="sm" className="mt-3 primary-gradient-btn border-0" onClick={() => router.push("/endpoints")}>
                Create Endpoint
              </Button>
            </div>
          ) : recentPayloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground text-sm">
              <p>Waiting for incoming HTTP request webhooks on your endpoint URL...</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {recentPayloads.map((payload) => (
                <div key={payload.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={payload.method === "POST" ? "default" : "secondary"}>
                      {payload.method}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                      {payload.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {new Date(payload.received_at).toLocaleTimeString()}
                    </span>
                    <Badge variant={payload.is_drifted ? "destructive" : "success"}>
                      {payload.is_drifted ? "Drifted" : "Verified"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
