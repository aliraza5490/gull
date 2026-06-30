"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Radio,
  Play,
  Copy,
  Plus,
  RefreshCw,
  Trash,
  CheckCircle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Code2,
  Calendar,
  AlertTriangle,
  Link2,
} from "lucide-react"
import { toast } from "sonner"

import {
  useEndpoints,
  useDestinations,
  useCreateDestination,
  useUpdateDestination,
  useDeleteDestination,
  usePayloads,
  useDeliveries,
  useReplayPayload,
  useDriftAlerts,
  useCreateShare,
} from "@/services/webhook"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { PayloadInspector } from "@/components/endpoints/payload-inspector"
import { DestinationForm } from "@/components/endpoints/destination-form"
import { DiffModal } from "@/components/endpoints/diff-modal"
import { CopyButton } from "@/components/copy-button"

export default function EndpointDetailPage() {
  const params = useParams()
  const router = useRouter()
  const endpointId = params.id as string

  // State
  const [activeTab, setActiveTab] = React.useState("overview")
  const [selectedPayload, setSelectedPayload] = React.useState<any | null>(null)
  const [isInspectorOpen, setIsInspectorOpen] = React.useState(false)
  const [selectedDestination, setSelectedDestination] = React.useState<any | null>(null)
  const [isDestFormOpen, setIsDestFormOpen] = React.useState(false)
  const [shareExpiration, setShareExpiration] = React.useState("3600")
  const [shareLink, setShareLink] = React.useState("")

  // Diff selection state
  const [diffSelection, setDiffSelection] = React.useState<string[]>([])
  const [isDiffOpen, setIsDiffOpen] = React.useState(false)

  // Fetch Endpoint details
  const { data: endpointsResponse, isLoading: endpointsLoading } = useEndpoints()
  const endpoint = React.useMemo(() => {
    return endpointsResponse?.items?.find((e) => e.id === endpointId) || null
  }, [endpointsResponse, endpointId])

  // Fetch Destinations
  const { data: destinations = [], isLoading: destLoading } = useDestinations(endpointId)
  const deleteDestMutation = useDeleteDestination(endpointId)

  // Fetch Payloads
  const [payloadPage, setPayloadPage] = React.useState(1)
  const { data: payloadsResponse, isLoading: payloadsLoading } = usePayloads(endpointId, payloadPage, 10)
  const payloads = React.useMemo(() => {
    return payloadsResponse?.items || []
  }, [payloadsResponse])

  // Fetch Drift Alerts
  const { data: driftAlerts = [], isLoading: alertsLoading } = useDriftAlerts(endpointId)

  // Share Hook
  const createShareMutation = useCreateShare(endpointId)

  // Ingestion Inbound Influx target URL mapping
  const getReceiverUrl = (slug?: string) => {
    if (!slug) return ""
    if (typeof window === "undefined") return `/api/v1/receiver/${slug}`
    const origin = window.location.origin.replace("3000", "8000") // backend route
    return `${origin}/api/v1/receiver/${slug}`
  }

  const handleDeleteDestination = async (destId: string) => {
    if (!confirm("Are you sure you want to delete this forwarding destination?")) return
    try {
      await deleteDestMutation.mutateAsync(destId)
      toast.success("Destination deleted successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete destination")
    }
  }

  const handleGenerateShareLink = async () => {
    try {
      const response = await createShareMutation.mutateAsync({
        expires_in_seconds: Number(shareExpiration),
      })
      const fullLink = `${window.location.origin}/share/${response.token}`
      setShareLink(fullLink)
      toast.success("Session share link generated!")
    } catch (err: any) {
      toast.error(err.message || "Failed to generate share link")
    }
  }

  const handleDiffSelect = (id: string) => {
    setDiffSelection((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      if (prev.length >= 2) {
        return [prev[1], id]
      }
      return [...prev, id]
    })
  }

  const handleTriggerDiff = () => {
    if (diffSelection.length < 2) return
    setIsDiffOpen(true)
  }

  const diffPayloads = React.useMemo(() => {
    if (diffSelection.length < 2) return { a: null, b: null }
    const a = payloads.find((p) => p.id === diffSelection[0]) || null
    const b = payloads.find((p) => p.id === diffSelection[1]) || null
    return { a, b }
  }, [diffSelection, payloads])

  if (endpointsLoading) {
    return (
      <div className="flex flex-col gap-6 font-sans">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (!endpoint) {
    return (
      <div className="font-sans">
        <EmptyState
          icon={AlertTriangle}
          title="Endpoint Not Found"
          description="The requested webhook endpoint could not be resolved in the active workspace context."
          action={
            <Button variant="outline" onClick={() => router.push("/endpoints")}>
              Back to Endpoints
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header controls & Back indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/endpoints")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{endpoint.name}</h1>
              <Badge variant={endpoint.type === "temporary" ? "secondary" : "default"}>
                {endpoint.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate max-w-[300px] sm:max-w-md">
              {endpoint.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant={endpoint.is_active ? "success" : "secondary"}>
            {endpoint.is_active ? "Active" : "Paused"}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-4">
        <TabsList className="grid grid-cols-6 w-full max-w-2xl bg-muted/60 p-1 shrink-0 overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payloads">Payloads</TabsTrigger>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="alerts">Drift Alerts</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 border-border/50 bg-card/60 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Ingestion Endpoint URL</CardTitle>
                <CardDescription>
                  Send incoming webhook HTTP requests to this unique target endpoint destination.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2.5 font-mono text-xs overflow-x-auto">
                  <Link2 className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 select-all truncate">{getReceiverUrl(endpoint.slug)}</span>
                  <CopyButton value={getReceiverUrl(endpoint.slug)} size="sm" />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Verification Secret Key</span>
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2.5 font-mono text-xs">
                    <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                    <span className="flex-1 truncate">{endpoint.secret || "No authentication secret active"}</span>
                    {endpoint.secret && <CopyButton value={endpoint.secret} size="sm" />}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/60 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Metadata Summary</CardTitle>
                <CardDescription>Target metadata details.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-sm">
                <div className="flex items-center justify-between border-b pb-2 last:border-0">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{endpoint.type}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2 last:border-0">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{endpoint.is_active ? "Active" : "Paused"}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2 last:border-0">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium text-xs">
                    {new Date(endpoint.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Payloads Tab */}
        <TabsContent value="payloads">
          <Card className="border-border/50 bg-card/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Ingested Inbound Payloads</CardTitle>
                <CardDescription>Live traffic stream log detailing received webhook events.</CardDescription>
              </div>
              {diffSelection.length >= 2 && (
                <Button className="primary-gradient-btn border-0" size="sm" onClick={handleTriggerDiff}>
                  Compare Selected ({diffSelection.length})
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {payloadsLoading ? (
                <div className="p-6 flex flex-col gap-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : payloads.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={Radio}
                    title="No traffic received"
                    description="Trigger a POST request containing headers and body payload elements to your ingestion URL target."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[60px] text-center">Select</TableHead>
                      <TableHead>Event ID</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Drift Status</TableHead>
                      <TableHead>Captured At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payloads.map((payload) => (
                      <TableRow key={payload.id} className={diffSelection.includes(payload.id) ? "bg-primary/5 hover:bg-primary/10" : ""}>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            className="size-3.5 rounded border-muted accent-primary cursor-pointer"
                            checked={diffSelection.includes(payload.id)}
                            onChange={() => handleDiffSelect(payload.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground select-all">
                          {payload.id}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payload.method === "POST" ? "default" : "secondary"}>
                            {payload.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{payload.content_type || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={payload.is_drifted ? "destructive" : "success"}>
                            {payload.is_drifted ? "Drifted" : "Verified"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(payload.received_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPayload(payload)
                              setIsInspectorOpen(true)
                            }}
                          >
                            Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Destinations Tab */}
        <TabsContent value="destinations">
          <Card className="border-border/50 bg-card/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Outbound Routing Targets</CardTitle>
                <CardDescription>
                  Forward ingested webhooks in parallel routes.
                </CardDescription>
              </div>
              <Button
                className="primary-gradient-btn border-0"
                size="sm"
                onClick={() => {
                  setSelectedDestination(null)
                  setIsDestFormOpen(true)
                }}
              >
                <Plus className="size-4 mr-1.5" />
                Add Route
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {destLoading ? (
                <div className="p-6 flex flex-col gap-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : destinations.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={ExternalLink}
                    title="No forwarding routes"
                    description="Configure downstream target URLs and headers to begin fanning out webhook traffic."
                    action={
                      <Button
                        className="primary-gradient-btn border-0"
                        size="sm"
                        onClick={() => {
                          setSelectedDestination(null)
                          setIsDestFormOpen(true)
                        }}
                      >
                        Add Route
                      </Button>
                    }
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Route Name</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Target URL</TableHead>
                      <TableHead>Auth Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {destinations.map((dest) => (
                      <TableRow key={dest.id}>
                        <TableCell className="font-semibold">{dest.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{dest.method}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate text-muted-foreground">
                          {dest.url}
                        </TableCell>
                        <TableCell className="text-xs">{dest.auth_type}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDestination(dest)
                                setIsDestFormOpen(true)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDestination(dest.id)}
                            >
                              <Trash className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Deliveries Tab */}
        <TabsContent value="deliveries">
          <Card className="border-border/50 bg-card/60 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Delivery Logs Audit Feed</CardTitle>
              <CardDescription>Outcome status of outbound fan-out requests.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {payloads.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={CheckCircle}
                    title="No logs available"
                    description="Audit logs are captured once ingested events are processed and forwarded downstream."
                  />
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Select individual payloads in the Payloads Tab to view their deliveries and re-request audits.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Alerts Tab */}
        <TabsContent value="alerts">
          <Card className="border-border/50 bg-card/60 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Schema Drift Alerts</CardTitle>
              <CardDescription>
                Anomaly logs tracking structural mutations relative to ingestion baseline shapes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {alertsLoading ? (
                <div className="p-6 flex flex-col gap-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : driftAlerts.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={CheckCircle}
                    title="All verified"
                    description="No anomalies or schema mutations have been flagged on incoming logs."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Alert ID</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driftAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground select-all">
                          {alert.id}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-destructive/95">
                          {alert.message}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Share Tab */}
        <TabsContent value="share">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 border-border/50 bg-card/60 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Generate Share Token</CardTitle>
                <CardDescription>
                  Generate time-boxed read-only URLs for external validation support teams.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Link Expiration Duration</span>
                  <select
                    className="w-full sm:max-w-xs border rounded-lg p-2 text-sm bg-background"
                    value={shareExpiration}
                    onChange={(e) => setShareExpiration(e.target.value)}
                  >
                    <option value="3600">1 Hour</option>
                    <option value="86400">1 Day</option>
                    <option value="604800">1 Week</option>
                  </select>
                </div>

                <Button
                  className="primary-gradient-btn border-0 self-start mt-2"
                  onClick={handleGenerateShareLink}
                  disabled={createShareMutation.isPending}
                >
                  {createShareMutation.isPending ? "Generating..." : "Create Link"}
                </Button>

                {shareLink && (
                  <div className="flex flex-col gap-2 mt-4">
                    <span className="text-xs font-semibold text-muted-foreground">Collaborator Share URL</span>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2.5 font-mono text-xs overflow-x-auto">
                      <Link2 className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate select-all">{shareLink}</span>
                      <CopyButton value={shareLink} size="sm" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <PayloadInspector
        payload={selectedPayload}
        open={isInspectorOpen}
        onOpenChange={setIsInspectorOpen}
      />

      <DestinationForm
        endpointId={endpointId}
        destination={selectedDestination}
        open={isDestFormOpen}
        onOpenChange={setIsDestFormOpen}
      />

      <DiffModal
        payloadA={diffPayloads.a}
        payloadB={diffPayloads.b}
        open={isDiffOpen}
        onOpenChange={setIsDiffOpen}
      />
    </div>
  )
}
