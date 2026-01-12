"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ModeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
        <Sun className="h-5 w-5 opacity-0" />
      </button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors relative overflow-hidden"
      title={isDark ? "切换到浅色模式" : "切换到深色模式"}
    >
      <div className="relative h-5 w-5">
        <Sun
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 transform ${
            isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
          }`}
        />
        <Moon
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 transform ${
            isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
          }`}
        />
      </div>
      <span className="sr-only">切换主题</span>
    </button>
  )
}
