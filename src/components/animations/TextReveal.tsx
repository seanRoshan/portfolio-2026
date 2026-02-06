"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger, SplitText)

interface TextRevealProps {
  children: string
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span"
  className?: string
  type?: "chars" | "words" | "lines"
  stagger?: number
  duration?: number
  delay?: number
  scrollTrigger?: boolean
  y?: number
}

export function TextReveal({
  children,
  as: Tag = "p",
  className = "",
  type = "chars",
  stagger = 0.03,
  duration = 0.8,
  delay = 0,
  scrollTrigger = true,
  y = 40,
}: TextRevealProps) {
  const textRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = textRef.current
      if (!el) return

      // Make parent visible — children will be individually hidden by GSAP
      el.style.opacity = "1"

      const split = SplitText.create(el, {
        type: type,
        mask: type === "lines" ? "lines" : undefined,
      })

      const targets = type === "chars" ? split.chars : type === "words" ? split.words : split.lines

      const animConfig: gsap.TweenVars = {
        opacity: 0,
        y,
        rotateX: type === "chars" ? 40 : 0,
      }

      const toConfig: gsap.TweenVars = {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration,
        stagger,
        delay,
        ease: "power3.out",
      }

      if (scrollTrigger) {
        gsap.fromTo(targets, animConfig, {
          ...toConfig,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        })
      } else {
        gsap.fromTo(targets, animConfig, toConfig)
      }
    },
    { scope: textRef },
  )

  return (
    <Tag
      ref={textRef as React.RefObject<HTMLHeadingElement & HTMLParagraphElement & HTMLSpanElement>}
      className={className}
      style={{ opacity: 0 }}
    >
      {children}
    </Tag>
  )
}
