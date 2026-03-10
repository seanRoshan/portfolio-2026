"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"

const TOUCH_QUERY = "(pointer: coarse)"

function subscribeTouchChange(callback: () => void) {
  const mq = window.matchMedia(TOUCH_QUERY)
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

function getIsTouch() {
  return window.matchMedia(TOUCH_QUERY).matches
}

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const isVisibleRef = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)
  const isTouch = useSyncExternalStore(subscribeTouchChange, getIsTouch, () => false)

  useEffect(() => {
    if (isTouch) return

    const init = async () => {
      const { default: gsap } = await import("gsap")

      const moveCursor = (e: MouseEvent) => {
        if (!isVisibleRef.current) {
          isVisibleRef.current = true
          if (cursorRef.current) cursorRef.current.style.opacity = "1"
          if (cursorDotRef.current) cursorDotRef.current.style.opacity = "1"
        }

        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.5,
          ease: "power3.out",
        })

        gsap.to(cursorDotRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1,
        })
      }

      const handleMouseEnter = () => {
        gsap.to(ringRef.current, { width: 56, height: 56, opacity: 0.6, duration: 0.3 })
        gsap.to(dotRef.current, { width: 8, height: 8, duration: 0.3 })
      }

      const handleMouseLeave = () => {
        gsap.to(ringRef.current, { width: 36, height: 36, opacity: 0.4, duration: 0.3 })
        gsap.to(dotRef.current, { width: 5, height: 5, duration: 0.3 })
      }

      window.addEventListener("mousemove", moveCursor, { passive: true })

      const handleOverInteractive = (e: Event) => {
        const target = e.target as HTMLElement
        if (
          target.closest("a, button, [role='button'], input, textarea, select, [data-cursor-hover]")
        ) {
          handleMouseEnter()
        }
      }

      const handleOutInteractive = (e: Event) => {
        const target = e.target as HTMLElement
        if (
          target.closest("a, button, [role='button'], input, textarea, select, [data-cursor-hover]")
        ) {
          handleMouseLeave()
        }
      }

      document.addEventListener("mouseover", handleOverInteractive, { passive: true })
      document.addEventListener("mouseout", handleOutInteractive, { passive: true })

      // Store cleanup refs
      cleanupRef.current = () => {
        window.removeEventListener("mousemove", moveCursor)
        document.removeEventListener("mouseover", handleOverInteractive)
        document.removeEventListener("mouseout", handleOutInteractive)
      }
    }

    init()
    return () => cleanupRef.current?.()
  }, [isTouch])

  if (isTouch) return null

  return (
    <>
      {/* Outer ring */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[10000] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
        style={{ opacity: 0 }}
      >
        <div
          ref={ringRef}
          className="rounded-full border border-white"
          style={{
            width: 36,
            height: 36,
            opacity: 0.4,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
      {/* Inner dot */}
      <div
        ref={cursorDotRef}
        className="pointer-events-none fixed top-0 left-0 z-[10001] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
        style={{ opacity: 0 }}
      >
        <div
          ref={dotRef}
          className="rounded-full bg-white"
          style={{
            width: 5,
            height: 5,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </>
  )
}
