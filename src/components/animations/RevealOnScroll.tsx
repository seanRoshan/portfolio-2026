"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger)

interface RevealOnScrollProps {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
  duration?: number
  stagger?: number
  once?: boolean
}

export function RevealOnScroll({
  children,
  className = "",
  delay = 0,
  y = 60,
  duration = 1,
  once = true,
}: RevealOnScrollProps) {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = container.current
      if (!el) return

      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: once ? "play none none none" : "play none none reverse",
          },
        },
      )
    },
    { scope: container },
  )

  return (
    <div ref={container} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}
