"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CopyButtonProps extends React.ComponentProps<typeof Button> {
  value: string
  successMessage?: string
}

export function CopyButton({
  value,
  successMessage = "Copied to clipboard!",
  className,
  variant = "ghost",
  size = "icon",
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

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("relative z-10 size-6 shrink-0 rounded-md", className)}
      onClick={handleCopy}
      {...props}
    >
      {hasCopied ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : (
        <Copy className="size-3.5 text-muted-foreground" />
      )}
      <span className="sr-only">Copy</span>
    </Button>
  )
}
