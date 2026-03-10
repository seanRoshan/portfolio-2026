"use client"

import { useEffect, type RefObject } from "react"

interface ParallaxTarget {
  ref: RefObject<HTMLElement | null>
  /** Horizontal movement multiplier in pixels */
  x: number
  /** Vertical movement multiplier in pixels */
  y: number
}

/**
 * Applies parallax transforms to elements based on mouse position.
 * Uses direct DOM manipulation instead of React state to avoid re-renders.
 */
export function useParallaxOnMouse(targets: ParallaxTarget[]) {
  useEffect(() => {
    if (typeof window === "undefined") return

    let rafId: number

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2
        const ny = (e.clientY / window.innerHeight - 0.5) * 2

        for (const { ref, x, y } of targets) {
          if (ref.current) {
            ref.current.style.transform = `translate(${nx * x}px, ${ny * y}px)`
          }
        }
      })
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(rafId)
    }
  }, [targets])
}
