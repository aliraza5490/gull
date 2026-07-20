"use client"

import * as React from "react"
import { toast } from "sonner"
import { Play, Loader2, Globe, Clock } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { JSONViewer } from "@/components/json-viewer"
import { CopyButton } from "@/components/copy-button"
import { getReceiverUrl } from "@/lib/utils"
import { useReplayPayload, useEndpoints, ReceiverEndpoint } from "@/services/webhook"

interface Payload {
  id: string
  endpoint_id: string
  method: string
  headers: any
  query_params: any
  raw_body: string
  parsed_body: any
  content_type: string
  is_drifted: boolean
  received_at: string
}

interface PayloadInspectorProps {
  payload: Payload | null
  open: boolean
  onOpenChange: (open: boolean) => void
  endpoint?: ReceiverEndpoint | null
}

export function PayloadInspector({
  payload,
  open,
  onOpenChange,
  endpoint: initialEndpoint,
}: PayloadInspectorProps) {
  const [activeTab, setActiveTab] = React.useState("body")
  const [customBody, setCustomBody] = React.useState("")
  const [isReplaying, setIsReplaying] = React.useState(false)

  const replayMutation = useReplayPayload(payload?.endpoint_id || "")

  const { data: endpointsResponse } = useEndpoints()
  const endpoint = React.useMemo(() => {
    if (initialEndpoint) return initialEndpoint
    if (!payload?.endpoint_id || !endpointsResponse?.items) return null
    return (
      endpointsResponse.items.find(
        (e) => String(e.id) === String(payload.endpoint_id)
      ) || null
    )
  }, [initialEndpoint, payload, endpointsResponse])

  const endpointName = endpoint?.name || (payload?.endpoint_id ? `Endpoint #${payload.endpoint_id}` : "Payload Inspector")
  const endpointUrl = getReceiverUrl(endpoint?.slug || payload?.endpoint_id)

  // Reset custom body when payload changes
  React.useEffect(() => {
    if (payload) {
      setCustomBody(payload.raw_body || "")
    }
  }, [payload])

  if (!payload) return null

  const handleReplay = async () => {
    setIsReplaying(true)
    try {
      await replayMutation.mutateAsync({
        payloadId: payload.id,
        customBody: customBody.trim() !== payload.raw_body?.trim() ? customBody : undefined,
      })
      toast.success("Webhook replayed successfully")
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to replay payload")
    } finally {
      setIsReplaying(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl font-sans flex flex-col h-full p-6 gap-5 overflow-y-auto bg-card border-l border-border/60">
        <SheetHeader className="p-0 pt-10 pb-4 border-b border-border/40 gap-2.5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="text-base font-bold text-foreground truncate">
                {endpointName}
              </SheetTitle>
              <Badge variant="outline" className="font-mono text-[10px] shrink-0 bg-muted/40 text-muted-foreground border-border/60">
                Event #{payload.id}
              </Badge>
            </div>
            {endpointUrl && (
              <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/40 max-w-full">
                <Globe className="size-3.5 shrink-0 text-primary" />
                <span className="truncate select-all text-foreground/90 font-medium">{endpointUrl}</span>
                <CopyButton value={endpointUrl} className="size-5 shrink-0 ml-auto" />
              </div>
            )}
            <SheetDescription className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
              <Clock className="size-3 text-muted-foreground/70" />
              Captured {new Date(payload.received_at).toLocaleString()}
            </SheetDescription>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 gap-4">
          <TabsList className="grid w-full grid-cols-4 bg-muted/60 shrink-0 p-1 h-10 rounded-xl">
            <TabsTrigger value="body" className="text-xs font-semibold rounded-lg">Body</TabsTrigger>
            <TabsTrigger value="headers" className="text-xs font-semibold rounded-lg">Headers</TabsTrigger>
            <TabsTrigger value="query" className="text-xs font-semibold rounded-lg">Params</TabsTrigger>
            <TabsTrigger value="replay" className="text-xs font-semibold rounded-lg text-primary hover:text-primary/80">Replay</TabsTrigger>
          </TabsList>

          {/* Body inspector view */}
          <TabsContent value="body" className="flex-1 overflow-y-auto mt-0 p-4 border border-border/60 rounded-xl bg-muted/20">
            {payload.parsed_body && Object.keys(payload.parsed_body).length > 0 ? (
              <JSONViewer data={payload.parsed_body} maxDepth={3} />
            ) : payload.raw_body ? (
              <pre className="font-mono text-xs whitespace-pre-wrap select-text leading-normal">
                {payload.raw_body}
              </pre>
            ) : (
              <div className="text-center text-xs text-muted-foreground py-8">
                Empty payload body
              </div>
            )}
          </TabsContent>

          {/* Headers inspector view */}
          <TabsContent value="headers" className="flex-1 overflow-y-auto mt-0 p-4 border border-border/60 rounded-xl bg-muted/20">
            <div className="flex flex-col gap-2">
              {Object.entries(payload.headers || {}).map(([key, val]) => (
                <div key={key} className="flex flex-col gap-1 border-b border-border/30 pb-2 last:border-0 font-mono text-xs">
                  <span className="font-semibold text-foreground/80">{key}</span>
                  <span className="text-muted-foreground select-all leading-normal">{String(val)}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Params inspector view */}
          <TabsContent value="query" className="flex-1 overflow-y-auto mt-0 p-4 border border-border/60 rounded-xl bg-muted/20">
            {Object.keys(payload.query_params || {}).length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                No query parameters attached
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {Object.entries(payload.query_params || {}).map(([key, val]) => (
                  <div key={key} className="flex items-start justify-between border-b border-border/30 pb-2 last:border-0 font-mono text-xs">
                    <span className="font-semibold text-foreground/80">{key}</span>
                    <span className="text-muted-foreground select-all">{String(val)}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Custom Replay panel */}
          <TabsContent value="replay" className="flex-1 flex flex-col gap-4 mt-0">
            <Button
              className="w-full primary-gradient-btn border-0 shrink-0"
              onClick={handleReplay}
              disabled={isReplaying}
            >
              {isReplaying ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : (
                <Play className="size-4 mr-1.5" />
              )}
              Replay Ingestion Log
            </Button>

            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <span className="text-xs font-semibold text-muted-foreground">
                Edit Request Body
              </span>
              <Textarea
                className="font-mono text-xs flex-1 min-h-[250px] bg-muted/10 border-border/60 p-3"
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                disabled={isReplaying}
              />
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
