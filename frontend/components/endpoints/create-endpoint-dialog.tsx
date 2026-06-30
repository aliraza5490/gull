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
import { useCreateEndpoint } from "@/services/webhook"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateEndpointDialogProps {
  workspaceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateEndpointDialog({
  workspaceId,
  open,
  onOpenChange,
}: CreateEndpointDialogProps) {
  const createEndpointMutation = useCreateEndpoint(workspaceId || undefined)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [type, setType] = React.useState<"persistent" | "temporary">("persistent")
  const [secret, setSecret] = React.useState("")

  // Auto-generate slug from name
  React.useEffect(() => {
    const clean = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "")
    setSlug(clean)
  }, [name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter a name for the endpoint")
      return
    }
    if (!slug.trim()) {
      toast.error("Please enter a slug path")
      return
    }

    try {
      await createEndpointMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        type,
        secret: secret.trim() || undefined,
      })
      toast.success("Webhook endpoint created successfully")
      setName("")
      setSlug("")
      setSecret("")
      setType("persistent")
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to create endpoint")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md font-sans">
        <DialogHeader>
          <DialogTitle>Create Endpoint</DialogTitle>
          <DialogDescription>
            Configure an incoming endpoint target to receive HTTP POST logs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Endpoint Name</Label>
            <Input
              id="name"
              placeholder="Stripe Webhooks, GitHub Alerts..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createEndpointMutation.isPending}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">Slug Path</Label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-muted-foreground select-none font-mono">
                /v1/receiver/
              </span>
              <Input
                id="slug"
                className="pl-24 font-mono text-xs"
                placeholder="stripe-webhook"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={createEndpointMutation.isPending}
                required
              />
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Unique path suffix matching endpoint routing parameters.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Endpoint Durability</Label>
            <Select
              value={type}
              onValueChange={(val: any) => setType(val)}
              disabled={createEndpointMutation.isPending}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="persistent">Persistent (Production)</SelectItem>
                <SelectItem value="temporary">Temporary (Short-lived Dev Test)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="secret">Verification Secret (Optional)</Label>
            <Input
              id="secret"
              type="password"
              placeholder="Leave blank to skip validation header"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              disabled={createEndpointMutation.isPending}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createEndpointMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEndpointMutation.isPending}
              className="primary-gradient-btn border-0"
            >
              {createEndpointMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Create Endpoint"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
