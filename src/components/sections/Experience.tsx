"use client"

import { useRef } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { Briefcase, MapPin, ExternalLink } from "lucide-react"
import { TextReveal } from "@/components/animations/TextReveal"
import { RevealOnScroll } from "@/components/animations/RevealOnScroll"

gsap.registerPlugin(ScrollTrigger)

interface RolePhase {
  role: string
  period: string
  employmentType: string
  viaCompany: string | null
  viaCompanyLogoUrl: string | null
  description: string
  achievements: string[]
}

interface ExperienceGroup {
  company: string
  companyUrl: string
  companyLogoUrl: string | null
  location: string | null
  phases: RolePhase[]
}

interface ExperienceProps {
  experienceData: ExperienceGroup[]
}

function PhaseEntry({ phase, isLast }: { phase: RolePhase; isLast: boolean }) {
  return (
    <div className={`relative pl-6 ${!isLast ? "border-border/50 border-l pb-6" : ""}`}>
      {/* Phase dot on the mini-timeline */}
      <div className="bg-primary absolute top-1.5 left-0 h-2 w-2 -translate-x-1/2 rounded-full" />

      {/* Role + period row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">{phase.role}</h4>
          {phase.employmentType === "contract" && phase.viaCompany && (
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              via
              {phase.viaCompanyLogoUrl && (
                <Image
                  src={phase.viaCompanyLogoUrl}
                  alt={phase.viaCompany}
                  width={14}
                  height={14}
                  className="rounded-sm object-contain"
                  unoptimized
                />
              )}
              {phase.viaCompany}
            </span>
          )}
        </div>
        <span className="text-muted-foreground shrink-0 text-xs font-medium">{phase.period}</span>
      </div>

      {/* Description */}
      {phase.description && (
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{phase.description}</p>
      )}

      {/* Achievements */}
      {phase.achievements.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {phase.achievements.map((achievement, i) => (
            <li key={i} className="text-muted-foreground flex items-start gap-2.5 text-sm">
              <span className="bg-primary/60 mt-1.5 h-1 w-1 shrink-0 rounded-full" />
              <span className="leading-relaxed">{achievement}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TimelineEntry({ entry, index }: { entry: ExperienceGroup; index: number }) {
  const isLeft = index % 2 === 0
  const hasMultiplePhases = entry.phases.length > 1

  // Overall period: earliest start to latest end
  const overallPeriod = hasMultiplePhases
    ? `${entry.phases[0].period.split(" — ")[0]} — ${entry.phases[entry.phases.length - 1].period.split(" — ")[1]}`
    : entry.phases[0].period

  // Find the latest via company logo (for the overlapping badge)
  const viaLogo = [...entry.phases]
    .reverse()
    .find((p) => p.viaCompanyLogoUrl)?.viaCompanyLogoUrl

  return (
    <div
      className={`timeline-entry relative flex gap-8 md:gap-0 ${
        isLeft ? "md:flex-row" : "md:flex-row-reverse"
      }`}
      style={{ opacity: 0 }}
    >
      {/* Content */}
      <div className={`flex-1 md:px-8 ${isLeft ? "md:text-right" : "md:text-left"}`}>
        <div className="glass hover:border-primary/20 hover:shadow-primary/5 group/card inline-block rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          {/* ── Card Header: Logo + Company + Period ── */}
          <div className={`flex items-center gap-4 ${hasMultiplePhases ? "mb-5" : "mb-4"}`}>
            {/* Company logo with optional via-company badge */}
            <div className="relative shrink-0">
              <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover/card:scale-105">
                {entry.companyLogoUrl ? (
                  <Image
                    src={entry.companyLogoUrl}
                    alt={entry.company}
                    width={44}
                    height={44}
                    className="rounded-lg object-contain"
                    unoptimized
                  />
                ) : (
                  <Briefcase className="text-primary h-7 w-7" />
                )}
              </div>
              {viaLogo && (
                <div className="bg-background absolute -right-1.5 -bottom-1.5 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ring-2 ring-white/10">
                  <Image
                    src={viaLogo}
                    alt="Via company"
                    width={18}
                    height={18}
                    className="rounded-full object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>

            {/* Title cluster */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-(length:--text-xl) leading-snug font-semibold">
                  {/* For single-phase, show role. For multi-phase, show company name */}
                  {hasMultiplePhases ? entry.company : entry.phases[0].role}
                </h3>
                <span className="bg-primary/10 text-primary mt-0.5 shrink-0 rounded-full px-3 py-1 text-xs font-medium">
                  {overallPeriod}
                </span>
              </div>

              {/* Company + location row */}
              <div className="text-muted-foreground mt-1 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  {entry.companyUrl ? (
                    <a
                      href={entry.companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary group/link inline-flex items-center gap-1 transition-colors"
                    >
                      {hasMultiplePhases ? `${entry.phases.length} roles` : entry.company}
                      <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover/link:opacity-100" />
                    </a>
                  ) : (
                    <span>{hasMultiplePhases ? `${entry.phases.length} roles` : entry.company}</span>
                  )}
                  {!hasMultiplePhases &&
                    entry.phases[0].employmentType === "contract" &&
                    entry.phases[0].viaCompany && (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        via
                        {entry.phases[0].viaCompanyLogoUrl && (
                          <Image
                            src={entry.phases[0].viaCompanyLogoUrl}
                            alt={entry.phases[0].viaCompany}
                            width={14}
                            height={14}
                            className="rounded-sm object-contain"
                            unoptimized
                          />
                        )}
                        {entry.phases[0].viaCompany}
                      </span>
                    )}
                </div>
                {entry.location && (
                  <span className="hover:text-primary inline-flex items-center gap-1 transition-colors">
                    <MapPin className="h-3 w-3" />
                    {entry.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {hasMultiplePhases ? (
            /* ── Multi-phase: mini-timeline of roles ── */
            <div className="ml-1">
              {entry.phases.map((phase, i) => (
                <PhaseEntry
                  key={phase.role + phase.period}
                  phase={phase}
                  isLast={i === entry.phases.length - 1}
                />
              ))}
            </div>
          ) : (
            /* ── Single phase: flat description + achievements ── */
            <>
              {entry.phases[0].description && (
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  {entry.phases[0].description}
                </p>
              )}
              {entry.phases[0].achievements.length > 0 && (
                <ul className="space-y-2">
                  {entry.phases[0].achievements.map((achievement, i) => (
                    <li
                      key={i}
                      className="text-muted-foreground flex items-start gap-2.5 text-sm"
                    >
                      <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                      <span className="leading-relaxed">{achievement}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {/* Timeline dot */}
      <div className="absolute top-0 left-0 flex h-full flex-col items-center md:left-1/2 md:-translate-x-1/2">
        <div className="border-primary bg-background z-10 flex h-4 w-4 items-center justify-center rounded-full border-2">
          <div className="bg-primary h-1.5 w-1.5 rounded-full" />
        </div>
      </div>

      {/* Empty space for alternating layout */}
      <div className="hidden flex-1 md:block" />
    </div>
  )
}

export function Experience({ experienceData }: ExperienceProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const entries = gsap.utils.toArray<HTMLElement>(".timeline-entry")

      entries.forEach((entry, i) => {
        const isLeft = i % 2 === 0
        gsap.fromTo(
          entry,
          { opacity: 0, x: isLeft ? -40 : 40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: entry,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          },
        )
      })

      // Animate the timeline line
      gsap.fromTo(
        ".timeline-line",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 40%",
            scrub: 1,
          },
        },
      )
    },
    { scope: sectionRef },
  )

  return (
    <section id="experience" ref={sectionRef} className="section-padding relative">
      <div className="container-wide">
        <RevealOnScroll>
          <span className="text-primary mb-3 block text-sm font-medium tracking-widest uppercase">
            Career Journey
          </span>
        </RevealOnScroll>

        <TextReveal
          as="h2"
          type="words"
          className="mb-16 max-w-2xl text-(length:--text-4xl) leading-tight font-bold"
        >
          The path so far
        </TextReveal>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute top-0 left-0 hidden h-full w-px md:left-1/2 md:block">
            <div className="timeline-line from-primary via-primary/50 h-full w-full origin-top bg-linear-to-b to-transparent" />
          </div>

          {/* Mobile line */}
          <div className="bg-border absolute top-0 left-1.75 h-full w-px md:hidden" />

          <div className="space-y-12 pl-8 md:space-y-16 md:pl-0">
            {experienceData.map((entry, i) => (
              <TimelineEntry key={entry.company} entry={entry} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
