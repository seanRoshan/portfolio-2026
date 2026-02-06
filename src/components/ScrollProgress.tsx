"use client"

import { useScrollProgress } from "@/hooks/useScrollProgress"

export function ScrollProgress() {
  const progress = useScrollProgress()

  return (
    <div className="fixed top-0 right-0 left-0 z-[101] h-[2px]">
      <div
        className="from-primary h-full origin-left bg-gradient-to-r to-[oklch(0.7_0.2_330)] transition-transform duration-150"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}
