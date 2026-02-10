"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { motion, AnimatePresence } from "motion/react"
import { TextReveal } from "@/components/animations/TextReveal"
import { RevealOnScroll } from "@/components/animations/RevealOnScroll"
import { Badge } from "@/components/ui/badge"

gsap.registerPlugin(ScrollTrigger)

interface Project {
  id: string
  title: string
  description: string
  longDescription: string
  tags: string[]
  image: string
  images: string[]
  imageCaptions: Record<string, string>
  architectureUrl: string | null
  liveUrl: string
  githubUrl: string
  featured: boolean
  year: string
  color: string
  status: string | null
  role: string | null
  highlights: { metric: string; value: string }[]
  experiences: { company: string; role: string }[]
  education: { school: string; degree: string; field: string | null }[]
  certifications: { name: string; issuer: string }[]
}

interface ProjectsProps {
  projectsData: Project[]
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-green-500/80 text-white" },
  in_progress: { label: "In Progress", className: "bg-amber-500/80 text-white" },
  open_source: { label: "Open Source", className: "bg-blue-500/80 text-white" },
}

function ProjectCard({
  project,
  index,
  onClick,
}: {
  project: Project
  index: number
  onClick: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    gsap.to(cardRef.current, {
      rotateY: x * 8,
      rotateX: -y * 8,
      duration: 0.4,
      ease: "power2.out",
    })
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.6,
      ease: "elastic.out(1, 0.5)",
    })
  }

  const hasImage = project.image && project.image.startsWith("http")
  const statusStyle = project.status ? STATUS_STYLES[project.status] : null

  return (
    <div
      ref={cardRef}
      className="group h-full cursor-pointer"
      style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick()
      }}
      aria-label={`View ${project.title} details`}
    >
      <div className="glass hover:border-primary/20 hover:shadow-primary/5 flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-2xl">
        {/* Image / placeholder */}
        <div className="relative aspect-video overflow-hidden">
          {hasImage ? (
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${project.color}20, ${project.color}05)`,
              }}
            >
              <span className="text-6xl font-bold opacity-10" style={{ color: project.color }}>
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
          )}

          {/* Status badge */}
          {statusStyle && (
            <span
              className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${statusStyle.className}`}
            >
              {statusStyle.label}
            </span>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <span className="text-sm font-medium text-white">View Project</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[length:var(--text-xl)] font-semibold">{project.title}</h3>
            <span className="text-muted-foreground shrink-0 text-xs">{project.year}</span>
          </div>
          <p className="text-muted-foreground mb-4 line-clamp-2 text-sm leading-relaxed">
            {project.description}
          </p>
          <div className="mt-auto flex flex-wrap gap-2">
            {project.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 4 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{project.tags.length - 4}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const hasImage = project.image && project.image.startsWith("http")
  const statusStyle = project.status ? STATUS_STYLES[project.status] : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="bg-background/80 absolute inset-0 backdrop-blur-xl" />

      {/* Modal content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="bg-background/50 hover:bg-accent absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors"
          aria-label="Close project details"
        >
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Hero image */}
        <div className="relative aspect-video w-full overflow-hidden">
          {hasImage ? (
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${project.color}30, ${project.color}08)`,
              }}
            >
              <span className="text-8xl font-bold opacity-10" style={{ color: project.color }}>
                {project.title[0]}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-6 p-8">
          {/* Header: title + status + experience */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-[length:var(--text-3xl)] font-bold">{project.title}</h2>
              {statusStyle && (
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase ${statusStyle.className}`}
                >
                  {statusStyle.label}
                </span>
              )}
            </div>
            {project.experiences.length > 0 && (
              <p className="text-muted-foreground mt-1 text-sm">
                Built at{" "}
                <span className="text-foreground font-medium">
                  {project.experiences[0].company}
                </span>{" "}
                as {project.experiences[0].role}
              </p>
            )}
            {project.education.length > 0 && (
              <p className="text-muted-foreground mt-1 text-sm">
                {project.education.map((edu, i) => (
                  <span key={i}>
                    {i > 0 && " · "}
                    Studied at <span className="text-foreground font-medium">{edu.school}</span>
                    {" — "}
                    {[edu.degree, edu.field].filter(Boolean).join(" in ")}
                  </span>
                ))}
              </p>
            )}
            {project.certifications.length > 0 && (
              <p className="text-muted-foreground mt-1 text-sm">
                {project.certifications.map((cert, i) => (
                  <span key={i}>
                    {i > 0 && " · "}
                    <span className="text-foreground font-medium">{cert.name}</span>
                    {" by "}
                    {cert.issuer}
                  </span>
                ))}
              </p>
            )}
          </div>

          {/* Role */}
          {project.role && (
            <div>
              <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                My Role
              </h3>
              <p className="text-sm">{project.role}</p>
            </div>
          )}

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">{project.longDescription}</p>

          {/* Key Metrics */}
          {project.highlights.length > 0 && (
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Key Metrics
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {project.highlights.map((h, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <p className="text-muted-foreground text-xs">{h.metric}</p>
                    <p className="text-xl font-bold">{h.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Architecture Diagram */}
          {project.architectureUrl && (
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Architecture
              </h3>
              <div className="overflow-hidden rounded-xl border">
                <Image
                  src={project.architectureUrl}
                  alt={`${project.title} architecture diagram`}
                  width={800}
                  height={500}
                  className="w-full object-contain"
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* Photo Gallery */}
          {project.images.length > 0 && (
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Gallery
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {project.images.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    className="group/img overflow-hidden rounded-xl border text-left transition-shadow hover:shadow-lg"
                    onClick={() => setLightboxIndex(i)}
                  >
                    <Image
                      src={img}
                      alt={project.imageCaptions[img] || `${project.title} screenshot ${i + 1}`}
                      width={400}
                      height={250}
                      className="w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                      unoptimized
                    />
                    {project.imageCaptions[img] && (
                      <p className="text-muted-foreground px-3 py-2 text-xs">
                        {project.imageCaptions[img]}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Live Demo
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border hover:bg-accent inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Source Code
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Nav arrows */}
            {project.images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex(
                      (lightboxIndex - 1 + project.images.length) % project.images.length,
                    )
                  }}
                  aria-label="Previous image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((lightboxIndex + 1) % project.images.length)
                  }}
                  aria-label="Next image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}

            {/* Close button */}
            <button
              type="button"
              className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close lightbox"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Image */}
            <Image
              src={project.images[lightboxIndex]}
              alt={
                project.imageCaptions[project.images[lightboxIndex]] ||
                `${project.title} screenshot ${lightboxIndex + 1}`
              }
              width={1200}
              height={800}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
              unoptimized
            />

            {/* Caption */}
            {project.imageCaptions[project.images[lightboxIndex]] && (
              <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm">
                {project.imageCaptions[project.images[lightboxIndex]]}
              </p>
            )}

            {/* Counter */}
            <p className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white/70">
              {lightboxIndex + 1} / {project.images.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function Projects({ projectsData }: ProjectsProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>(".project-card")

      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          },
        )
      })
    },
    { scope: sectionRef },
  )

  return (
    <section id="projects" ref={sectionRef} className="section-padding relative">
      <div className="container-wide">
        <RevealOnScroll>
          <span className="text-primary mb-3 block text-sm font-medium tracking-widest uppercase">
            Featured Work
          </span>
        </RevealOnScroll>

        <TextReveal
          as="h2"
          type="words"
          className="mb-16 max-w-2xl text-[length:var(--text-4xl)] leading-tight font-bold"
        >
          Projects that push boundaries
        </TextReveal>

        {/* Projects grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projectsData.map((project, i) => (
            <div key={project.id} className="project-card h-full" style={{ opacity: 0 }}>
              <ProjectCard
                project={project}
                index={i}
                onClick={() => setSelectedProject(project)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Project modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}
