"use client"

import * as React from "react"
import { QrCode, Terminal, ExternalLink } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/copy-button"

interface QrModalProps {
  url: string
  endpointName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QrModal({
  url,
  endpointName = "Webhook Endpoint",
  open,
  onOpenChange,
}: QrModalProps) {
  const curlCommand = `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event": "test.ping", "timestamp": "${new Date().toISOString()}"}'`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url || "https://gull.dev")}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md font-sans border-border/60 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <QrCode className="size-4" />
            </div>
            <span>Mobile Webhook Testing</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Scan with your mobile device or API client to send test payloads directly to {endpointName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          {/* QR Code Container */}
          <div className="p-4 rounded-xl border border-border/80 bg-white dark:bg-slate-950 shadow-md flex flex-col items-center gap-2 group hover:border-primary/50 transition-all duration-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              width={180}
              height={180}
              alt="Webhook Ingestion Endpoint QR Code"
              className="rounded-md"
            />
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium">
              Scan to obtain Ingestion URL
            </span>
          </div>

          {/* Quick Copy URL */}
          <div className="w-full flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Ingestion URL
            </span>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-1.5 pl-3 font-mono text-xs">
              <span className="flex-1 truncate text-muted-foreground select-all">{url}</span>
              <CopyButton value={url} showText={true} idleText="Copy" variant="outline" className="h-7 text-xs" />
            </div>
          </div>

          {/* cURL Command Snippet */}
          <div className="w-full flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Terminal className="size-3" /> Quick cURL Test
              </span>
              <CopyButton
                value={curlCommand}
                showText={true}
                idleText="Copy cURL"
                variant="ghost"
                className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
              />
            </div>
            <pre className="rounded-lg border bg-slate-950 text-slate-100 p-3 font-mono text-[11px] leading-relaxed overflow-x-auto select-all">
              {curlCommand}
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-1">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            size="sm"
            className="primary-gradient-btn border-0"
            onClick={() => {
              window.open(url, "_blank")
            }}
          >
            <ExternalLink className="size-3.5 mr-1.5" />
            Open Endpoint
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
