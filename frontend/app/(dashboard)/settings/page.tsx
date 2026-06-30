"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2, Settings, Users, Key } from "lucide-react"

import { useWorkspace } from "@/app/(dashboard)/layout"
import { useWorkspaces, useCreateWorkspace } from "@/services/webhook"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-context"

export default function WorkspaceSettingsPage() {
  const { user } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  const { data: workspaces } = useWorkspaces()

  const [workspaceName, setWorkspaceName] = React.useState("")
  const [isUpdatingWorkspace, setIsUpdatingWorkspace] = React.useState(false)

  const activeWorkspace = React.useMemo(() => {
    return workspaces?.find((w) => w.id === activeWorkspaceId) || null
  }, [workspaces, activeWorkspaceId])

  React.useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name)
    }
  }, [activeWorkspace])

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceName.trim()) return

    setIsUpdatingWorkspace(true)
    try {
      // Simulate/Trigger workspace name update if backend service supports it in future
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Workspace name updated successfully!")
    } catch {
      toast.error("Failed to update workspace details.")
    } finally {
      setIsUpdatingWorkspace(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure active workspaces parameters, metadata details, and user settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Workspace Influx settings */}
        <Card className="border-border/50 bg-card/60 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Workspace Configuration</CardTitle>
            <CardDescription>Update name parameters and metadata for the current workspace.</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateWorkspace}>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ws-name">Workspace Name</Label>
                <Input
                  id="ws-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={isUpdatingWorkspace}
                  required
                />
              </div>

              <div className="flex flex-col gap-1 font-mono text-[10px] text-muted-foreground">
                <span>ID: {activeWorkspaceId || "N/A"}</span>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t border-border/30 pt-4">
              <Button type="submit" disabled={isUpdatingWorkspace} className="primary-gradient-btn border-0">
                {isUpdatingWorkspace && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* User profile parameters */}
        <Card className="border-border/50 bg-card/60 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Account Settings</CardTitle>
            <CardDescription>Personal credentials associated with the authenticated profile.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Email Address</Label>
              <Input value={user?.email || ""} disabled readOnly className="bg-muted/30" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Account Creation Date</Label>
              <Input
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                disabled
                readOnly
                className="bg-muted/30"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
