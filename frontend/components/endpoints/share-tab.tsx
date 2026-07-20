"use client"

import * as React from "react"
import { ChevronDown, Link2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CopyButton } from "@/components/copy-button"

interface ShareTabProps {
  shareExpiration: string
  onShareExpirationChange: (expiration: string) => void
  shareLink: string
  onGenerateShareLink: () => void
  isPending: boolean
}

export function ShareTab({
  shareExpiration,
  onShareExpirationChange,
  shareLink,
  onGenerateShareLink,
  isPending,
}: ShareTabProps) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mt-0">
      <Card className="md:col-span-2 border-border/50 bg-card/70 shadow-xs hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Generate Share Token</CardTitle>
          <CardDescription className="text-xs">
            Generate time-boxed read-only URLs for external validation support teams.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Link Expiration Duration</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:max-w-xs justify-between font-normal bg-background border-input"
                >
                  {shareExpiration === "3600"
                    ? "1 Hour"
                    : shareExpiration === "86400"
                    ? "1 Day"
                    : shareExpiration === "604800"
                    ? "1 Week"
                    : "Select duration"}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {[
                  { value: "3600", label: "1 Hour" },
                  { value: "86400", label: "1 Day" },
                  { value: "604800", label: "1 Week" },
                ].map((item) => (
                  <DropdownMenuItem key={item.value} onClick={() => onShareExpirationChange(item.value)}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            className="primary-gradient-btn border-0 self-start mt-2"
            onClick={onGenerateShareLink}
            disabled={isPending}
          >
            {isPending ? "Generating..." : "Create Link"}
          </Button>

          {shareLink && (
            <div className="flex flex-col gap-2 mt-4">
              <span className="text-xs font-semibold text-muted-foreground">Collaborator Share URL</span>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2.5 font-mono text-xs overflow-x-auto">
                <Link2 className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate select-all">{shareLink}</span>
                <CopyButton value={shareLink} showText={true} idleText="Copy Link" variant="outline" size="sm" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
