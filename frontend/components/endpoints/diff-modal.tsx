"use client"

import * as React from "react"
import { ShieldAlert, RefreshCw, X } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Payload {
  id: string
  raw_body: string
  parsed_body: any
  received_at: string
}

interface DiffModalProps {
  payloadA: Payload | null
  payloadB: Payload | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DiffModal({
  payloadA,
  payloadB,
  open,
  onOpenChange,
}: DiffModalProps) {
  const getDiffMarkup = () => {
    if (!payloadA || !payloadB) return null

    const strA = JSON.stringify(payloadA.parsed_body || {}, null, 2).split("\n")
    const strB = JSON.stringify(payloadB.parsed_body || {}, null, 2).split("\n")

    // Very simple line-by-line diff for visual inspection
    const maxLen = Math.max(strA.length, strB.length)
    const diffLines: Array<{
      lineNum: number
      a: { text: string; type: "equal" | "diff" | "empty" }
      b: { text: string; type: "equal" | "diff" | "empty" }
    }> = []

    for (let i = 0; i < maxLen; i++) {
      const lineA = strA[i] || ""
      const lineB = strB[i] || ""

      const isDifferent = lineA.trim() !== lineB.trim()

      diffLines.push({
        lineNum: i + 1,
        a: {
          text: strA[i] === undefined ? "" : lineA,
          type: strA[i] === undefined ? "empty" : isDifferent ? "diff" : "equal",
        },
        b: {
          text: strB[i] === undefined ? "" : lineB,
          type: strB[i] === undefined ? "empty" : isDifferent ? "diff" : "equal",
        },
      })
    }

    return (
      <div className="grid grid-cols-2 gap-4 border rounded-xl overflow-hidden font-mono text-[10px] sm:text-xs leading-normal select-text max-h-[50vh] overflow-y-auto bg-muted/10">
        {/* Left Side: Payload A */}
        <div className="border-r pr-2 py-4 pl-4 bg-muted/5 flex flex-col gap-0.5">
          <div className="text-xs font-bold text-muted-foreground pb-3 mb-2 border-b uppercase select-none">
            Payload A ({new Date(payloadA.received_at).toLocaleTimeString()})
          </div>
          {diffLines.map((line) => (
            <div
              key={`a-${line.lineNum}`}
              className={line.a.type === "diff" ? "bg-red-500/10 text-red-500 dark:text-red-400 font-semibold" : "text-muted-foreground"}
            >
              {line.a.text || " "}
            </div>
          ))}
        </div>

        {/* Right Side: Payload B */}
        <div className="pl-2 py-4 pr-4 bg-muted/5 flex flex-col gap-0.5">
          <div className="text-xs font-bold text-muted-foreground pb-3 mb-2 border-b uppercase select-none">
            Payload B ({new Date(payloadB.received_at).toLocaleTimeString()})
          </div>
          {diffLines.map((line) => (
            <div
              key={`b-${line.lineNum}`}
              className={line.b.type === "diff" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}
            >
              {line.b.text || " "}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl font-sans">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-500" />
            <span>Diff Payload Structure</span>
          </DialogTitle>
          <DialogDescription>
            Inspect structural deviations and schema differences between two captured events side-by-side.
          </DialogDescription>
        </DialogHeader>

        {getDiffMarkup()}

        <div className="flex justify-end mt-2">
          <Button onClick={() => onOpenChange(false)}>Close Diff Inspector</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
