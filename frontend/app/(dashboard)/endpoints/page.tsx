"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Eye, Radio, Plus, ShieldCheck, Link2 } from "lucide-react"
import { toast } from "sonner"

import { useWorkspace } from "@/app/(dashboard)/layout"
import { useEndpoints, useUpdateEndpoint } from "@/services/webhook"
import { CreateEndpointDialog } from "@/components/endpoints/create-endpoint-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { getReceiverUrl } from "@/lib/utils"

export default function EndpointsListPage() {
  const router = useRouter()
  const { activeWorkspaceId } = useWorkspace()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [page] = React.useState(1)

  const { data: endpointsResponse, isLoading } = useEndpoints(
    activeWorkspaceId || undefined,
    page,
    20
  )

  const updateEndpointMutation = useUpdateEndpoint()

  const endpoints = React.useMemo(() => {
    return endpointsResponse?.items || []
  }, [endpointsResponse])

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateEndpointMutation.mutateAsync({
        id,
        data: { is_active: !currentStatus },
      })
      toast.success(currentStatus ? "Endpoint paused" : "Endpoint activated")
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to update status")
    }
  }

  const handleCopyLink = async (e: React.MouseEvent, slug: string) => {
    e.stopPropagation()
    const url = getReceiverUrl(slug)
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
    } catch {
      toast.error("Failed to copy link")
    }
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
                  <TableRow
                    key={endpoint.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/endpoints/${endpoint.id}`)}
                  >
                    <TableCell className="font-semibold py-4">
                      {endpoint.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(e, endpoint.slug)}
                        className="flex items-center gap-2 max-w-[250px] sm:max-w-sm truncate text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors group text-left cursor-pointer"
                        title="Click to copy link"
                      >
                        <Link2 className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                        <span className="truncate">{getReceiverUrl(endpoint.slug)}</span>
                      </button>
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
                      <div
                        className="flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Switch
                          checked={endpoint.is_active}
                          onCheckedChange={() => handleToggleActive(endpoint.id, endpoint.is_active)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/endpoints/${endpoint.id}`)
                        }}
                      >
                        <Eye className="size-4 text-muted-foreground hover:text-foreground" />
                        <span className="sr-only">Inspect endpoint</span>
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
