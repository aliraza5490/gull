"use client"

import * as React from "react"
import { CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { SchemaDriftAlert } from "@/services/webhook"

interface AlertsTabProps {
  driftAlerts: SchemaDriftAlert[]
  alertsLoading: boolean
}

export function AlertsTab({ driftAlerts, alertsLoading }: AlertsTabProps) {
  return (
    <Card className="border-border/50 bg-card/70 shadow-xs hover:shadow-md transition-all duration-300 mt-0">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Schema Drift Alerts</CardTitle>
        <CardDescription className="text-xs">
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
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {new Date(alert.created_at).toLocaleString()}
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
