"use client"

import { useRef, useEffect, useState } from "react"
import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { useGSAP } from "@gsap/react"
import { MagneticButton } from "@/components/animations/MagneticButton"
import { useMousePosition } from "@/hooks/useMousePosition"

gsap.registerPlugin(SplitText)

interface HeroProps {
  heroData: {
    greeting: string
    name: string
    roles: string[]
    tagline: string
    cta: { label: string; href: string }
    ctaSecondary: { label: string; href: string }
  } | null
  siteConfig: {
    name: string
    title: string
    description: string
    url: string
    email: string
    location: string
    availability: string
    socials: Record<string, string>
  } | null
}

const defaultHeroData: NonNullable<HeroProps["heroData"]> = {
  greeting: "Hey, I'm",
  name: "",
  roles: [],
  tagline: "",
  cta: { label: "See My Work", href: "#projects" },
  ctaSecondary: { label: "Get In Touch", href: "#contact" },
}

const defaultSiteConfig: NonNullable<HeroProps["siteConfig"]> = {
  name: "",
  title: "",
  description: "",
  url: "",
  email: "",
  location: "",
  availability: "Open to opportunities",
  socials: {},
}

export function Hero({ heroData: heroDataProp, siteConfig: siteConfigProp }: HeroProps) {
  const heroData = heroDataProp ?? defaultHeroData
  const siteConfig = siteConfigProp ?? defaultSiteConfig
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)
  const [roleIndex, setRoleIndex] = useState(0)
  const mouse = useMousePosition()

  // Main entrance animation
  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.3 })

      // Greeting — set parent visible then animate chars
      const greetingEl = document.querySelector(".hero-greeting") as HTMLElement
      if (greetingEl) greetingEl.style.opacity = "1"
      const greetingSplit = SplitText.create(".hero-greeting", {
        type: "chars",
      })
      tl.fromTo(
        greetingSplit.chars,
        { opacity: 0, y: 30, rotateX: 40 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.6,
          stagger: 0.04,
          ease: "power3.out",
        },
      )

      // Name — set parent visible, apply gradient to each char, then animate
      const nameEl = document.querySelector(".hero-name") as HTMLElement
      if (nameEl) nameEl.style.opacity = "1"
      const nameSplit = SplitText.create(".hero-name", { type: "chars" })
      // Apply gradient to each char since background-clip:text doesn't inherit
      ;(nameSplit.chars as HTMLElement[]).forEach((char) => {
        char.style.background = "linear-gradient(135deg, oklch(0.7 0.25 264), oklch(0.7 0.2 330))"
        char.style.webkitBackgroundClip = "text"
        char.style.webkitTextFillColor = "transparent"
        char.style.backgroundClip = "text"
      })
      tl.fromTo(
        nameSplit.chars,
        { opacity: 0, y: 50, rotateX: 60 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.7,
          stagger: 0.03,
          ease: "power3.out",
        },
        "-=0.3",
      )

      // Role text
      tl.fromTo(
        ".hero-role",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
        "-=0.2",
      )

      // Tagline — set parent visible then animate words
      if (taglineRef.current) {
        taglineRef.current.style.opacity = "1"
        const taglineSplit = SplitText.create(taglineRef.current, {
          type: "words",
        })
        tl.fromTo(
          taglineSplit.words,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.04,
            ease: "power3.out",
          },
          "-=0.4",
        )
      }

      // CTA buttons
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
        "-=0.3",
      )

      // Floating elements
      tl.fromTo(
        ".hero-float",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
        },
        "-=0.5",
      )
    },
    { scope: sectionRef },
  )

  // Rotating role text
  useEffect(() => {
    if (heroData.roles.length === 0) return
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % heroData.roles.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [heroData.roles.length])

  return (
    <section ref={sectionRef} className="relative flex min-h-screen items-center overflow-hidden">
      {/* Gradient mesh background */}
      <div className="gradient-mesh absolute inset-0 -z-10" />

      {/* Animated grid */}
      <div className="absolute inset-0 -z-10 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(var(--foreground) 1px, transparent 1px),
              linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Floating elements with parallax */}
      <div ref={floatingRef} className="absolute inset-0 -z-[5] overflow-hidden" aria-hidden="true">
        <div
          className="hero-float absolute top-[15%] left-[10%] h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{
            background: "oklch(0.7 0.25 264 / 40%)",
            transform: `translate(${mouse.normalizedX * 20}px, ${mouse.normalizedY * 20}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="hero-float absolute right-[15%] bottom-[20%] h-96 w-96 rounded-full opacity-15 blur-3xl"
          style={{
            background: "oklch(0.7 0.2 330 / 30%)",
            transform: `translate(${mouse.normalizedX * -15}px, ${mouse.normalizedY * -15}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="hero-float absolute top-[40%] right-[30%] h-48 w-48 rounded-full opacity-10 blur-3xl"
          style={{
            background: "oklch(0.65 0.2 160 / 30%)",
            transform: `translate(${mouse.normalizedX * 10}px, ${mouse.normalizedY * 10}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
      </div>

      <div className="container-wide relative pt-32 pb-20">
        <div className="max-w-4xl">
          {/* Greeting */}
          <span
            className="hero-greeting text-muted-foreground mb-4 block text-[length:var(--text-lg)] font-medium"
            style={{ opacity: 0 }}
          >
            {heroData.greeting}
          </span>

          {/* Name */}
          <h1
            ref={headingRef}
            className="hero-name text-foreground mb-6 text-[length:var(--text-6xl)] leading-[1.05] font-bold tracking-tight"
            style={{ opacity: 0 }}
          >
            {heroData.name}
          </h1>

          {/* Rotating role */}
          <div className="hero-role mb-8 h-12 overflow-hidden" style={{ opacity: 0 }}>
            <div
              className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateY(-${roleIndex * 48}px)` }}
            >
              {heroData.roles.map((role) => (
                <div
                  key={role}
                  className="text-muted-foreground flex h-12 items-center text-[length:var(--text-xl)] font-medium"
                >
                  <span className="bg-primary mr-3 inline-block h-2 w-2 rounded-full" />
                  {role}
                </div>
              ))}
            </div>
          </div>

          {/* Tagline */}
          <p
            ref={taglineRef}
            className="text-muted-foreground mb-12 max-w-2xl text-[length:var(--text-lg)] leading-relaxed"
            style={{ opacity: 0 }}
          >
            {heroData.tagline}
          </p>

          {/* CTA */}
          <div ref={ctaRef} className="flex flex-wrap gap-4" style={{ opacity: 0 }}>
            <MagneticButton
              as="a"
              href={heroData.cta.href}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow"
            >
              {heroData.cta.label}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </MagneticButton>

            <MagneticButton
              as="a"
              href={heroData.ctaSecondary.href}
              className="border-border bg-card/50 hover:bg-accent border backdrop-blur-sm"
            >
              {heroData.ctaSecondary.label}
            </MagneticButton>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
            <div className="bg-border relative h-8 w-[1.5px] overflow-hidden">
              <div className="animate-scroll-line bg-primary absolute top-0 left-0 h-4 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div className="absolute top-32 right-8 hidden lg:block">
        <div className="glass rounded-2xl px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-muted-foreground">{siteConfig.availability}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
