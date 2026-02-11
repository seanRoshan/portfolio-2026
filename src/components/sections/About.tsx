"use client"

import { useRef } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { TextReveal } from "@/components/animations/TextReveal"
import { RevealOnScroll } from "@/components/animations/RevealOnScroll"
import { StaggerChildren } from "@/components/animations/StaggerChildren"

gsap.registerPlugin(ScrollTrigger)

interface AboutProps {
  aboutData: {
    headline: string
    description: string[]
    portraitUrl: string | null
    stats: { label: string; value: number }[]
    techStack: { name: string; category: string }[]
  } | null
}

const defaultAboutData: NonNullable<AboutProps["aboutData"]> = {
  headline: "",
  description: [],
  portraitUrl: null,
  stats: [],
  techStack: [],
}

function AnimatedCounter({ value, label }: { value: number; label: string }) {
  const counterRef = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const el = counterRef.current
    if (!el) return

    const obj = { val: 0 }
    gsap.to(obj, {
      val: value,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toLocaleString() + (value >= 100 ? "+" : "+")
      },
    })
  })

  return (
    <div className="text-center">
      <span
        ref={counterRef}
        className="text-gradient block text-[length:var(--text-4xl)] font-bold"
      >
        0
      </span>
      <span className="text-muted-foreground mt-1 block text-sm">{label}</span>
    </div>
  )
}

export function About({ aboutData: aboutDataProp }: AboutProps) {
  const aboutData = aboutDataProp ?? defaultAboutData
  return (
    <section id="about" className="section-padding relative">
      <div className="container-wide">
        {/* Section heading */}
        <RevealOnScroll>
          <span className="text-primary mb-3 block text-sm font-medium tracking-widest uppercase">
            About Me
          </span>
        </RevealOnScroll>

        <TextReveal
          as="h2"
          type="words"
          className="mb-16 max-w-3xl text-[length:var(--text-4xl)] leading-tight font-bold"
        >
          {aboutData.headline}
        </TextReveal>

        {/* Content grid */}
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left: Portrait */}
          <RevealOnScroll className="relative">
            <div className="from-primary/20 to-secondary aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br">
              {aboutData.portraitUrl ? (
                <Image
                  src={aboutData.portraitUrl}
                  alt="Portrait"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                />
              ) : (
                <div className="h-full w-full" />
              )}
            </div>
            {/* Decorative element */}
            <div className="border-primary/20 absolute -right-4 -bottom-4 -z-10 h-full w-full rounded-3xl border" />
          </RevealOnScroll>

          {/* Right: Text content */}
          <div className="flex flex-col justify-center">
            {aboutData.description.map((paragraph, i) => (
              <RevealOnScroll key={i} delay={i * 0.15}>
                <p className="text-muted-foreground mb-6 text-[length:var(--text-base)] leading-relaxed">
                  {paragraph}
                </p>
              </RevealOnScroll>
            ))}

            {/* Stats */}
            <StaggerChildren className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {aboutData.stats.map((stat) => (
                <AnimatedCounter key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </StaggerChildren>
          </div>
        </div>

      </div>
    </section>
  )
}
