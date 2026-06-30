import { Bird } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string;
  iconClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, iconClassName, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: {
      container: "size-7 rounded-lg",
      icon: "size-4",
    },
    md: {
      container: "size-8 rounded-lg",
      icon: "size-4",
    },
    lg: {
      container: "size-9 rounded-xl",
      icon: "size-5",
    },
    xl: {
      container: "size-14 rounded-2xl shadow-lg",
      icon: "size-8",
    },
  }

  const config = sizeMap[size]

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-primary text-primary-foreground shadow-sm",
        config.container,
        className
      )}
    >
      <Bird className={cn(config.icon, iconClassName)} />
    </div>
  )
}
