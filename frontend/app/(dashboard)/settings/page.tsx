"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Loader2,
  Building,
  Users,
  Key,
  ShieldCheck,
  Hourglass,
  RotateCcw,
  CreditCard,
  Download,
  Plus,
  Trash2,
  Mail,
  UserCheck,
} from "lucide-react"

import { useWorkspace } from "@/app/(dashboard)/layout"
import { useWorkspaces } from "@/services/webhook"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-context"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Member {
  id: string
  name: string
  email: string
  role: "Admin" | "Member" | "Viewer"
  joinedAt: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  const { data: workspaces } = useWorkspaces()

  // Tab State
  const [activeTab, setActiveTab] = React.useState("workspace")

  // Workspace Name State
  const [workspaceName, setWorkspaceName] = React.useState("")
  const [isUpdatingWorkspace, setIsUpdatingWorkspace] = React.useState(false)

  const activeWorkspace = React.useMemo(() => {
    return workspaces?.find((w) => String(w.id) === String(activeWorkspaceId)) || null
  }, [workspaces, activeWorkspaceId])

  React.useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name)
    }
  }, [activeWorkspace])

  // Mock Workspace Members
  const [members, setMembers] = React.useState<Member[]>([
    {
      id: "1",
      name: "You",
      email: user?.email || "owner@gull.dev",
      role: "Admin",
      joinedAt: "2026-01-10",
    },
    {
      id: "2",
      name: "Sarah Chen",
      email: "sarah.chen@gull.dev",
      role: "Member",
      joinedAt: "2026-03-15",
    },
    {
      id: "3",
      name: "Alex Rivera",
      email: "alex.r@gull.dev",
      role: "Viewer",
      joinedAt: "2026-05-20",
    },
  ])

  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState<"Admin" | "Member" | "Viewer">("Member")
  const [isInviting, setIsInviting] = React.useState(false)

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceName.trim()) return

    setIsUpdatingWorkspace(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success("Workspace name updated successfully!")
    } catch {
      toast.error("Failed to update workspace details.")
    } finally {
      setIsUpdatingWorkspace(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const newMember: Member = {
        id: Math.random().toString(36).substring(2, 9),
        name: inviteEmail.split("@")[0],
        email: inviteEmail.trim(),
        role: inviteRole,
        joinedAt: new Date().toISOString().split("T")[0],
      }
      setMembers([...members, newMember])
      setInviteEmail("")
      toast.success(`Invitation sent to ${inviteEmail}`)
    } catch {
      toast.error("Failed to send invitation.")
    } finally {
      setIsInviting(false)
    }
  }

  const handleDeleteMember = (id: string) => {
    if (id === "1") {
      toast.error("You cannot remove yourself from this workspace.")
      return
    }
    setMembers(members.filter((m) => m.id !== id))
    toast.success("Member removed from workspace.")
  }

  // Webhook Defaults Settings State
  const [verifySignatures, setVerifySignatures] = React.useState(true)
  const [defaultTimeout, setDefaultTimeout] = React.useState("30")
  const [retryPolicy, setRetryPolicy] = React.useState("exponential")
  const [maxAttempts, setMaxAttempts] = React.useState("5")
  const [driftDetection, setDriftDetection] = React.useState(true)
  const [isSavingDefaults, setIsSavingDefaults] = React.useState(false)

  const handleSaveDefaults = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingDefaults(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success("Webhook default configurations saved successfully!")
    } catch {
      toast.error("Failed to save webhook settings.")
    } finally {
      setIsSavingDefaults(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage workspace settings, configured defaults, and access billing logs.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 bg-muted/60 p-1 border border-border/30 rounded-2xl w-fit">
          <TabsTrigger value="workspace" className="rounded-xl px-4 py-1.5">
            <Building className="mr-2 size-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="rounded-xl px-4 py-1.5">
            <ShieldCheck className="mr-2 size-4" />
            Webhook Defaults
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl px-4 py-1.5">
            <CreditCard className="mr-2 size-4" />
            Billing & Usage
          </TabsTrigger>
        </TabsList>

        {/* WORKSPACE TAB */}
        <TabsContent value="workspace" className="flex flex-col gap-6 outline-hidden">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Rename Workspace */}
            <Card className="border-border/50 bg-card/60 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building className="size-4 text-primary" />
                  Workspace Profile
                </CardTitle>
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

                  <div className="flex flex-col gap-1 font-mono text-[10px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/20">
                    <span>Active Workspace ID: {activeWorkspaceId || "N/A"}</span>
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

            {/* Invite Members */}
            <Card className="border-border/50 bg-card/60 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  Invite Workspace Members
                </CardTitle>
                <CardDescription>Collaborators will have access to all endpoints, forwardings, and logs.</CardDescription>
              </CardHeader>
              <form onSubmit={handleInviteMember}>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 size-4 text-muted-foreground" />
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="collaborator@company.com"
                        className="pl-10"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={isInviting}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Assign Workspace Role</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(val: any) => setInviteRole(val)}
                      disabled={isInviting}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin (Full Control)</SelectItem>
                        <SelectItem value="Member">Member (Read & Edit)</SelectItem>
                        <SelectItem value="Viewer">Viewer (Read Only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="justify-end border-t border-border/30 pt-4">
                  <Button type="submit" disabled={isInviting} className="primary-gradient-btn border-0">
                    {isInviting && <Loader2 className="size-4 animate-spin mr-1.5" />}
                    Send Invite
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Members Table */}
          <Card className="border-border/50 bg-card/60 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Active Members</CardTitle>
              <CardDescription>Manage user roles and remove users from this workspace context.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="pl-6">Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead className="w-12 text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/10 border-border/30">
                      <TableCell className="font-medium pl-6 flex items-center gap-2">
                        <div className="size-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground select-none uppercase">
                          {member.name.substring(0, 2)}
                        </div>
                        {member.name}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            member.role === "Admin"
                              ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
                              : member.role === "Member"
                              ? "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{member.joinedAt}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={member.id === "1"}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WEBHOOK DEFAULTS TAB */}
        <TabsContent value="webhooks" className="flex flex-col gap-6 outline-hidden">
          <Card className="border-border/50 bg-card/60 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Default Endpoint & Delivery Parameters</CardTitle>
              <CardDescription>
                Define global settings automatically inherited when creating new webhook configurations.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveDefaults}>
              <CardContent className="flex flex-col gap-6">
                {/* Switches Section */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/20 bg-background/40">
                    <div className="flex flex-col gap-1 pr-6">
                      <span className="text-sm font-medium">Verify Incoming Signatures</span>
                      <span className="text-xs text-muted-foreground">
                        Enforces signature validation checks against endpoints by default using configured keys.
                      </span>
                    </div>
                    <Switch checked={verifySignatures} onCheckedChange={setVerifySignatures} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/20 bg-background/40">
                    <div className="flex flex-col gap-1 pr-6">
                      <span className="text-sm font-medium">Continuous Schema Drift Alerting</span>
                      <span className="text-xs text-muted-foreground">
                        Automatically analyze incoming payloads and highlight schema differences/inconsistencies.
                      </span>
                    </div>
                    <Switch checked={driftDetection} onCheckedChange={setDriftDetection} />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Timeout */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="default-timeout" className="flex items-center gap-1">
                      <Hourglass className="size-3.5 text-muted-foreground" />
                      Default Timeout (Seconds)
                    </Label>
                    <Input
                      id="default-timeout"
                      type="number"
                      min="1"
                      max="120"
                      value={defaultTimeout}
                      onChange={(e) => setDefaultTimeout(e.target.value)}
                    />
                    <span className="text-[10px] text-muted-foreground">Max seconds before connection failure.</span>
                  </div>

                  {/* Retry Policy */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="retry-policy" className="flex items-center gap-1">
                      <RotateCcw className="size-3.5 text-muted-foreground" />
                      Delivery Retry Policy
                    </Label>
                    <Select value={retryPolicy} onValueChange={setRetryPolicy}>
                      <SelectTrigger id="retry-policy" className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exponential">Exponential Backoff</SelectItem>
                        <SelectItem value="linear">Linear Retries</SelectItem>
                        <SelectItem value="none">Immediate Drop (No Retries)</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-[10px] text-muted-foreground">Algorithm governing retries intervals.</span>
                  </div>

                  {/* Max Attempts */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="max-attempts" className="flex items-center gap-1">
                      <RotateCcw className="size-3.5 text-muted-foreground" />
                      Maximum Retry Attempts
                    </Label>
                    <Input
                      id="max-attempts"
                      type="number"
                      min="1"
                      max="15"
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(e.target.value)}
                      disabled={retryPolicy === "none"}
                    />
                    <span className="text-[10px] text-muted-foreground">Total dispatch executions allowed.</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-border/30 pt-4">
                <Button type="submit" disabled={isSavingDefaults} className="primary-gradient-btn border-0">
                  {isSavingDefaults && <Loader2 className="size-4 animate-spin mr-1.5" />}
                  Save Defaults
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* BILLING TAB */}
        <TabsContent value="billing" className="flex flex-col gap-6 outline-hidden">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Current Plan */}
            <Card className="border-border/50 bg-card/60 shadow-xs flex flex-col justify-between">
              <CardHeader>
                <span className="text-xs font-semibold text-primary tracking-wider uppercase">Active Plan</span>
                <CardTitle className="text-2xl font-bold mt-1">Professional Tier</CardTitle>
                <CardDescription>Advanced webhook proxying, live streaming, & alerts.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">Renews on</span>
                  <span className="font-medium">Aug 1, 2026</span>
                </div>
                <div className="flex justify-between text-xs border-b border-border/20 py-2">
                  <span className="text-muted-foreground">Monthly Cost</span>
                  <span className="font-medium">$29.00 / month</span>
                </div>
                <div className="flex justify-between text-xs py-2">
                  <span className="text-muted-foreground">Payment Status</span>
                  <span className="text-emerald-500 font-medium">Paid (Auto-pay active)</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-border/30">
                <Button variant="outline" className="w-full text-xs font-sans">
                  Change Subscription Plan
                </Button>
              </CardFooter>
            </Card>

            {/* Delivery Stats Usage */}
            <Card className="border-border/50 bg-card/60 shadow-xs flex flex-col justify-between md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Usage Summary (July 2026)</CardTitle>
                <CardDescription>Active delivery count relative to subscription tier allotments.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Metric 1 */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Monthly Webhook Deliveries</span>
                    <span className="text-muted-foreground">84,329 / 100,000 requests</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/10">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: "84.3%" }} />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Active Inbound Endpoints</span>
                    <span className="text-muted-foreground">6 / 15 endpoints</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/10">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: "40%" }} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground bg-muted/20 border-t border-border/30 px-6 py-3 rounded-b-xl flex items-center justify-between">
                <span>Usage reset in 29 days.</span>
                <span className="font-medium text-foreground">Next tier starts at 150k.</span>
              </CardFooter>
            </Card>
          </div>

          {/* Invoice History */}
          <Card className="border-border/50 bg-card/60 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Invoices & Receipts</CardTitle>
              <CardDescription>Review recent statements and export receipts.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="pl-6">Invoice ID</TableHead>
                    <TableHead>Billing Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: "INV-2026-006", date: "Jul 01, 2026", amount: "$29.00", status: "Paid" },
                    { id: "INV-2026-005", date: "Jun 01, 2026", amount: "$29.00", status: "Paid" },
                    { id: "INV-2026-004", date: "May 01, 2026", amount: "$29.00", status: "Paid" },
                  ].map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/10 border-border/30">
                      <TableCell className="font-mono text-xs pl-6">{inv.id}</TableCell>
                      <TableCell>{inv.date}</TableCell>
                      <TableCell className="font-medium">{inv.amount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                          <Download className="size-3" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
