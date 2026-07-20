"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Hash,
  Terminal,
  Globe,
  Radio,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { useWorkspace } from "@/app/(dashboard)/layout"
import { useEndpoints, useWorkspacePayloads, WebhookPayload } from "@/services/webhook"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PayloadInspector } from "@/components/endpoints/payload-inspector"
import { CopyButton } from "@/components/copy-button"
import { cn, getReceiverUrl } from "@/lib/utils"

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

export default function TrafficLogsPage() {
  const router = useRouter()
  const { activeWorkspaceId } = useWorkspace()

  // State
  const [selectedEndpointFilter, setSelectedEndpointFilter] = React.useState<string>("all")
  const [methodFilter, setMethodFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [page, setPage] = React.useState<number>(1)
  const [selectedPayload, setSelectedPayload] = React.useState<WebhookPayload | null>(null)
  const [isInspectorOpen, setIsInspectorOpen] = React.useState<boolean>(false)

  // Fetch endpoints for workspace mapping
  const { data: endpointsData } = useEndpoints(
    activeWorkspaceId || undefined,
    1,
    100
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

  // Fetch workspace traffic payloads
  const {
    data: payloadsData,
    isLoading: payloadsLoading,
    refetch,
    isFetching,
  } = useWorkspacePayloads(
    activeWorkspaceId || "",
    page,
    20,
    selectedEndpointFilter
  )

  const rawPayloads = React.useMemo(() => {
    return payloadsData?.items || []
  }, [payloadsData])

  // Client side filtering for method and search query
  const filteredPayloads = React.useMemo(() => {
    return rawPayloads.filter((payload) => {
      if (methodFilter !== "all" && payload.method.toUpperCase() !== methodFilter.toUpperCase()) {
        return false
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase()
        const matchId = String(payload.id).toLowerCase().includes(q)
        const matchBody = payload.raw_body?.toLowerCase().includes(q)
        const matchType = payload.content_type?.toLowerCase().includes(q)
        const ep = endpointsMap.get(payload.endpoint_id)
        const matchEpName = ep?.name.toLowerCase().includes(q)
        const matchEpSlug = ep?.slug.toLowerCase().includes(q)
        return matchId || matchBody || matchType || matchEpName || matchEpSlug
      }
      return true
    })
  }, [rawPayloads, methodFilter, searchQuery, endpointsMap])

  const totalPages = Math.ceil((payloadsData?.total || 0) / 20) || 1

  const handleInspect = (payload: WebhookPayload, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedPayload(payload)
    setIsInspectorOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Activity className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Traffic Logs</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time HTTP payload log stream across your workspace endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            <span>Refresh Logs</span>
          </Button>
          <Button
            size="sm"
            className="primary-gradient-btn border-0 gap-1.5"
            onClick={() => router.push("/endpoints")}
          >
            <Radio className="size-3.5" />
            <span>Manage Endpoints</span>
          </Button>
        </div>
      </div>

      {/* Target URL Banner */}
      {selectedEndpointObj ? (
        <div className="p-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs min-w-0">
            <div className="flex items-center gap-1.5 font-medium text-foreground shrink-0">
              <Radio className="size-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Filtered Endpoint:</span>
              <span className="font-semibold text-foreground">{selectedEndpointObj.name}</span>
            </div>
            <span className="text-border hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <Globe className="size-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Ingestion URL:</span>
              <code className="font-mono text-xs text-foreground bg-background px-2.5 py-1 rounded-md border border-border/60 truncate max-w-[280px] sm:max-w-md">
                {getReceiverUrl(selectedEndpointObj.slug)}
              </code>
            </div>
          </div>
          <CopyButton
            value={getReceiverUrl(selectedEndpointObj.slug)}
            size="sm"
            variant="outline"
            className="h-8 text-xs px-3 font-normal bg-background hover:bg-accent shrink-0"
            showText
            idleText="Copy URL"
          />
        </div>
      ) : activeEndpoints.length > 0 && (
        <div className="p-3.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-emerald-500 animate-pulse shrink-0" />
            <span>Live workspace stream aggregating requests across <strong className="text-foreground">{activeEndpoints.length} endpoint{activeEndpoints.length === 1 ? '' : 's'}</strong></span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            {activeEndpoints.slice(0, 4).map((ep) => (
              <span key={ep.id} className="bg-muted/60 border border-border/40 px-2 py-0.5 rounded text-foreground/90">
                /{ep.slug}
              </span>
            ))}
            {activeEndpoints.length > 4 && <span>+{activeEndpoints.length - 4} more</span>}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, body or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-background/50 border-border/60 focus-visible:ring-primary"
            />
          </div>

          {/* Controls: Endpoint Filter & Method Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Endpoint Select */}
            <div className="flex items-center gap-1.5 bg-background/60 border border-border/60 rounded-lg px-2.5 h-9 shrink-0">
              <Filter className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Endpoint:</span>
              <select
                value={selectedEndpointFilter}
                onChange={(e) => {
                  setSelectedEndpointFilter(e.target.value)
                  setPage(1)
                }}
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

            {/* Method Filter */}
            <div className="flex items-center gap-1 bg-background/60 border border-border/60 rounded-lg p-1 h-9 shrink-0">
              {["all", "POST", "GET", "PUT", "DELETE"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all uppercase",
                    methodFilter === m
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payloads List Table */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {payloadsLoading ? (
            <div className="p-6 flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : activeEndpoints.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="p-3.5 rounded-full bg-muted text-muted-foreground mb-3">
                <Terminal className="size-7" />
              </div>
              <h3 className="font-semibold text-base">No endpoints configured</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Create an endpoint first to start listening for incoming traffic payloads in this workspace.
              </p>
              <Button size="sm" className="mt-4 primary-gradient-btn border-0" onClick={() => router.push("/endpoints")}>
                Create Endpoint
              </Button>
            </div>
          ) : filteredPayloads.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="p-3.5 rounded-full bg-muted text-muted-foreground mb-3">
                <Activity className="size-7 text-primary animate-pulse" />
              </div>
              <h3 className="font-semibold text-base">No logs found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                {searchQuery || methodFilter !== "all" || selectedEndpointFilter !== "all"
                  ? "No traffic log matches your active search and filter criteria."
                  : "Send an HTTP request to any endpoint URL to record logs in real-time."}
              </p>
              {(searchQuery || methodFilter !== "all" || selectedEndpointFilter !== "all") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("")
                    setMethodFilter("all")
                    setSelectedEndpointFilter("all")
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="w-[110px]">Method</TableHead>
                  <TableHead className="w-[120px]">Event ID</TableHead>
                  <TableHead>Captured By Endpoint</TableHead>
                  <TableHead className="hidden md:table-cell">Content-Type</TableHead>
                  <TableHead className="w-[120px]">Drift Status</TableHead>
                  <TableHead className="w-[160px]">Timestamp</TableHead>
                  <TableHead className="text-right w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayloads.map((payload) => {
                  const ep = endpointsMap.get(payload.endpoint_id)
                  return (
                    <TableRow
                      key={payload.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors border-border/30 group"
                      onClick={() => handleInspect(payload)}
                    >
                      <TableCell>
                        <span
                          className={cn(
                            "px-2.5 py-1 text-xs font-bold font-mono rounded-lg border uppercase tracking-wider inline-block",
                            getMethodBadgeClass(payload.method)
                          )}
                        >
                          {payload.method || "POST"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-foreground/90">
                        <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded border border-border/40 w-fit">
                          <Hash className="size-3 text-muted-foreground" />
                          {payload.id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Radio className="size-3 text-primary shrink-0" />
                          <span className="font-medium text-xs text-foreground truncate max-w-[140px] sm:max-w-[180px]">
                            {ep?.name || "Endpoint"}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-border/30">
                            /{ep?.slug || payload.endpoint_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                        {payload.content_type || "application/json"}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-muted-foreground/70" />
                          <span>{new Date(payload.received_at).toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1 hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => handleInspect(payload, e)}
                          >
                            <Eye className="size-3.5" />
                            <span>Inspect</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/endpoints/${payload.endpoint_id}`)
                            }}
                            title="Go to Endpoint Inspector"
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/20 text-xs">
              <span className="text-muted-foreground font-mono">
                Page {page} of {totalPages} ({payloadsData?.total || 0} total logs)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs gap-1"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs gap-1"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <span>Next</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payload Inspector Slide-Over Sheet */}
      <PayloadInspector
        payload={selectedPayload}
        open={isInspectorOpen}
        onOpenChange={setIsInspectorOpen}
      />
    </div>
  )
}
