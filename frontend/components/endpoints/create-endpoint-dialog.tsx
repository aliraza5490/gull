"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2, ChevronDown, RefreshCw } from "lucide-react"

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  const [durationHours, setDurationHours] = React.useState<number>(24)
  
  const isSlugModified = React.useRef(true)

  // Reset fields and set random slug when dialog opens
  React.useEffect(() => {
    if (open) {
      setName("")
      setSlug("ep-" + Math.random().toString(36).substring(2, 10))
      setSecret("")
      setType("persistent")
      setDurationHours(24)
      isSlugModified.current = true
    }
  }, [open])

  // Auto-generate slug from name
  React.useEffect(() => {
    if (!name.trim()) {
      isSlugModified.current = false
      setSlug("")
      return
    }
    if (isSlugModified.current) return
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

    let expiresAtIso: string | undefined = undefined
    if (type === "temporary") {
      const expDate = new Date()
      expDate.setTime(expDate.getTime() + durationHours * 60 * 60 * 1000)
      expiresAtIso = expDate.toISOString()
    }

    try {
      await createEndpointMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        type,
        secret: secret.trim() || undefined,
        expires_at: expiresAtIso,
      })
      toast.success("Webhook endpoint created successfully")
      setName("")
      setSlug("")
      setSecret("")
      setType("persistent")
      setDurationHours(24)
      isSlugModified.current = false
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
            <div className="relative flex items-center w-full">
              <span className="absolute left-3 text-xs text-muted-foreground select-none font-mono">
                /v1/receiver/
              </span>
              <Input
                id="slug"
                className="pl-24 pr-10 font-mono text-xs"
                placeholder="stripe-webhook"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  isSlugModified.current = true
                }}
                disabled={createEndpointMutation.isPending}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/20"
                onClick={() => {
                  const rand = "ep-" + Math.random().toString(36).substring(2, 10)
                  setSlug(rand)
                  isSlugModified.current = true
                }}
                disabled={createEndpointMutation.isPending}
                title="Generate random slug"
                aria-label="Generate random slug"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Unique path suffix matching endpoint routing parameters.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Endpoint Durability</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={createEndpointMutation.isPending}>
                <Button
                  id="type"
                  variant="outline"
                  className="w-full justify-between font-normal bg-background border-input"
                >
                  {type === "persistent"
                    ? "Persistent (Production)"
                    : type === "temporary"
                    ? "Temporary (Short-lived Dev Test)"
                    : "Select type"}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {([
                  { value: "persistent", label: "Persistent (Production)" },
                  { value: "temporary", label: "Temporary (Short-lived Dev Test)" },
                ] as const).map((item) => (
                  <DropdownMenuItem key={item.value} onClick={() => setType(item.value)}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {type === "temporary" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="duration">Expiration Time</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={createEndpointMutation.isPending}>
                  <Button
                    id="duration"
                    variant="outline"
                    className="w-full justify-between font-normal bg-background border-input"
                  >
                    {durationHours === 1
                      ? "1 Hour"
                      : durationHours === 24
                      ? "24 Hours (Default)"
                      : durationHours === 168
                      ? "7 Days"
                      : durationHours === 720
                      ? "30 Days"
                      : `${durationHours} Hours`}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {[
                    { hours: 1, label: "1 Hour" },
                    { hours: 24, label: "24 Hours (Default)" },
                    { hours: 168, label: "7 Days" },
                    { hours: 720, label: "30 Days" },
                  ].map((item) => (
                    <DropdownMenuItem key={item.hours} onClick={() => setDurationHours(item.hours)}>
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Temporary endpoint will automatically deactivate after this period.
              </p>
            </div>
          )}

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
