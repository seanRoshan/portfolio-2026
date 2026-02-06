"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger)

interface StaggerChildrenProps {
  children: React.ReactNode
  className?: string
  stagger?: number
  y?: number
  duration?: number
  childSelector?: string
}

export function StaggerChildren({
  children,
  className = "",
  stagger = 0.08,
  y = 40,
  duration = 0.8,
  childSelector = ":scope > *",
}: StaggerChildrenProps) {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = container.current
      if (!el) return

      const items = el.querySelectorAll(childSelector)

      gsap.fromTo(
        items,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      )
    },
    { scope: container },
  )

  return (
    <div ref={container} className={className}>
      {children}
    </div>
  )
}
