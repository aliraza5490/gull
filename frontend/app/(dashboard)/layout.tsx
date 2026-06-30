"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Activity, LayoutDashboard, Settings, Radio } from "lucide-react"

import { AuthGuard } from "@/components/auth-guard"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { UserNav } from "@/components/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useWorkspaces } from "@/services/webhook"

// Workspace ID Context to share the active workspace across the dashboard
export const WorkspaceContext = React.createContext<{
  activeWorkspaceId: string | null
  setActiveWorkspaceId: (id: string) => void
} | null>(null)

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext)
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: workspaces } = useWorkspaces()
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState<string | null>(null)

  // Initialize workspace from localStorage or workspaces list
  React.useEffect(() => {
    const saved = localStorage.getItem("gull_active_workspace")
    if (saved) {
      setActiveWorkspaceId(saved)
    } else if (workspaces && workspaces.length > 0) {
      setActiveWorkspaceId(workspaces[0].id)
      localStorage.setItem("gull_active_workspace", workspaces[0].id)
    }
  }, [workspaces])

  const handleWorkspaceChange = React.useCallback((id: string) => {
    setActiveWorkspaceId(id)
    localStorage.setItem("gull_active_workspace", id)
  }, [])

  const navItems = React.useMemo(() => {
    return [
      {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Endpoints",
        href: "/endpoints",
        icon: Radio,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ]
  }, [])

  return (
    <AuthGuard>
      <WorkspaceContext.Provider
        value={{ activeWorkspaceId, setActiveWorkspaceId: handleWorkspaceChange }}
      >
        <div className="flex min-h-screen bg-background font-sans">
          {/* Collapsible/Fixed Sidebar Shell */}
          <aside className="hidden border-r bg-card w-64 md:flex flex-col shrink-0">
            {/* Header Brand */}
            <div className="flex h-16 items-center px-6 gap-2 border-b border-border/40">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-4"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 12c0-1.5 1-3 3-4s4.5-1.5 6-1c1.5.5 2 2 1.5 3.5S11 14 9 15s-4.5 1-5.5-.5" />
                  <path d="M21 8c-1-1.5-3-2.5-5-2s-3 2.5-2.5 4.5 2 3.5 4 3 3.5-2 3.5-3.5V8Z" />
                  <path d="M12 10.5c.5 2 1 4 2 5.5s3 2.5 4.5 2" />
                </svg>
              </div>
              <span className="font-bold tracking-tight text-foreground text-sm">Gull</span>
            </div>

            {/* Switcher & Links */}
            <div className="flex flex-col gap-4 p-4 flex-1">
              <WorkspaceSwitcher
                activeWorkspaceId={activeWorkspaceId}
                onWorkspaceChange={handleWorkspaceChange}
              />

              <nav className="flex flex-col gap-1 mt-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none ${
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Topbar Header */}
            <header className="flex h-16 items-center justify-between border-b px-6 bg-card shrink-0 gap-4">
              {/* Mobile layout items */}
              <div className="flex items-center gap-2 md:hidden">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12c0-1.5 1-3 3-4s4.5-1.5 6-1c1.5.5 2 2 1.5 3.5S11 14 9 15s-4.5 1-5.5-.5" />
                      <path d="M21 8c-1-1.5-3-2.5-5-2s-3 2.5-2.5 4.5 2 3.5 4 3 3.5-2 3.5-3.5V8Z" />
                      <path d="M12 10.5c.5 2 1 4 2 5.5s3 2.5 4.5 2" />
                    </svg>
                  </div>
                </Link>
              </div>

              {/* Page placeholder spacer / Title */}
              <div className="text-sm font-medium text-muted-foreground hidden md:block">
                Workspace Console
              </div>

              {/* Actions & Profiles */}
              <div className="flex items-center gap-4 ml-auto">
                <ThemeToggle />
                <UserNav />
              </div>
            </header>

            {/* Dashboard Workspace */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
              {children}
            </main>
          </div>
        </div>
      </WorkspaceContext.Provider>
    </AuthGuard>
  )
}
