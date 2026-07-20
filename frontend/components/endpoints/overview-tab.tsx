"use client"

import * as React from "react"
import {
  Radio,
  Globe,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Link2,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Layers,
  BarChart3,
  Plus,
  Activity,
  Code2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { CopyButton } from "@/components/copy-button"
import { formatExpiryInfo, formatRelativeTime, cn } from "@/lib/utils"
import { ReceiverEndpoint, Destination, WebhookPayload, SchemaDriftAlert } from "@/services/webhook"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface OverviewTabProps {
  endpoint: ReceiverEndpoint
  receiverUrl: string
  expiryInfo: ReturnType<typeof formatExpiryInfo>
  payloads: WebhookPayload[]
  destinations: Destination[]
  driftAlerts: SchemaDriftAlert[]
  activityData: Array<{ time: string; requests: number }>
  latestPayload: WebhookPayload | null
  payloadsLoading: boolean
  destLoading: boolean
  onOpenQr: () => void
  onOpenInspector: (payload: WebhookPayload) => void
  onOpenDestForm: (dest?: Destination | null) => void
  onNavigateTab: (tab: string) => void
}

export function OverviewTab({
  endpoint,
  receiverUrl,
  expiryInfo,
  payloads,
  destinations,
  driftAlerts,
  activityData,
  latestPayload,
  payloadsLoading,
  destLoading,
  onOpenQr,
  onOpenInspector,
  onOpenDestForm,
  onNavigateTab,
}: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-6 mt-0">
      {/* 100% Dynamic KPI Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/70 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Ingested Payloads
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">
                  {payloads.length}
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground truncate">
                {latestPayload ? `Latest: ${formatRelativeTime(latestPayload.received_at)}` : "No payloads captured"}
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Radio className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Target Routes
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">
                  {destinations.length}
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground truncate">
                {destinations.length === 0 ? "No routes added" : `${destinations.length} active destination${destinations.length === 1 ? "" : "s"}`}
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Globe className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Drift Alerts
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">
                  {driftAlerts.length}
                </span>
              </div>
              <span className={cn("text-[11px] font-medium truncate", driftAlerts.length > 0 ? "text-destructive font-semibold" : "text-emerald-500")}>
                {driftAlerts.length === 0 ? "All schemas verified" : `${driftAlerts.length} anomaly detected`}
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <AlertTriangle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1 min-w-0 flex-1 pr-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Lifecycle Policy
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight capitalize">
                  {endpoint.type === "temporary" ? expiryInfo.text : "Persistent"}
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="size-3" /> {endpoint.is_active ? "Operational" : "Paused"}
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20 shrink-0">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: URL Card & Metadata Card (7/5 Ratio) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-7 border-border/50 bg-card/70 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Link2 className="size-4 text-primary" />
                <span>Ingestion Endpoint URL</span>
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px] bg-primary/5">
                HTTP POST Target
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Send incoming HTTP webhook payloads to this endpoint. Requests are logged and routed in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Receiver Endpoint URL
              </span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-2">
                <div className="flex items-center gap-2 flex-1 min-w-0 font-mono text-xs px-2 py-1">
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase font-bold shrink-0">
                    POST
                  </Badge>
                  <span className="truncate select-all text-foreground font-medium">{receiverUrl}</span>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                  <CopyButton
                    value={receiverUrl}
                    showText={true}
                    idleText="Copy"
                    copiedText="Copied ✓"
                    variant="secondary"
                    className="h-8 text-xs font-semibold px-3"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold px-3"
                    onClick={() => window.open(receiverUrl, "_blank")}
                    title="Open endpoint in new browser window"
                  >
                    <ExternalLink className="size-3.5 mr-1" />
                    Open
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold px-3 bg-background hover:bg-accent"
                    onClick={onOpenQr}
                    title="View QR Code for mobile webhook testing"
                  >
                    <QrCode className="size-3.5 mr-1 text-primary" />
                    QR Code
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Verification Secret Key
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 font-mono text-xs">
                <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                <span className="flex-1 truncate select-all">
                  {endpoint.secret || "No authentication secret active"}
                </span>
                {endpoint.secret && (
                  <CopyButton
                    value={endpoint.secret}
                    showText={true}
                    idleText="Copy Secret"
                    copiedText="Copied ✓"
                    variant="ghost"
                    className="h-7 text-xs"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 border-border/50 bg-card/70 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>Metadata Summary</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Configuration, lifecycle status, and expiration policy details.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl border border-border/50 bg-muted/20">
              <div className="flex flex-col gap-1 border-r border-border/40 pr-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Endpoint Type
                </span>
                <div className="pt-0.5">
                  <Badge variant="outline" className="capitalize font-medium text-xs px-2.5 py-0.5">
                    {endpoint.type}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-1 pl-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </span>
                <div className="pt-0.5 flex items-center gap-1.5">
                  <span className={cn("size-2 rounded-full", endpoint.is_active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
                  <span className="font-semibold text-sm">
                    {endpoint.is_active ? "Active" : "Paused"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 border-t border-r border-border/40 pt-3 pr-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Expires At
                </span>
                <span className="font-mono text-xs font-semibold text-foreground/90 truncate" title={expiryInfo.formattedDate}>
                  {expiryInfo.text}
                </span>
              </div>

              <div className="flex flex-col gap-1 border-t border-border/40 pt-3 pl-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Created
                </span>
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {new Date(endpoint.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 - Activity Timeline & Destination Health */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-7 border-border/50 bg-card/70 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                <span>Endpoint Activity Timeline</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Distribution of incoming webhook requests over time.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              {payloads.length} Recorded Event{payloads.length === 1 ? "" : "s"}
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 18 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={18} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="requests" fill="currentColor" className="fill-primary/80 hover:fill-primary transition-all rounded-t" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 border-border/50 bg-card/70 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="size-4 text-emerald-500" />
                <span>Destination Health</span>
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                {destinations.length} Target Route{destinations.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Fan-out target route connectivity and routing status.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {destLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : destinations.length === 0 ? (
              <div className="p-4 border border-dashed rounded-xl text-center flex flex-col items-center justify-center gap-2 bg-muted/10">
                <ExternalLink className="size-5 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">No target routes configured yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onOpenDestForm(null)}
                >
                  <Plus className="size-3 mr-1" /> Add Route
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {destinations.map((dest) => (
                  <div
                    key={dest.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={cn("size-2 rounded-full shrink-0", dest.is_active !== false ? "bg-emerald-500" : "bg-muted-foreground")} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold truncate">{dest.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground truncate">{dest.url}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase">
                        {dest.method}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium",
                          dest.is_active !== false
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {dest.is_active !== false ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 - Recent Payloads & Last Received Payload */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-7 border-border/50 bg-card/70 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                <span>Recent Ingested Payloads</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Live feed of recent webhook events captured on this endpoint.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigateTab("payloads")}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {payloadsLoading ? (
              <div className="p-4 gap-2 flex flex-col">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : payloads.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No webhook payloads captured yet. Send a POST request to your URL target.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Event ID</TableHead>
                    <TableHead className="text-xs">Method</TableHead>
                    <TableHead className="text-xs">Drift Status</TableHead>
                    <TableHead className="text-xs text-right">Captured</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payloads.slice(0, 4).map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => onOpenInspector(item)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground select-all">
                        {String(item.id).substring(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.method === "POST" ? "default" : "secondary"} className="text-[10px]">
                          {item.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.is_drifted ? "destructive" : "outline"}
                          className={item.is_drifted ? "" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]"}
                        >
                          {item.is_drifted ? "Drifted" : "Verified"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground font-mono">
                        {formatRelativeTime(item.received_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 border-border/50 bg-card/70 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Code2 className="size-4 text-primary" />
                <span>Last Received Payload</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Inspect structure of the latest inbound event.
              </CardDescription>
            </div>
            {latestPayload && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-semibold"
                onClick={() => onOpenInspector(latestPayload)}
              >
                Inspect
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {latestPayload ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {latestPayload.method}
                    </Badge>
                    <span className="truncate text-foreground font-medium">
                      {latestPayload.content_type || "application/json"}
                    </span>
                  </div>
                  <span>{formatRelativeTime(latestPayload.received_at)}</span>
                </div>
                <pre className="rounded-lg border bg-slate-950 text-slate-100 p-3 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[140px] select-all">
                  {JSON.stringify(latestPayload.parsed_body || latestPayload.raw_body || {}, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="p-6 border border-dashed rounded-xl text-center flex flex-col items-center justify-center gap-2 bg-muted/10">
                <Radio className="size-5 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">Awaiting incoming payload traffic...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
