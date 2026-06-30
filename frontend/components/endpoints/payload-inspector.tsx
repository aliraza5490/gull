"use client"

import * as React from "react"
import { toast } from "sonner"
import { Play, Loader2, ArrowRight } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { JSONViewer } from "@/components/json-viewer"
import { useReplayPayload } from "@/services/webhook"

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
}

export function PayloadInspector({
  payload,
  open,
  onOpenChange,
}: PayloadInspectorProps) {
  const [activeTab, setActiveTab] = React.useState("body")
  const [customBody, setCustomBody] = React.useState("")
  const [isReplaying, setIsReplaying] = React.useState(false)

  const replayMutation = useReplayPayload(payload?.endpoint_id || "")

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
      <SheetContent className="sm:max-w-xl font-sans flex flex-col h-full gap-4 overflow-y-auto">
        <SheetHeader className="pb-2 border-b border-border/40">
          <div className="flex items-center justify-between mt-4">
            <SheetTitle className="text-base font-semibold font-mono text-muted-foreground truncate max-w-[300px]">
              {payload.id}
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            Captured {new Date(payload.received_at).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 bg-muted/60 shrink-0">
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="query">Params</TabsTrigger>
            <TabsTrigger value="replay" className="text-primary hover:text-primary/80">Replay</TabsTrigger>
          </TabsList>

          {/* Body inspector view */}
          <TabsContent value="body" className="flex-1 overflow-y-auto mt-4 p-4 border rounded-xl bg-muted/20">
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
          <TabsContent value="headers" className="flex-1 overflow-y-auto mt-4 p-4 border rounded-xl bg-muted/20">
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
          <TabsContent value="query" className="flex-1 overflow-y-auto mt-4 p-4 border rounded-xl bg-muted/20">
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
          <TabsContent value="replay" className="flex-1 flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <span className="text-xs font-semibold text-muted-foreground">
                Edit Request Body
              </span>
              <Textarea
                className="font-mono text-xs flex-1 min-h-[250px] bg-muted/10"
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                disabled={isReplaying}
              />
            </div>

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
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
