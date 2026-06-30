"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Check, Building } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWorkspaces, useCreateWorkspace } from "@/services/webhook"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Workspace {
  id: string
  name: string
  created_at: string
}

interface WorkspaceSwitcherProps {
  activeWorkspaceId: string | null
  onWorkspaceChange: (id: string) => void
}

export function WorkspaceSwitcher({
  activeWorkspaceId,
  onWorkspaceChange,
}: WorkspaceSwitcherProps) {
  const { data: workspaces, isLoading } = useWorkspaces()
  const createWorkspaceMutation = useCreateWorkspace()
  const [isCreating, setIsCreating] = React.useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = React.useState("")

  const activeWorkspace = React.useMemo(() => {
    return workspaces?.find((w) => w.id === activeWorkspaceId) || null
  }, [workspaces, activeWorkspaceId])

  // Select first workspace if activeWorkspaceId is not set
  React.useEffect(() => {
    if (workspaces && workspaces.length > 0 && !activeWorkspaceId) {
      onWorkspaceChange(workspaces[0].id)
    }
  }, [workspaces, activeWorkspaceId, onWorkspaceChange])

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return

    try {
      const created = await createWorkspaceMutation.mutateAsync({
        name: newWorkspaceName.trim(),
      })
      toast.success("Workspace created successfully")
      onWorkspaceChange(created.id)
      setNewWorkspaceName("")
      setIsCreating(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to create workspace")
    }
  }

  if (isLoading) {
    return <Skeleton className="h-9 w-full rounded-lg" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-semibold shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring select-none text-left justify-between hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
            <Building className="size-4" />
          </div>
          <span className="truncate">
            {activeWorkspace ? activeWorkspace.name : "Select Workspace"}
          </span>
        </div>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 font-sans">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Workspaces
        </DropdownMenuLabel>
        {workspaces?.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => onWorkspaceChange(ws.id)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{ws.name}</span>
            {ws.id === activeWorkspaceId && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {isCreating ? (
          <form onSubmit={handleCreateWorkspace} className="p-2 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Workspace name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="w-full rounded border px-2 py-1 text-xs outline-none focus:border-primary bg-background text-foreground"
              autoFocus
              required
            />
            <div className="flex gap-1 justify-end">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded px-2 py-1 text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createWorkspaceMutation.isPending}
                className="rounded px-2 py-1 text-[10px] bg-primary text-primary-foreground font-semibold hover:bg-primary/95"
              >
                Create
              </button>
            </div>
          </form>
        ) : (
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault()
              setIsCreating(true)
            }}
            className="flex items-center gap-2 text-primary hover:text-primary font-medium"
          >
            <Plus className="size-4" />
            <span>Create Workspace</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
