import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  title: string
  isActive?: boolean
  onClick?: () => void
}

export function SidebarItem({
  icon: Icon,
  title,
  isActive = false,
  onClick,
  className,
  ...props
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none",
        "hover:bg-muted/80 hover:text-foreground",
        isActive
          ? "bg-primary/10 text-primary hover:bg-primary/15"
          : "text-muted-foreground",
        className
      )}
      {...props}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{title}</span>
    </button>
  )
}
