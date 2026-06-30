"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateDestination, useUpdateDestination } from "@/services/webhook"

interface Destination {
  id: string
  endpoint_id: string
  name: string
  url: string
  method: string
  timeout: number
  is_active: boolean
  auth_type: string
  auth_config: any
  headers_to_inject: any
  headers_to_strip: string[]
  payload_transform_template: string | null
  created_at: string
}

interface DestinationFormProps {
  endpointId: string
  destination: Destination | null // Null means "Create mode"
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DestinationForm({
  endpointId,
  destination,
  open,
  onOpenChange,
}: DestinationFormProps) {
  const createDestinationMutation = useCreateDestination(endpointId)
  const updateDestinationMutation = useUpdateDestination(endpointId)

  const [name, setName] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [method, setMethod] = React.useState("POST")
  const [timeout, setTimeoutVal] = React.useState("30")
  const [authType, setAuthType] = React.useState("None")
  const [authConfig, setAuthConfig] = React.useState("")
  const [headersInject, setHeadersInject] = React.useState("")
  const [headersStrip, setHeadersStrip] = React.useState("")
  const [transformTemplate, setTransformTemplate] = React.useState("")

  const isEdit = !!destination

  // Initialize fields on load/edit
  React.useEffect(() => {
    if (destination) {
      setName(destination.name)
      setUrl(destination.url)
      setMethod(destination.method)
      setTimeoutVal(String(destination.timeout))
      setAuthType(destination.auth_type)
      setAuthConfig(JSON.stringify(destination.auth_config || {}, null, 2))
      setHeadersInject(JSON.stringify(destination.headers_to_inject || {}, null, 2))
      setHeadersStrip(destination.headers_to_strip?.join(", ") || "")
      setTransformTemplate(destination.payload_transform_template || "")
    } else {
      setName("")
      setUrl("")
      setMethod("POST")
      setTimeoutVal("30")
      setAuthType("None")
      setAuthConfig("{}")
      setHeadersInject("{}")
      setHeadersStrip("")
      setTransformTemplate("")
    }
  }, [destination, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter a destination name")
      return
    }
    if (!url.trim()) {
      toast.error("Please enter a forwarding URL target")
      return
    }

    // Try parsing configurations safely
    let parsedAuth = {}
    let parsedInject = {}
    let parsedStrip: string[] = []

    try {
      if (authConfig.trim()) parsedAuth = JSON.parse(authConfig)
    } catch {
      toast.error("Invalid Auth Config JSON syntax")
      return
    }

    try {
      if (headersInject.trim()) parsedInject = JSON.parse(headersInject)
    } catch {
      toast.error("Invalid Inject Headers JSON syntax")
      return
    }

    parsedStrip = headersStrip
      .split(",")
      .map((h) => h.trim())
      .filter((h) => !!h)

    const payload = {
      name: name.trim(),
      url: url.trim(),
      method,
      timeout: Number(timeout) || 30,
      auth_type: authType,
      auth_config: parsedAuth,
      headers_to_inject: parsedInject,
      headers_to_strip: parsedStrip,
      payload_transform_template: transformTemplate.trim() || null,
    }

    try {
      if (isEdit && destination) {
        await updateDestinationMutation.mutateAsync({
          id: destination.id,
          data: payload,
        })
        toast.success("Destination updated successfully")
      } else {
        await createDestinationMutation.mutateAsync(payload)
        toast.success("Destination added successfully")
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to save destination")
    }
  }

  const isPending =
    createDestinationMutation.isPending || updateDestinationMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg font-sans max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Configure Outbound Route" : "Add Downstream Destination"}
          </DialogTitle>
          <DialogDescription>
            Specify delivery URLs, authentication parameters, and request transform mappings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dest-name">Route Name</Label>
              <Input
                id="dest-name"
                placeholder="Staging webhook handler"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dest-method">HTTP Method</Label>
              <Select value={method} onValueChange={setMethod} disabled={isPending}>
                <SelectTrigger id="dest-method">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dest-url">Target Ingestion URL</Label>
            <Input
              id="dest-url"
              placeholder="https://api.yourdomain.com/v1/webhooks"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dest-timeout">Timeout Limit (Secs)</Label>
              <Input
                id="dest-timeout"
                type="number"
                value={timeout}
                onChange={(e) => setTimeoutVal(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dest-auth">Outbound Authentication</Label>
              <Select value={authType} onValueChange={setAuthType} disabled={isPending}>
                <SelectTrigger id="dest-auth">
                  <SelectValue placeholder="Auth Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Bearer">Bearer Token</SelectItem>
                  <SelectItem value="Basic">Basic Auth</SelectItem>
                  <SelectItem value="CustomSignature">Custom Verification Header</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {authType !== "None" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="dest-auth-config">Auth Config (JSON Map)</Label>
              <Textarea
                id="dest-auth-config"
                className="font-mono text-xs h-20"
                placeholder='{\n  "token": "secret-jwt-key"\n}'
                value={authConfig}
                onChange={(e) => setAuthConfig(e.target.value)}
                disabled={isPending}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="dest-headers-inject">Inject Headers (JSON Map)</Label>
            <Textarea
              id="dest-headers-inject"
              className="font-mono text-xs h-20"
              placeholder='{\n  "X-Custom-Source": "Gull Orchestrator"\n}'
              value={headersInject}
              onChange={(e) => setHeadersInject(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dest-headers-strip">Strip Incoming Headers (Comma-separated)</Label>
            <Input
              id="dest-headers-strip"
              placeholder="Authorization, Host, X-Forwarded-For"
              value={headersStrip}
              onChange={(e) => setHeadersStrip(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dest-transform">Payload Transform Template (Optional)</Label>
            <Textarea
              id="dest-transform"
              className="font-mono text-xs h-24"
              placeholder='{\n  "event": "user.signup",\n  "userId": "{{parsed_body.data.id}}"\n}'
              value={transformTemplate}
              onChange={(e) => setTransformTemplate(e.target.value)}
              disabled={isPending}
            />
            <p className="text-[10px] text-muted-foreground leading-normal">
              Map and transform payload elements before they leave Gull using `{"{{parsed_body.data}}"}`, etc.
            </p>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="primary-gradient-btn border-0">
              {isPending ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : isEdit ? (
                "Save Configuration"
              ) : (
                "Add Destination"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
