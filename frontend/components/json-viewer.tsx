"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, Copy } from "lucide-react"
import { toast } from "sonner"

interface JSONViewerProps {
  data: any
  level?: number
  maxDepth?: number
}

export function JSONViewer({ data, level = 0, maxDepth = 4 }: JSONViewerProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(level >= maxDepth)

  const copyToClipboard = React.useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("JSON copied to clipboard")
  }, [])

  if (data === null) {
    return <span className="text-amber-500 font-mono text-xs">null</span>
  }

  if (typeof data === "boolean") {
    return (
      <span className="text-rose-500 font-mono text-xs font-semibold">
        {data ? "true" : "false"}
      </span>
    )
  }

  if (typeof data === "number") {
    return <span className="text-sky-500 font-mono text-xs">{data}</span>
  }

  if (typeof data === "string") {
    return <span className="text-emerald-500 font-mono text-xs">"{data}"</span>
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-muted-foreground font-mono text-xs">[]</span>
    }

    return (
      <div className="font-mono text-xs">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground outline-none font-semibold transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
          <span>Array[{data.length}]</span>
        </button>

        {!isCollapsed && (
          <div className="pl-4 border-l border-border/40 my-1 flex flex-col gap-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-start gap-1">
                <span className="text-muted-foreground/60 select-none min-w-[20px] text-right pr-1">
                  {index}:
                </span>
                <JSONViewer data={item} level={level + 1} maxDepth={maxDepth} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (typeof data === "object") {
    const keys = Object.keys(data)
    if (keys.length === 0) {
      return <span className="text-muted-foreground font-mono text-xs">{"{}"}</span>
    }

    return (
      <div className="font-mono text-xs w-full">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground outline-none font-semibold transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
            <span>Object</span>
          </button>
          {level === 0 && (
            <button
              onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded-md transition-colors"
              title="Copy Object JSON"
            >
              <Copy className="size-3" />
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="pl-4 border-l border-border/40 my-1 flex flex-col gap-1">
            {keys.map((key) => (
              <div key={key} className="flex items-start gap-1 flex-wrap sm:flex-nowrap">
                <span className="text-indigo-400 dark:text-indigo-300 font-semibold select-all">
                  {key}:
                </span>
                <JSONViewer data={data[key]} level={level + 1} maxDepth={maxDepth} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <span className="font-mono text-xs">{String(data)}</span>
}
