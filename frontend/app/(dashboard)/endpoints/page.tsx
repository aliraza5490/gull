"use client"

import * as React from "react"
import Link from "next/link"
import { Eye, Radio, Plus, Power, ShieldCheck, Link2 } from "lucide-react"
import { toast } from "sonner"

import { useWorkspace } from "@/app/(dashboard)/layout"
import { useEndpoints, useUpdateEndpoint, useDeleteEndpoint } from "@/services/webhook"
import { CreateEndpointDialog } from "@/components/endpoints/create-endpoint-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"

export default function EndpointsListPage() {
  const { activeWorkspaceId } = useWorkspace()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [page, setPage] = React.useState(1)

  const { data: endpointsResponse, isLoading } = useEndpoints(
    activeWorkspaceId || undefined,
    page,
    20
  )

  const updateEndpointMutation = useUpdateEndpoint()
  const deleteEndpointMutation = useDeleteEndpoint()

  const endpoints = React.useMemo(() => {
    return endpointsResponse?.items || []
  }, [endpointsResponse])

  const total = endpointsResponse?.total || 0

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateEndpointMutation.mutateAsync({
        id,
        data: { is_active: !currentStatus },
      })
      toast.success(currentStatus ? "Endpoint paused" : "Endpoint activated")
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    }
  }

  // Calculate receiver path
  const getReceiverUrl = (slug: string) => {
    if (typeof window === "undefined") return `/api/v1/receiver/${slug}`
    const origin = window.location.origin.replace("3000", "8000") // route to backend receiver
    return `${origin}/api/v1/receiver/${slug}`
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Webhook Endpoints</h1>
          <p className="text-muted-foreground text-sm">
            Manage incoming webhooks, verification keys, and fanning targets.
          </p>
        </div>
        <Button className="primary-gradient-btn border-0 self-start sm:self-auto" onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4 mr-1.5" />
          New Endpoint
        </Button>
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
          <CardTitle className="text-base font-semibold">Active Endpoints</CardTitle>
          <CardDescription>
            Workspaces contain persistent and temporary webhook ingestion URLs.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {endpoints.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Radio}
                title="No Ingestion Endpoints"
                description="Create a persistent endpoint for production workflows or a temporary one for development test flows."
                action={
                  <Button className="primary-gradient-btn border-0" onClick={() => setIsCreateOpen(true)}>
                    Create Endpoint
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Ingestion Target URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="w-[100px] text-center">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((endpoint) => (
                  <TableRow key={endpoint.id}>
                    <TableCell className="font-semibold py-4">
                      {endpoint.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-2 max-w-[250px] sm:max-w-sm truncate text-muted-foreground hover:text-foreground transition-colors group select-all">
                        <Link2 className="size-3.5 shrink-0 opacity-50" />
                        <span className="truncate">{getReceiverUrl(endpoint.slug)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={endpoint.type === "temporary" ? "secondary" : "default"}>
                        {endpoint.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {endpoint.secret ? (
                          <>
                            <ShieldCheck className="size-4 text-emerald-500" />
                            <span>HMAC Active</span>
                          </>
                        ) : (
                          <span>None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={endpoint.is_active}
                          onCheckedChange={() => handleToggleActive(endpoint.id, endpoint.is_active)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/endpoints/${endpoint.id}`}>
                          <Eye className="size-4 text-muted-foreground hover:text-foreground" />
                          <span className="sr-only">Inspect endpoint</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateEndpointDialog
        workspaceId={activeWorkspaceId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  )
}
