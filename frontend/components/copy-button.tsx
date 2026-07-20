"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CopyButtonProps extends React.ComponentProps<typeof Button> {
  value: string
  successMessage?: string
  showText?: boolean
  idleText?: string
  copiedText?: string
}

export function CopyButton({
  value,
  successMessage = "Copied to clipboard!",
  showText = false,
  idleText = "Copy",
  copiedText = "Copied ✓",
  className,
  variant = "ghost",
  size,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [hasCopied])

  const handleCopy = React.useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      try {
        await navigator.clipboard.writeText(value)
        setHasCopied(true)
        toast.success(successMessage)
      } catch {
        toast.error("Failed to copy text.")
      }
    },
    [value, successMessage]
  )

  const buttonSize = size || (showText ? "sm" : "icon")

  return (
    <Button
      variant={variant}
      size={buttonSize}
      className={cn(
        "relative z-10 shrink-0 transition-all duration-200",
        !showText && "size-6 rounded-md",
        hasCopied && showText && "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
        className
      )}
      onClick={handleCopy}
      {...props}
    >
      {showText ? (
        hasCopied ? (
          <span className="flex items-center gap-1.5 font-medium text-emerald-500 animate-in fade-in-50 duration-200">
            <Check className="size-3.5" />
            {copiedText}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-medium">
            <Copy className="size-3.5" />
            {idleText}
          </span>
        )
      ) : (
        <>
          {hasCopied ? (
            <Check className="size-3.5 text-emerald-500 animate-in zoom-in-50 duration-150" />
          ) : (
            <Copy className="size-3.5 text-muted-foreground" />
          )}
          <span className="sr-only">Copy</span>
        </>
      )}
    </Button>
  )
}

