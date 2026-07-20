"use client"

import * as React from "react"
import { Radio } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { WebhookPayload } from "@/services/webhook"

interface PayloadsTabProps {
  payloads: WebhookPayload[]
  payloadsLoading: boolean
  diffSelection: string[]
  onDiffSelect: (id: string) => void
  onTriggerDiff: () => void
  onInspectPayload: (payload: WebhookPayload) => void
}

export function PayloadsTab({
  payloads,
  payloadsLoading,
  diffSelection,
  onDiffSelect,
  onTriggerDiff,
  onInspectPayload,
}: PayloadsTabProps) {
  return (
    <Card className="border-border/50 bg-card/70 shadow-xs hover:shadow-md transition-all duration-300 mt-0">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Ingested Inbound Payloads</CardTitle>
          <CardDescription className="text-xs">
            Live traffic stream log detailing received webhook events.
          </CardDescription>
        </div>
        {diffSelection.length >= 2 && (
          <Button className="primary-gradient-btn border-0" size="sm" onClick={onTriggerDiff}>
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
                <TableRow
                  key={payload.id}
                  className={`cursor-pointer hover:bg-muted/40 transition-colors ${
                    diffSelection.includes(String(payload.id)) ? "bg-primary/5 hover:bg-primary/10" : ""
                  }`}
                  onClick={() => onInspectPayload(payload)}
                >
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-muted accent-primary cursor-pointer"
                      checked={diffSelection.includes(String(payload.id))}
                      onChange={() => onDiffSelect(String(payload.id))}
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
                    <Badge
                      variant={payload.is_drifted ? "destructive" : "outline"}
                      className={payload.is_drifted ? "" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"}
                    >
                      {payload.is_drifted ? "Drifted" : "Verified"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {new Date(payload.received_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInspectPayload(payload)}
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
  )
}
