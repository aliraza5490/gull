"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Radio,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  ExternalLink,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Link2,
} from "lucide-react"
import { Logo } from "@/components/logo"

import {
  useSharedEndpoint,
  useSharedPayloads,
  useSharedDeliveries,
} from "@/services/webhook"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { PayloadInspector } from "@/components/endpoints/payload-inspector"
import { ThemeToggle } from "@/components/theme-toggle"
import { CopyButton } from "@/components/copy-button"

export default function PublicShareInspectionPage() {
  const params = useParams()
  const token = params.token as string

  const [selectedPayload, setSelectedPayload] = React.useState<any | null>(null)
  const [isInspectorOpen, setIsInspectorOpen] = React.useState(false)

  // Fetch read-only shared endpoint
  const { data: endpoint, isLoading: endpointLoading } = useSharedEndpoint(token)

  // Fetch shared payloads
  const { data: payloadsResponse, isLoading: payloadsLoading } = useSharedPayloads(token)
  const payloads = React.useMemo(() => {
    return payloadsResponse?.items || []
  }, [payloadsResponse])

  // Ingestion Inbound URL target format
  const getReceiverUrl = (slug?: string) => {
    if (!slug) return ""
    if (typeof window === "undefined") return `/api/v1/receiver/${slug}`
    const origin = window.location.origin.replace("3000", "8000")
    return `${origin}/api/v1/receiver/${slug}`
  }

  if (endpointLoading) {
    return (
      <div className="flex flex-col gap-6 min-h-screen p-8 bg-background font-sans">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (!endpoint) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 bg-background font-sans">
        <EmptyState
          icon={AlertTriangle}
          title="Expired or Invalid Share Session"
          description="The link you requested is invalid, expired, or has been revoked by the system administrator."
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Shared Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Logo size="lg" />
            <span className="text-sm font-bold tracking-tight">Gull Shared Console</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Console */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight">{endpoint.name}</h1>
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              Read-Only Collaborator View
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate max-w-full">
            Endpoint ID: {endpoint.id}
          </p>
        </div>

        {/* URL display card */}
        <Card className="border-border/50 bg-card/60 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Ingestion Endpoint URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2.5 font-mono text-xs overflow-x-auto">
              <Link2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 select-all truncate">{getReceiverUrl(endpoint.slug)}</span>
              <CopyButton value={getReceiverUrl(endpoint.slug)} size="sm" />
            </div>
          </CardContent>
        </Card>

        {/* Traffic list */}
        <Card className="border-border/50 bg-card/60 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Ingested Payloads Logs</CardTitle>
            <CardDescription>Event log from shared session window.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {payloadsLoading ? (
              <div className="p-6 flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : payloads.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Radio}
                  title="No traffic received"
                  description="Waiting for incoming HTTP POST webhook requests."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
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
                    <TableRow key={payload.id}>
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
      </main>

      <PayloadInspector
        payload={selectedPayload}
        open={isInspectorOpen}
        onOpenChange={setIsInspectorOpen}
      />
    </div>
  )
}
