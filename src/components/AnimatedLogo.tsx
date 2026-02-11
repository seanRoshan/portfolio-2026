"use client"

import { useRef, useCallback } from "react"
import Link from "next/link"
import gsap from "gsap"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface AnimatedLogoProps {
  name: string
  size?: "sm" | "lg"
}

// ── Character animations ───────────────────────────────────────────

function magneticPull(
  chars: (HTMLSpanElement | null)[],
  container: HTMLElement,
  e: React.MouseEvent,
) {
  const rect = container.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const dx = (e.clientX - centerX) * 0.25
  const dy = (e.clientY - centerY) * 0.25

  chars.forEach((char) => {
    if (!char) return
    gsap.to(char, {
      x: dx,
      y: dy,
      duration: 0.6,
      ease: "power3.out",
    })
  })
}

function letterWave(chars: (HTMLSpanElement | null)[]) {
  chars.forEach((char, i) => {
    if (!char) return
    gsap.to(char, {
      y: -6,
      duration: 0.4,
      delay: i * 0.06,
      ease: "power2.out",
    })
    gsap.to(char, {
      y: 0,
      duration: 0.6,
      delay: i * 0.06 + 0.4,
      ease: "bounce.out",
    })
  })
}

function scatterGlitch(chars: (HTMLSpanElement | null)[], scale: number) {
  chars.forEach((char) => {
    if (!char) return
    const rx = (Math.random() - 0.5) * 4 * scale
    const ry = (Math.random() - 0.5) * 3 * scale

    gsap.to(char, {
      x: rx,
      y: ry,
      textShadow: `${scale}px 0 oklch(0.7 0.25 264), -${scale}px 0 oklch(0.7 0.2 330)`,
      duration: 0.25,
      ease: "power2.out",
    })
    gsap.to(char, {
      x: 0,
      y: 0,
      textShadow: "0 0 transparent, 0 0 transparent",
      duration: 0.9,
      delay: 0.25,
      ease: "elastic.out(1, 0.3)",
    })
  })
}

// ── Dot animations ─────────────────────────────────────────────────

function dotPulse(dot: HTMLSpanElement) {
  gsap.to(dot, { scale: 1.4, duration: 0.3, ease: "power2.out" })
  gsap.to(dot, {
    scale: 1,
    duration: 0.7,
    delay: 0.3,
    ease: "elastic.out(1, 0.4)",
  })
}

function dotSpin(dot: HTMLSpanElement) {
  gsap.to(dot, {
    rotation: 360,
    duration: 0.8,
    ease: "power2.inOut",
    onComplete: () => { gsap.set(dot, { rotation: 0 }) },
  })
}

function dotBounce(dot: HTMLSpanElement) {
  gsap.to(dot, { y: -8, duration: 0.3, ease: "power2.out" })
  gsap.to(dot, {
    y: 0,
    duration: 0.6,
    delay: 0.3,
    ease: "bounce.out",
  })
}

const DOT_ANIMATIONS = [dotPulse, dotSpin, dotBounce]

// ── Component ──────────────────────────────────────────────────────

export function AnimatedLogo({ name, size = "sm" }: AnimatedLogoProps) {
  const firstName = name.split(" ")[0]
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const dotRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLAnchorElement>(null)
  const lastCharAnim = useRef<number>(-1)
  const lastDotAnim = useRef<number>(-1)
  const reducedMotion = useReducedMotion()

  const scale = size === "sm" ? 1 : 1.5
  const fontSize = size === "sm" ? "text-lg" : "text-2xl"

  const pickRandom = (count: number, last: React.RefObject<number>) => {
    let next: number
    do {
      next = Math.floor(Math.random() * count)
    } while (next === last.current)
    last.current = next
    return next
  }

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion) return

      const chars = charRefs.current
      const charAnim = pickRandom(3, lastCharAnim)
      const dotAnim = pickRandom(3, lastDotAnim)

      switch (charAnim) {
        case 0:
          if (containerRef.current) magneticPull(chars, containerRef.current, e)
          break
        case 1:
          letterWave(chars)
          break
        case 2:
          scatterGlitch(chars, scale)
          break
      }

      if (dotRef.current) {
        DOT_ANIMATIONS[dotAnim](dotRef.current)
      }
    },
    [reducedMotion, scale],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion || lastCharAnim.current !== 0) return
      if (containerRef.current) {
        magneticPull(charRefs.current, containerRef.current, e)
      }
    },
    [reducedMotion],
  )

  const handleMouseLeave = useCallback(() => {
    if (reducedMotion) return

    charRefs.current.forEach((char) => {
      if (!char) return
      gsap.to(char, {
        x: 0,
        y: 0,
        textShadow: "0 0 transparent, 0 0 transparent",
        duration: 0.7,
        ease: "elastic.out(1, 0.3)",
        overwrite: true,
      })
    })

    if (dotRef.current) {
      gsap.to(dotRef.current, {
        scale: 1,
        y: 0,
        rotation: 0,
        duration: 0.6,
        ease: "power3.out",
        overwrite: true,
      })
    }
  }, [reducedMotion])

  return (
    <Link
      ref={containerRef}
      href="/"
      className={`${fontSize} font-bold tracking-tight transition-colors hover:text-primary`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {firstName.split("").map((char, i) => (
        <span
          key={i}
          ref={(el) => {
            charRefs.current[i] = el
          }}
          className="inline-block"
        >
          {char}
        </span>
      ))}
      <span ref={dotRef} className="text-primary inline-block origin-center">
        .
      </span>
    </Link>
  )
}
