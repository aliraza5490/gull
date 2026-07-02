"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Loader2,
  User,
  Lock,
  Terminal,
  Copy,
  Check,
  Plus,
  Trash2,
  Key,
  ShieldCheck,
  Info,
} from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Token {
  id: string
  name: string
  token: string
  createdAt: string
  lastUsed: string
}

const AVATAR_COLORS = [
  "bg-primary text-primary-foreground",
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-violet-500 text-white",
  "bg-orange-500 text-white",
  "bg-pink-500 text-white",
]

export default function ProfilePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = React.useState("general")

  // Personal Info Form State
  const [fullName, setFullName] = React.useState("")
  const [jobRole, setJobRole] = React.useState("Backend Engineer")
  const [department, setDepartment] = React.useState("Engineering")
  const [avatarColor, setAvatarColor] = React.useState(AVATAR_COLORS[0])
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)

  React.useEffect(() => {
    if (user?.email) {
      const parts = user.email.split("@")[0].split(".")
      const capName = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
      setFullName(capName || "Developer Profile")
    }
  }, [user])

  // Get initials for avatar preview
  const initials = React.useMemo(() => {
    if (!fullName) return "DP"
    return fullName
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }, [fullName])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success("Profile information updated successfully!")
    } catch {
      toast.error("Failed to update profile.")
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Security Form State
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!")
      return
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }

    setIsUpdatingPassword(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password changed successfully!")
    } catch {
      toast.error("Failed to update password.")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // Developer Tokens State
  const [tokens, setTokens] = React.useState<Token[]>([
    {
      id: "tok_1",
      name: "Local Dev CLI",
      token: "gt_live_d7a8e8f9b2c3d4",
      createdAt: "2026-06-01",
      lastUsed: "2 hours ago",
    },
    {
      id: "tok_2",
      name: "GitHub Actions Deployer",
      token: "gt_live_4a5b6c7d8e9f0a",
      createdAt: "2026-06-15",
      lastUsed: "Yesterday",
    },
  ])

  const [newTokenName, setNewTokenName] = React.useState("")
  const [generatedToken, setGeneratedToken] = React.useState<string | null>(null)
  const [isGeneratingToken, setIsGeneratingToken] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTokenName.trim()) return

    setIsGeneratingToken(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const secretHex = Array.from({ length: 24 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")
      const fullToken = `gt_live_${secretHex}`
      
      const newTok: Token = {
        id: Math.random().toString(36).substring(2, 9),
        name: newTokenName.trim(),
        token: fullToken,
        createdAt: new Date().toISOString().split("T")[0],
        lastUsed: "Never",
      }

      setTokens([newTok, ...tokens])
      setGeneratedToken(fullToken)
      setNewTokenName("")
      toast.success("Personal access token generated successfully!")
    } catch {
      toast.error("Failed to generate token.")
    } finally {
      setIsGeneratingToken(false)
    }
  }

  const handleDeleteToken = (id: string) => {
    setTokens(tokens.filter((t) => t.id !== id))
    toast.success("Personal access token revoked.")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Token copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal details, secure your account credentials, and generate developer tokens.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 bg-muted/60 p-1 border border-border/30 rounded-2xl w-fit">
          <TabsTrigger value="general" className="rounded-xl px-4 py-1.5">
            <User className="mr-2 size-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-4 py-1.5">
            <Lock className="mr-2 size-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="developer" className="rounded-xl px-4 py-1.5">
            <Terminal className="mr-2 size-4" />
            Developer Tools
          </TabsTrigger>
        </TabsList>

        {/* GENERAL TAB */}
        <TabsContent value="general" className="flex flex-col gap-6 outline-hidden">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Avatar preview */}
            <Card className="border-border/50 bg-card/60 shadow-xs flex flex-col items-center justify-center p-6 text-center">
              <div className={`size-24 rounded-full ${avatarColor} flex items-center justify-center text-3xl font-extrabold shadow-md mb-4 select-none animate-pulse`}>
                {initials}
              </div>
              <h2 className="text-base font-semibold">{fullName || "User Profile"}</h2>
              <p className="text-muted-foreground text-xs">{user?.email}</p>
              
              <div className="mt-6 flex flex-col gap-2 w-full">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider text-left">Choose Avatar Style</span>
                <div className="flex gap-2 justify-center">
                  {AVATAR_COLORS.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarColor(color)}
                      className={`size-6 rounded-full ${color.split(" ")[0]} border-2 ${avatarColor === color ? 'border-primary scale-110' : 'border-transparent'} transition-all`}
                    />
                  ))}
                </div>
              </div>
            </Card>

            {/* Profile Info Form */}
            <Card className="border-border/50 bg-card/60 shadow-xs md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Personal Details</CardTitle>
                <CardDescription>Configure your profile values visible to workspace members.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveProfile}>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input
                        id="full-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isSavingProfile}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Account Email (Read Only)</Label>
                      <Input value={user?.email || ""} disabled readOnly className="bg-muted/30" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="job-role">Job Title</Label>
                      <Input
                        id="job-role"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        disabled={isSavingProfile}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={isSavingProfile}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end border-t border-border/30 pt-4">
                  <Button type="submit" disabled={isSavingProfile} className="primary-gradient-btn border-0">
                    {isSavingProfile && <Loader2 className="size-4 animate-spin mr-1.5" />}
                    Save Profile
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="flex flex-col gap-6 outline-hidden">
          <Card className="border-border/50 bg-card/60 shadow-xs max-w-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Change Password</CardTitle>
              <CardDescription>Update your personal account credentials below.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdatePassword}>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="curr-password">Current Password</Label>
                  <Input
                    id="curr-password"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isUpdatingPassword}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isUpdatingPassword}
                    required
                  />
                  <span className="text-[10px] text-muted-foreground leading-normal">
                    Password must contain at least 8 characters with a mix of numbers and letters.
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isUpdatingPassword}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-border/30 pt-4">
                <Button type="submit" disabled={isUpdatingPassword} className="primary-gradient-btn border-0">
                  {isUpdatingPassword && <Loader2 className="size-4 animate-spin mr-1.5" />}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* DEVELOPER TOOLS TAB */}
        <TabsContent value="developer" className="flex flex-col gap-6 outline-hidden">
          {/* New Token Banner/Alert */}
          {generatedToken && (
            <Card className="border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 shadow-xs">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <span>Personal Access Token Generated Successfully</span>
                </div>
                <p className="text-xs text-muted-foreground leading-normal">
                  Make sure to copy your personal access token now. You won't be able to see it again!
                </p>
                <div className="flex items-center gap-2 mt-2 bg-background border border-emerald-500/20 p-2.5 rounded-lg font-mono text-xs select-all">
                  <span className="flex-1 break-all text-foreground">{generatedToken}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedToken)}
                    className="shrink-0 text-muted-foreground hover:text-foreground h-8"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-500 animate-bounce" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit mt-1 text-xs"
                  onClick={() => setGeneratedToken(null)}
                >
                  I've Saved This Token
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            {/* Generate Token form */}
            <Card className="border-border/50 bg-card/60 shadow-xs flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Key className="size-4 text-primary" />
                  Generate New Token
                </CardTitle>
                <CardDescription>Personal access tokens allow you to authenticate with the Gull API CLI.</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateToken}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="token-name">Token Description</Label>
                    <Input
                      id="token-name"
                      placeholder="e.g. CLI Production Proxy"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                      disabled={isGeneratingToken}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="justify-end pt-4 border-t border-border/30">
                  <Button type="submit" disabled={isGeneratingToken} className="primary-gradient-btn border-0 w-full">
                    {isGeneratingToken && <Loader2 className="size-4 animate-spin mr-1.5" />}
                    <Plus className="mr-1 size-4" />
                    Create Token
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Token List */}
            <Card className="border-border/50 bg-card/60 shadow-xs md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Active Personal Tokens</CardTitle>
                <CardDescription>Active keys that currently grant full authentication access.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="pl-6">Description</TableHead>
                      <TableHead>Key Prefix</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead className="w-12 text-right pr-6">Revoke</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No active tokens found. Create one above to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tokens.map((tok) => (
                        <TableRow key={tok.id} className="hover:bg-muted/10 border-border/30">
                          <TableCell className="font-medium pl-6">{tok.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted/40 px-1.5 py-0.5 rounded border border-border/20">
                              {tok.token.substring(0, 12)}...
                            </code>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{tok.createdAt}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{tok.lastUsed}</TableCell>
                          <TableCell className="text-right pr-6">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                              onClick={() => handleDeleteToken(tok.id)}
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Revoke</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
