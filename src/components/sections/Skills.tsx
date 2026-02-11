"use client"

import { useRef, useState, useCallback } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { AnimatePresence, motion } from "motion/react"
import { TextReveal } from "@/components/animations/TextReveal"
import { RevealOnScroll } from "@/components/animations/RevealOnScroll"
import { getTechIcon } from "@/lib/tech-icons"
import { FloatingTechCloud } from "@/components/animations/FloatingTechCloud"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

interface SkillItem {
  name: string
  iconName: string | null
}

interface SkillCategory {
  name: string
  key: string
  skills: SkillItem[]
}

interface SkillsProps {
  skillsData: {
    categories: SkillCategory[]
  } | null
}

const defaultSkillsData: NonNullable<SkillsProps["skillsData"]> = {
  categories: [],
}

function SkillCard({ skill }: { skill: SkillItem }) {
  const [hovered, setHovered] = useState(false)
  const tech = getTechIcon(skill.iconName)
  const Icon = tech?.icon
  const brandColor = tech?.color ?? "#a78bfa"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "relative flex flex-col items-center gap-3 rounded-2xl p-5",
          "bg-card/40 border border-transparent backdrop-blur-sm",
          "transition-all duration-300 ease-out",
          "hover:-translate-y-1 hover:border-white/10 hover:shadow-lg",
        )}
      >
        {/* Glow effect on hover */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${brandColor}15 0%, transparent 70%)`,
          }}
        />

        {/* Icon */}
        <div className="relative flex h-12 w-12 items-center justify-center">
          {Icon ? (
            <Icon
              className="h-8 w-8 transition-all duration-300 group-hover:scale-110"
              style={{
                color: hovered ? brandColor : "currentColor",
                transition: "color 0.3s ease",
              }}
            />
          ) : (
            <div className="bg-muted h-8 w-8 rounded-lg" />
          )}
        </div>

        {/* Name */}
        <span className="text-muted-foreground group-hover:text-foreground text-center text-xs font-medium tracking-wide transition-colors duration-300">
          {skill.name}
        </span>
      </div>
    </motion.div>
  )
}

export function Skills({ skillsData: skillsDataProp }: SkillsProps) {
  const skillsData = skillsDataProp ?? defaultSkillsData
  const [activeCategory, setActiveCategory] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)

  // Stagger animation when grid enters viewport
  useGSAP(() => {
    const el = gridRef.current
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
  })

  const handleCategoryChange = useCallback((index: number) => {
    setActiveCategory(index)
  }, [])

  const currentCategory = skillsData.categories[activeCategory]
  const totalSkills = skillsData.categories.reduce((sum, cat) => sum + cat.skills.length, 0)
  const allSkills = skillsData.categories.flatMap((cat) => cat.skills)

  return (
    <section id="skills" className="section-padding relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div
          className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full blur-[120px]"
          style={{ background: "oklch(0.7 0.25 264 / 8%)" }}
        />
        <div
          className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full blur-[100px]"
          style={{ background: "oklch(0.7 0.2 330 / 6%)" }}
        />
      </div>

      <div className="container-wide relative">
        {/* Header */}
        <RevealOnScroll>
          <span className="text-primary mb-3 block text-sm font-medium tracking-widest uppercase">
            Skills & Expertise
          </span>
        </RevealOnScroll>

        <TextReveal
          as="h2"
          type="words"
          className="mb-6 max-w-2xl text-[length:var(--text-4xl)] leading-tight font-bold"
        >
          What I build with
        </TextReveal>

        <RevealOnScroll>
          <p className="text-muted-foreground mb-14 max-w-xl text-[length:var(--text-base)]">
            {totalSkills}+ tools and technologies across the full stack, from pixel-perfect
            frontends to scalable infrastructure.
          </p>
        </RevealOnScroll>

        {/* Category tabs with animated indicator */}
        <RevealOnScroll className="mb-12">
          <div className="bg-muted/30 relative flex flex-wrap gap-1 rounded-xl p-1 sm:inline-flex">
            {skillsData.categories.map((cat, i) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(i)}
                className={cn(
                  "relative z-10 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors duration-200",
                  activeCategory === i
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70",
                )}
              >
                {activeCategory === i && (
                  <motion.div
                    layoutId="skill-tab-indicator"
                    className="bg-background absolute inset-0 rounded-lg shadow-sm"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                  />
                )}
                {cat.name}
                <span className="text-muted-foreground ml-1.5 text-xs">{cat.skills.length}</span>
              </button>
            ))}
          </div>
        </RevealOnScroll>

        {/* Skills grid */}
        <div ref={gridRef} style={{ opacity: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCategory?.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
            >
              {(currentCategory?.skills ?? []).map((skill) => (
                <SkillCard key={skill.name} skill={skill} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Interactive floating tech cloud */}
        {allSkills.length > 0 && (
          <div className="mt-20">
            <RevealOnScroll>
              <p className="text-muted-foreground mx-auto mb-8 max-w-md text-center text-sm">
                Hover to explore — push them around
              </p>
            </RevealOnScroll>
            <FloatingTechCloud items={allSkills} className="rounded-2xl" />
          </div>
        )}
      </div>
    </section>
  )
}
