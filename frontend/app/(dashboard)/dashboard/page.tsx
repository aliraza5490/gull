"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Radio,
  ShieldAlert,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Layers,
  Activity,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Hash,
  Terminal,
  Globe,
  Filter,
} from "lucide-react"

import { useWorkspace } from "@/app/(dashboard)/layout"
import { useEndpoints, useWorkspacePayloads, useWorkspaceStats } from "@/services/webhook"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { cn, getReceiverUrl } from "@/lib/utils"
import { CopyButton } from "@/components/copy-button"

const getMethodBadgeClass = (method: string) => {
  const m = method?.toUpperCase() || ""
  switch (m) {
    case "GET":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
    case "POST":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
    case "PUT":
    case "PATCH":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
    case "DELETE":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
    default:
      return "bg-secondary text-secondary-foreground border-border"
  }
}

export default function DashboardOverviewPage() {
  const router = useRouter()
  const { activeWorkspaceId } = useWorkspace()
  const [selectedEndpointFilter, setSelectedEndpointFilter] = React.useState<string>("all")

  // Fetch endpoints for current workspace
  const { data: endpointsData, isLoading: endpointsLoading } = useEndpoints(
    activeWorkspaceId || undefined,
    1,
    50
  )

  // Fetch stats for current workspace
  const { data: statsData, isLoading: statsLoading } = useWorkspaceStats(
    activeWorkspaceId || undefined
  )

  const activeEndpoints = React.useMemo(() => {
    return endpointsData?.items || []
  }, [endpointsData])

  const endpointsMap = React.useMemo(() => {
    const map = new Map<string, typeof activeEndpoints[0]>()
    activeEndpoints.forEach((ep) => map.set(ep.id, ep))
    return map
  }, [activeEndpoints])

  const selectedEndpointObj = React.useMemo(() => {
    if (selectedEndpointFilter === "all") return null
    return endpointsMap.get(selectedEndpointFilter) || null
  }, [selectedEndpointFilter, endpointsMap])

  // Fetch recent payloads across ALL endpoints in the workspace (or filtered by selected endpoint)
  const { data: payloadsData, isLoading: payloadsLoading } = useWorkspacePayloads(
    activeWorkspaceId || "",
    1,
    5,
    selectedEndpointFilter
  )

  const recentPayloads = React.useMemo(() => {
    return payloadsData?.items || []
  }, [payloadsData])

  const stats = React.useMemo(() => {
    return {
      totalEndpoints: statsData?.total_endpoints ?? 0,
      activeEndpointsCount: statsData?.active_endpoints ?? 0,
      temporaryCount: statsData?.temp_endpoints ?? 0,
      inactiveEndpointsCount: statsData?.paused_endpoints ?? 0,
      successRate: statsData?.success_rate ?? 100,
      driftAlertsCount: statsData?.drift_alerts_count ?? 0,
    }
  }, [statsData])

  // Render traffic chart using workspace statistics
  const renderTrafficChart = () => {
    const chartData = statsData?.traffic_chart || []

    const chartConfig = {
      requests: {
        label: "Requests",
        color: "var(--primary)",
      },
    } satisfies ChartConfig

    return (
      <div className="w-full h-[220px] mt-4">
        <ChartContainer config={chartConfig} className="w-full h-full min-h-[220px]">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: -20,
              right: 12,
              top: 10,
              bottom: 30,
            }}
          >
            <defs>
              <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-requests)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-requests)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={22}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              dataKey="requests"
              type="natural"
              fill="url(#fillRequests)"
              fillOpacity={0.4}
              stroke="var(--color-requests)"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </div>
    )
  }

  if (endpointsLoading || statsLoading) {
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
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successRate >= 95 ? "All forwarding routes healthy" : "Some routes experiencing issues"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Schema Drift Alerts</CardTitle>
            <ShieldAlert className={stats.driftAlertsCount > 0 ? "size-4 text-amber-500 animate-pulse" : "size-4 text-muted-foreground"} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.driftAlertsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.driftAlertsCount > 0 ? `${stats.driftAlertsCount} anomalies detected` : "No anomalies detected"}
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
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-xs transition-all duration-200">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5 shrink-0">
              <Activity className="size-4.5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold">Recent Traffic Logs</CardTitle>
                <Badge variant="secondary" className="font-semibold text-xs bg-primary/10 text-primary border-primary/20">
                  {selectedEndpointFilter === "all" ? "All Endpoints" : selectedEndpointObj?.name || "Filtered"}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Real-time payload stream across workspace endpoints
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {activeEndpoints.length > 0 && (
              <div className="flex items-center gap-1.5 bg-muted/40 border border-border/50 rounded-lg px-2.5 py-1">
                <Filter className="size-3.5 text-muted-foreground" />
                <select
                  value={selectedEndpointFilter}
                  onChange={(e) => setSelectedEndpointFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-popover text-popover-foreground">All Endpoints ({activeEndpoints.length})</option>
                  {activeEndpoints.map((ep) => (
                    <option key={ep.id} value={ep.id} className="bg-popover text-popover-foreground">
                      {ep.name} (/{ep.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium" asChild>
              <Link href={selectedEndpointFilter !== "all" ? `/endpoints/${selectedEndpointFilter}` : `/endpoints`}>
                View Inspector
                <ArrowRight className="size-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Target URL Banner */}
          {selectedEndpointObj ? (
            <div className="mb-4 p-3 rounded-xl border border-border/50 bg-muted/30 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs min-w-0">
                <div className="flex items-center gap-1.5 font-medium text-foreground shrink-0">
                  <Radio className="size-3.5 text-primary shrink-0" />
                  <span className="text-muted-foreground">Filtered Endpoint:</span>
                  <span className="font-semibold text-foreground">{selectedEndpointObj.name}</span>
                </div>
                <span className="text-border hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Globe className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Target URL:</span>
                  <code className="font-mono text-[11px] text-foreground bg-background/80 px-2 py-0.5 rounded border border-border/60 truncate max-w-[260px] sm:max-w-md">
                    {getReceiverUrl(selectedEndpointObj.slug)}
                  </code>
                </div>
              </div>
              <CopyButton
                value={getReceiverUrl(selectedEndpointObj.slug)}
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 font-normal bg-background hover:bg-accent shrink-0"
                showText
                idleText="Copy URL"
              />
            </div>
          ) : activeEndpoints.length > 0 && (
            <div className="mb-4 p-3 rounded-xl border border-border/50 bg-muted/20 backdrop-blur-xs flex flex-wrap items-center justify-between gap-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Radio className="size-3.5 text-emerald-500 animate-pulse shrink-0" />
                <span>Monitoring live traffic stream across <strong className="text-foreground">{activeEndpoints.length} endpoint{activeEndpoints.length === 1 ? '' : 's'}</strong></span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                {activeEndpoints.slice(0, 3).map((ep) => (
                  <span key={ep.id} className="bg-background/80 border border-border/40 px-2 py-0.5 rounded text-foreground/80">
                    /{ep.slug}
                  </span>
                ))}
                {activeEndpoints.length > 3 && <span>+{activeEndpoints.length - 3} more</span>}
              </div>
            </div>
          )}

          {payloadsLoading ? (
            <div className="flex flex-col gap-2.5">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : activeEndpoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border/60 rounded-xl bg-muted/20">
              <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
                <Terminal className="size-6" />
              </div>
              <p className="font-medium text-sm text-foreground">No endpoints configured</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Create your first endpoint in this workspace to start listening for incoming webhooks and traffic logs.
              </p>
              <Button size="sm" className="mt-4 primary-gradient-btn border-0" onClick={() => router.push("/endpoints")}>
                Create Endpoint
              </Button>
            </div>
          ) : recentPayloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border/60 rounded-xl bg-muted/20">
              <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
                <Activity className="size-6 text-primary animate-pulse" />
              </div>
              <p className="font-medium text-sm text-foreground">Listening for incoming traffic</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                {selectedEndpointObj ? (
                  <>Send an HTTP request to <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono font-medium">{getReceiverUrl(selectedEndpointObj.slug)}</code> to see logs here.</>
                ) : (
                  <>Send an HTTP request to any endpoint in this workspace to view live traffic logs in real time.</>
                )}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentPayloads.map((payload) => {
                const ep = endpointsMap.get(payload.endpoint_id)
                return (
                  <div
                    key={payload.id}
                    onClick={() => router.push(`/endpoints/${payload.endpoint_id}`)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/40 bg-background/40 hover:bg-accent/40 hover:border-border/80 transition-all duration-200 cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cn(
                          "px-2.5 py-1 text-xs font-bold font-mono rounded-lg border uppercase tracking-wider shrink-0",
                          getMethodBadgeClass(payload.method)
                        )}
                      >
                        {payload.method || "POST"}
                      </span>
                      
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="bg-muted/70 text-foreground/90 px-2.5 py-1 rounded-md border border-border/50 font-mono text-xs font-semibold flex items-center gap-1.5 shrink-0">
                          <Hash className="size-3 text-muted-foreground" />
                          <span>ID: {payload.id}</span>
                        </span>

                        <span className="text-[11px] font-mono text-muted-foreground/90 bg-muted/40 px-2.5 py-1 rounded-md border border-border/30 truncate max-w-[220px] flex items-center gap-1.5">
                          <Radio className="size-3 text-primary shrink-0" />
                          <span className="font-semibold text-foreground/90">{ep?.name || "Endpoint"}</span>
                          <span className="text-muted-foreground">/{ep?.slug || payload.endpoint_id}</span>
                        </span>
                        
                        {payload.content_type && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[140px] bg-muted/20 px-2 py-0.5 rounded border border-border/20 font-mono hidden xl:inline-block">
                            {payload.content_type}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3.5 text-xs text-muted-foreground shrink-0 border-t sm:border-t-0 border-border/30 pt-2 sm:pt-0">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground/80">
                        <Clock className="size-3.5 text-muted-foreground/70" />
                        <span>{new Date(payload.received_at).toLocaleTimeString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={payload.is_drifted ? "destructive" : "outline"}
                          className={cn(
                            "gap-1 font-medium text-xs px-2.5 py-0.5 border",
                            payload.is_drifted
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          )}
                        >
                          {payload.is_drifted ? (
                            <>
                              <AlertTriangle className="size-3" />
                              Drifted
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="size-3" />
                              Verified
                            </>
                          )}
                        </Badge>

                        <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all hidden sm:block" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



