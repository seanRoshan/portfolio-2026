"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import gsap from "gsap"

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
  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const isTouch = useSyncExternalStore(subscribeTouchChange, getIsTouch, () => false)

  useEffect(() => {
    if (isTouch) return

    const moveCursor = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true)

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
      setIsHovering(true)
    }

    const handleMouseLeave = () => {
      setIsHovering(false)
    }

    window.addEventListener("mousemove", moveCursor, { passive: true })

    const interactiveElements = document.querySelectorAll(
      "a, button, [role='button'], input, textarea, select, [data-cursor-hover]",
    )

    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter)
      el.addEventListener("mouseleave", handleMouseLeave)
    })

    return () => {
      window.removeEventListener("mousemove", moveCursor)
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter)
        el.removeEventListener("mouseleave", handleMouseLeave)
      })
    }
  }, [isVisible, isTouch])

  if (isTouch) return null

  return (
    <>
      {/* Outer ring */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[10000] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <div
          className="rounded-full border border-white transition-all duration-300"
          style={{
            width: isHovering ? 56 : 36,
            height: isHovering ? 56 : 36,
            opacity: isHovering ? 0.6 : 0.4,
            transform: `translate(-50%, -50%)`,
          }}
        />
      </div>
      {/* Inner dot */}
      <div
        ref={cursorDotRef}
        className="pointer-events-none fixed top-0 left-0 z-[10001] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <div
          className="rounded-full bg-white transition-all duration-300"
          style={{
            width: isHovering ? 8 : 5,
            height: isHovering ? 8 : 5,
            transform: `translate(-50%, -50%)`,
          }}
        />
      </div>
    </>
  )
}
