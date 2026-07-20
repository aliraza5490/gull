"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Clock, AlertTriangle, Pause, Play, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatExpiryInfo, getReceiverUrl, cn } from "@/lib/utils"

import {
  useEndpoints,
  useUpdateEndpoint,
  useDeleteEndpoint,
  useDestinations,
  useDeleteDestination,
  usePayloads,
  useDriftAlerts,
  useCreateShare,
  WebhookPayload,
  Destination,
} from "@/services/webhook"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { PayloadInspector } from "@/components/endpoints/payload-inspector"
import { DestinationForm } from "@/components/endpoints/destination-form"
import { DiffModal } from "@/components/endpoints/diff-modal"
import { QrModal } from "@/components/endpoints/qr-modal"

// Modular Tab Components
import { OverviewTab } from "@/components/endpoints/overview-tab"
import { PayloadsTab } from "@/components/endpoints/payloads-tab"
import { DestinationsTab } from "@/components/endpoints/destinations-tab"
import { DeliveriesTab } from "@/components/endpoints/deliveries-tab"
import { AlertsTab } from "@/components/endpoints/alerts-tab"
import { ShareTab } from "@/components/endpoints/share-tab"

export default function EndpointDetailPage() {
  const params = useParams()
  const router = useRouter()
  const endpointId = params.id as string

  // State
  const [activeTab, setActiveTab] = React.useState("overview")
  const [selectedPayload, setSelectedPayload] = React.useState<WebhookPayload | null>(null)
  const [isInspectorOpen, setIsInspectorOpen] = React.useState(false)
  const [selectedDestination, setSelectedDestination] = React.useState<Destination | null>(null)
  const [isDestFormOpen, setIsDestFormOpen] = React.useState(false)
  const [isQrOpen, setIsQrOpen] = React.useState(false)
  const [shareExpiration, setShareExpiration] = React.useState("3600")
  const [shareLink, setShareLink] = React.useState("")

  // Diff selection state
  const [diffSelection, setDiffSelection] = React.useState<string[]>([])
  const [isDiffOpen, setIsDiffOpen] = React.useState(false)

  // Fetch Endpoint details
  const { data: endpointsResponse, isLoading: endpointsLoading } = useEndpoints()
  const endpoint = React.useMemo(() => {
    return endpointsResponse?.items?.find((e) => String(e.id) === String(endpointId)) || null
  }, [endpointsResponse, endpointId])

  // Endpoint mutation hooks
  const updateEndpointMutation = useUpdateEndpoint()
  const deleteEndpointMutation = useDeleteEndpoint()

  // Fetch Destinations
  const { data: destinations = [], isLoading: destLoading } = useDestinations(endpointId)
  const deleteDestMutation = useDeleteDestination(endpointId)

  // Fetch Payloads
  const { data: payloadsResponse, isLoading: payloadsLoading } = usePayloads(endpointId, 1, 10)
  const payloads = React.useMemo(() => {
    return payloadsResponse?.items || []
  }, [payloadsResponse])

  // Fetch Drift Alerts
  const { data: driftAlerts = [], isLoading: alertsLoading } = useDriftAlerts(endpointId)

  // Share Hook
  const createShareMutation = useCreateShare(endpointId)

  // Handle Pause / Resume toggle
  const handleToggleActive = async () => {
    if (!endpoint) return
    const newStatus = !endpoint.is_active
    try {
      await updateEndpointMutation.mutateAsync({
        id: endpointId,
        data: { is_active: newStatus },
      })
      toast.success(newStatus ? "Endpoint activated" : "Endpoint paused")
    } catch (err: any) {
      toast.error(err.message || "Failed to update endpoint status")
    }
  }

  // Handle Delete endpoint
  const handleDeleteEndpoint = async () => {
    if (!endpoint) return
    if (!confirm(`Are you sure you want to delete "${endpoint.name}"? This action cannot be undone.`)) return
    try {
      await deleteEndpointMutation.mutateAsync(endpointId)
      toast.success("Endpoint deleted successfully")
      router.push("/endpoints")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete endpoint")
    }
  }

  // Generate dynamic chart timeline data strictly based on real payloads
  const activityData = React.useMemo(() => {
    const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"]
    if (!payloads || payloads.length === 0) {
      return hours.map((time) => ({ time, requests: 0 }))
    }
    const countsByHour: Record<string, number> = {}
    payloads.forEach((p) => {
      const date = new Date(p.received_at)
      if (!isNaN(date.getTime())) {
        const hourStr = `${String(date.getHours()).padStart(2, "0")}:00`
        countsByHour[hourStr] = (countsByHour[hourStr] || 0) + 1
      }
    })
    return hours.map((time) => ({
      time,
      requests: countsByHour[time] || (time === "Now" ? payloads.length : 0),
    }))
  }, [payloads])

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
    const a = payloads.find((p) => String(p.id) === String(diffSelection[0])) || null
    const b = payloads.find((p) => String(p.id) === String(diffSelection[1])) || null
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

  const receiverUrl = getReceiverUrl(endpoint.slug)
  const expiryInfo = formatExpiryInfo(endpoint.expires_at)
  const latestPayload = payloads[0] || null

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header controls & Back indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/endpoints")} className="rounded-lg hover:bg-accent">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{endpoint.name}</h1>
              
              {/* Unified Temporary + Expiry Badge */}
              {endpoint.type === "temporary" ? (
                <Badge
                  variant={expiryInfo.isExpired ? "destructive" : "outline"}
                  className="flex items-center gap-1.5 font-medium px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  title={expiryInfo.formattedDate}
                >
                  <Clock className="size-3.5 text-amber-500 shrink-0 animate-pulse" />
                  <span>Temporary Endpoint • {expiryInfo.text}</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="px-2.5 py-1 font-medium text-xs">
                  Persistent Endpoint
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls & Status Badge */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 font-semibold text-xs transition-all duration-300 mr-1",
              endpoint.is_active
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            {endpoint.is_active && (
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
              </span>
            )}
            <span>{endpoint.is_active ? "Active" : "Paused"}</span>
          </Badge>

          {/* Pause / Resume Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold px-3 border-border/70 hover:bg-accent"
            onClick={handleToggleActive}
            disabled={updateEndpointMutation.isPending}
          >
            {endpoint.is_active ? (
              <>
                <Pause className="size-3.5 mr-1.5 text-amber-500" />
                Pause
              </>
            ) : (
              <>
                <Play className="size-3.5 mr-1.5 text-emerald-500" />
                Resume
              </>
            )}
          </Button>

          {/* Delete Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold px-3 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
            onClick={handleDeleteEndpoint}
            disabled={deleteEndpointMutation.isPending}
          >
            <Trash2 className="size-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Prominent Expanded Full-Width Tab Bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-6">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 p-1.5 rounded-2xl bg-muted/40 border border-border/50 h-auto min-h-[52px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payloads">Payloads</TabsTrigger>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="alerts">Drift Alerts</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="overview">
          <OverviewTab
            endpoint={endpoint}
            receiverUrl={receiverUrl}
            expiryInfo={expiryInfo}
            payloads={payloads}
            destinations={destinations}
            driftAlerts={driftAlerts}
            activityData={activityData}
            latestPayload={latestPayload}
            payloadsLoading={payloadsLoading}
            destLoading={destLoading}
            onOpenQr={() => setIsQrOpen(true)}
            onOpenInspector={(p) => {
              setSelectedPayload(p)
              setIsInspectorOpen(true)
            }}
            onOpenDestForm={(d) => {
              setSelectedDestination(d || null)
              setIsDestFormOpen(true)
            }}
            onNavigateTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="payloads">
          <PayloadsTab
            payloads={payloads}
            payloadsLoading={payloadsLoading}
            diffSelection={diffSelection}
            onDiffSelect={handleDiffSelect}
            onTriggerDiff={handleTriggerDiff}
            onInspectPayload={(p) => {
              setSelectedPayload(p)
              setIsInspectorOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="destinations">
          <DestinationsTab
            destinations={destinations}
            destLoading={destLoading}
            onOpenDestForm={(d) => {
              setSelectedDestination(d || null)
              setIsDestFormOpen(true)
            }}
            onDeleteDestination={handleDeleteDestination}
          />
        </TabsContent>

        <TabsContent value="deliveries">
          <DeliveriesTab payloads={payloads} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab driftAlerts={driftAlerts} alertsLoading={alertsLoading} />
        </TabsContent>

        <TabsContent value="share">
          <ShareTab
            shareExpiration={shareExpiration}
            onShareExpirationChange={setShareExpiration}
            shareLink={shareLink}
            onGenerateShareLink={handleGenerateShareLink}
            isPending={createShareMutation.isPending}
          />
        </TabsContent>
      </Tabs>

      {/* Modals & Inspectors */}
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

      <QrModal
        url={receiverUrl}
        endpointName={endpoint.name}
        open={isQrOpen}
        onOpenChange={setIsQrOpen}
      />
    </div>
  )
}
