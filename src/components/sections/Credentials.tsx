"use client"

import { useRef, useState, useCallback } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { AnimatePresence, motion } from "motion/react"
import { GraduationCap, Award, ExternalLink } from "lucide-react"
import { TextReveal } from "@/components/animations/TextReveal"
import { RevealOnScroll } from "@/components/animations/RevealOnScroll"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

interface EducationItem {
  school: string
  degree: string
  field: string | null
  year: string | null
  details: string | null
  logoUrl: string | null
}

interface CertificationItem {
  name: string
  issuer: string
  year: string | null
  url: string | null
  badgeUrl: string | null
}

interface CredentialsProps {
  educationData: EducationItem[]
  certificationData: CertificationItem[]
}

function EducationCard({ entry, index }: { entry: EducationItem; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
      className="group relative flex gap-5"
    >
      {/* Accent bar */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6, delay: index * 0.12 + 0.2, ease: "easeOut" }}
        className="from-primary via-primary/50 relative w-1 flex-shrink-0 origin-top rounded-full bg-gradient-to-b to-transparent"
      />

      {/* Card */}
      <div className="glass hover:border-primary/20 hover:shadow-primary/5 flex-1 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="flex items-start gap-4">
          {/* Logo or icon */}
          <div className="bg-primary/10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl">
            {entry.logoUrl ? (
              <Image
                src={entry.logoUrl}
                alt={entry.school}
                width={40}
                height={40}
                className="rounded-lg object-contain"
                unoptimized
              />
            ) : (
              <GraduationCap className="text-primary h-7 w-7" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[length:var(--text-xl)] font-semibold">{entry.school}</h3>
              {entry.year && (
                <span className="bg-primary/10 text-primary flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium">
                  {entry.year}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {entry.degree}
              {entry.field ? ` in ${entry.field}` : ""}
            </p>
            {entry.details && (
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{entry.details}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CertificationBadge({ cert, index }: { cert: CertificationItem; index: number }) {
  const content = (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      className="group/badge relative"
    >
      <div
        className={cn(
          "glass relative flex flex-col items-center gap-3 rounded-2xl p-5 text-center",
          "transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-lg",
          cert.url && "cursor-pointer",
        )}
      >
        {/* Hover glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/badge:opacity-100"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, oklch(0.7 0.2 264 / 10%) 0%, transparent 70%)",
          }}
        />

        {/* Badge image or icon */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          {cert.badgeUrl ? (
            <Image
              src={cert.badgeUrl}
              alt={cert.name}
              width={56}
              height={56}
              className="rounded-lg object-contain"
              unoptimized
            />
          ) : (
            <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-xl">
              <Award className="text-primary h-7 w-7" />
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="group-hover/badge:text-primary text-sm leading-snug font-semibold transition-colors">
          {cert.name}
        </h3>

        {/* Issuer + year */}
        <div className="text-muted-foreground space-y-0.5 text-xs">
          <p>{cert.issuer}</p>
          {cert.year && <p>{cert.year}</p>}
        </div>

        {/* External link indicator */}
        {cert.url && (
          <ExternalLink className="text-muted-foreground absolute top-3 right-3 h-3.5 w-3.5 opacity-0 transition-opacity group-hover/badge:opacity-100" />
        )}
      </div>
    </motion.div>
  )

  if (cert.url) {
    return (
      <a href={cert.url} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    )
  }

  return content
}

export function Credentials({ educationData, certificationData }: CredentialsProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Build available tabs
  const tabs: { key: string; label: string; count: number }[] = []
  if (educationData.length > 0)
    tabs.push({ key: "education", label: "Education", count: educationData.length })
  if (certificationData.length > 0)
    tabs.push({ key: "certifications", label: "Certifications", count: certificationData.length })

  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? "education")

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key)
  }, [])

  // Scroll-triggered reveal for the content container
  useGSAP(
    () => {
      const el = contentRef.current
      if (!el) return

      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        },
      )
    },
    { scope: sectionRef },
  )

  // Don't render if no data
  if (tabs.length === 0) return null

  const showTabs = tabs.length > 1

  return (
    <section id="credentials" ref={sectionRef} className="section-padding relative overflow-hidden">
      {/* Subtle background gradients */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div
          className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full blur-[120px]"
          style={{ background: "oklch(0.7 0.2 150 / 8%)" }}
        />
        <div
          className="absolute bottom-1/3 left-1/3 h-80 w-80 rounded-full blur-[100px]"
          style={{ background: "oklch(0.7 0.25 45 / 6%)" }}
        />
      </div>

      <div className="container-wide relative">
        {/* Header */}
        <RevealOnScroll>
          <span className="text-primary mb-3 block text-sm font-medium tracking-widest uppercase">
            Credentials
          </span>
        </RevealOnScroll>

        <TextReveal
          as="h2"
          type="words"
          className="mb-6 max-w-2xl text-[length:var(--text-4xl)] leading-tight font-bold"
        >
          Education and certifications
        </TextReveal>

        <RevealOnScroll>
          <p className="text-muted-foreground mb-14 max-w-xl text-[length:var(--text-base)]">
            The foundations behind the work
          </p>
        </RevealOnScroll>

        {/* Tab bar (only if both types have data) */}
        {showTabs && (
          <RevealOnScroll className="mb-12">
            <div className="bg-muted/30 relative flex flex-wrap gap-1 rounded-xl p-1 sm:inline-flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    "relative z-10 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors duration-200",
                    activeTab === tab.key
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/70",
                  )}
                >
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="credential-tab-indicator"
                      className="bg-background absolute inset-0 rounded-lg shadow-sm"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                    />
                  )}
                  {tab.label}
                  <span className="text-muted-foreground ml-1.5 text-xs">{tab.count}</span>
                </button>
              ))}
            </div>
          </RevealOnScroll>
        )}

        {/* Content */}
        <div ref={contentRef} style={{ opacity: 0 }}>
          <AnimatePresence mode="wait">
            {activeTab === "education" && (
              <motion.div
                key="education"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-6"
              >
                {educationData.map((entry, i) => (
                  <EducationCard key={entry.school + entry.degree} entry={entry} index={i} />
                ))}
              </motion.div>
            )}

            {activeTab === "certifications" && (
              <motion.div
                key="certifications"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              >
                {certificationData.map((cert, i) => (
                  <CertificationBadge key={cert.name + cert.issuer} cert={cert} index={i} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
