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

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"

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
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-background font-sans">
            <Sidebar>
              {/* Header Brand */}
              <SidebarHeader className="h-16 flex items-center justify-center px-6 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2">
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
              </SidebarHeader>

              {/* Switcher & Links */}
              <SidebarContent className="flex flex-col gap-4 p-4">
                <WorkspaceSwitcher
                  activeWorkspaceId={activeWorkspaceId}
                  onWorkspaceChange={handleWorkspaceChange}
                />

                <SidebarMenu className="gap-2 mt-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="w-full"
                        >
                          <Link href={item.href}>
                            <item.icon className="size-4 shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>

            {/* Main Content Area */}
            <SidebarInset className="flex flex-col flex-1 min-w-0">
              {/* Topbar Header */}
              <header className="flex h-16 items-center justify-between border-b px-6 bg-card shrink-0 gap-4">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  {/* Page placeholder spacer / Title */}
                  <div className="text-sm font-medium text-muted-foreground hidden md:block">
                    Workspace Console
                  </div>
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
            </SidebarInset>
          </div>
        </SidebarProvider>
      </WorkspaceContext.Provider>
    </AuthGuard>
  )
}
