"use client"

import * as React from "react"
import { ExternalLink, Plus, Trash } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { Destination } from "@/services/webhook"

interface DestinationsTabProps {
  destinations: Destination[]
  destLoading: boolean
  onOpenDestForm: (dest?: Destination | null) => void
  onDeleteDestination: (id: string) => void
}

export function DestinationsTab({
  destinations,
  destLoading,
  onOpenDestForm,
  onDeleteDestination,
}: DestinationsTabProps) {
  return (
    <Card className="border-border/50 bg-card/70 shadow-xs hover:shadow-md transition-all duration-300 mt-0">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Outbound Routing Targets</CardTitle>
          <CardDescription className="text-xs">
            Forward ingested webhooks in parallel routes.
          </CardDescription>
        </div>
        <Button
          className="primary-gradient-btn border-0"
          size="sm"
          onClick={() => onOpenDestForm(null)}
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
                  onClick={() => onOpenDestForm(null)}
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
                        onClick={() => onOpenDestForm(dest)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteDestination(dest.id)}
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
  )
}
