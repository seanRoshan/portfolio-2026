"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { getTechIcon } from "@/lib/tech-icons"
import { cn } from "@/lib/utils"

interface FloatingItem {
  name: string
  iconName: string | null
}

interface FloatingTechCloudProps {
  items: FloatingItem[]
  className?: string
}

interface Particle {
  x: number
  y: number
  homeX: number
  homeY: number
  vx: number
  vy: number
  size: number
  phase: number
  speed: number
  name: string
  iconName: string | null
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function initParticles(items: FloatingItem[], width: number, height: number): Particle[] {
  const particles: Particle[] = []
  const cols = Math.ceil(Math.sqrt(items.length * (width / height)))
  const rows = Math.ceil(items.length / cols)
  const cellW = width / cols
  const cellH = height / rows

  items.forEach((item, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    // Position with jitter so it doesn't look like a rigid grid
    const jitterX = (seededRandom(i * 7 + 1) - 0.5) * cellW * 0.6
    const jitterY = (seededRandom(i * 13 + 3) - 0.5) * cellH * 0.5
    const x = cellW * (col + 0.5) + jitterX
    const y = cellH * (row + 0.5) + jitterY

    particles.push({
      x: Math.max(30, Math.min(width - 30, x)),
      y: Math.max(30, Math.min(height - 30, y)),
      homeX: Math.max(30, Math.min(width - 30, x)),
      homeY: Math.max(30, Math.min(height - 30, y)),
      vx: 0,
      vy: 0,
      size: 40 + seededRandom(i * 3 + 5) * 16,
      phase: seededRandom(i * 11 + 7) * Math.PI * 2,
      speed: 0.3 + seededRandom(i * 17 + 2) * 0.4,
      name: item.name,
      iconName: item.iconName,
    })
  })

  return particles
}

export function FloatingTechCloud({ items, className }: FloatingTechCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animRef = useRef<number>(0)
  const [, forceRender] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const initialized = useRef(false)

  // Initialize particles when dimensions are known
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        setDimensions({ width, height })
        if (!initialized.current) {
          particlesRef.current = initParticles(items, width, height)
          initialized.current = true
        }
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [items])

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 }
  }, [])

  // Physics loop
  useEffect(() => {
    if (!initialized.current) return

    let time = 0
    const DAMPING = 0.92
    const SPRING = 0.008
    const MOUSE_RADIUS = 120
    const MOUSE_FORCE = 2.5
    const WAVE_AMP = 6
    let frameCount = 0

    function tick() {
      time += 0.016
      frameCount++
      const particles = particlesRef.current
      const mouse = mouseRef.current

      for (const p of particles) {
        // Wave motion — gentle bobbing
        const waveY = Math.sin(time * p.speed + p.phase) * WAVE_AMP
        const waveX = Math.cos(time * p.speed * 0.7 + p.phase * 1.3) * WAVE_AMP * 0.5

        // Spring back to home + wave offset
        const targetX = p.homeX + waveX
        const targetY = p.homeY + waveY
        p.vx += (targetX - p.x) * SPRING
        p.vy += (targetY - p.y) * SPRING

        // Mouse repulsion
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
        }

        // Damping
        p.vx *= DAMPING
        p.vy *= DAMPING

        // Integrate
        p.x += p.vx
        p.y += p.vy
      }

      // Update DOM at 30fps for performance (every other frame at 60fps)
      if (frameCount % 2 === 0) {
        forceRender((n) => n + 1)
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [dimensions])

  const particles = particlesRef.current

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ minHeight: items.length > 20 ? 420 : 320 }}
    >
      {/* Water surface shimmer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-30">
        <div
          className="h-full w-full"
          style={{
            background: "linear-gradient(to top, oklch(0.7 0.25 264 / 10%), transparent)",
          }}
        />
      </div>

      {/* Floating icons */}
      {particles.map((p) => {
        const tech = getTechIcon(p.iconName)
        const Icon = tech?.icon
        const color = tech?.color ?? "#a78bfa"

        // Determine if mouse is near for glow intensity
        const dx = p.x - mouseRef.current.x
        const dy = p.y - mouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const proximity = Math.max(0, 1 - dist / 150)

        return (
          <div
            key={p.name}
            className="group absolute flex flex-col items-center gap-1"
            style={{
              transform: `translate(${p.x - p.size / 2}px, ${p.y - p.size / 2}px)`,
              width: p.size,
              willChange: "transform",
            }}
          >
            {/* Glow underneath */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl transition-opacity duration-300"
              style={{
                width: p.size * 1.2,
                height: p.size * 0.8,
                background: color,
                opacity: 0.06 + proximity * 0.15,
              }}
            />

            {/* Icon */}
            <div
              className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-125"
              style={{
                width: p.size * 0.55,
                height: p.size * 0.55,
              }}
            >
              {Icon ? (
                <Icon
                  className="h-full w-full drop-shadow-sm transition-all duration-300"
                  style={{
                    color: proximity > 0.2 ? color : "currentColor",
                    opacity: 0.65 + proximity * 0.35,
                    filter: proximity > 0.3 ? `drop-shadow(0 0 8px ${color}40)` : "none",
                    transition: "color 0.4s ease, opacity 0.3s ease, filter 0.4s ease",
                  }}
                />
              ) : (
                <div className="bg-muted h-full w-full rounded-lg" style={{ opacity: 0.4 }} />
              )}
            </div>

            {/* Label */}
            <span
              className="text-center text-[10px] font-medium tracking-wide whitespace-nowrap transition-all duration-300"
              style={{
                color: proximity > 0.3 ? color : undefined,
                opacity: 0.4 + proximity * 0.6,
              }}
            >
              {p.name}
            </span>
          </div>
        )
      })}

      {/* Ripple rings hint (decorative) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="water-pattern"
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#water-pattern)" />
      </svg>
    </div>
  )
}
