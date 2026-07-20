"use client"

import * as React from "react"
import { CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { WebhookPayload } from "@/services/webhook"

interface DeliveriesTabProps {
  payloads: WebhookPayload[]
}

export function DeliveriesTab({ payloads }: DeliveriesTabProps) {
  return (
    <Card className="border-border/50 bg-card/70 shadow-xs hover:shadow-md transition-all duration-300 mt-0">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Delivery Logs Audit Feed</CardTitle>
        <CardDescription className="text-xs">Outcome status of outbound fan-out requests.</CardDescription>
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
  )
}
