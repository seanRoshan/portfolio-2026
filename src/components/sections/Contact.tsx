"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import { TextReveal } from "@/components/animations/TextReveal"
import { RevealOnScroll } from "@/components/animations/RevealOnScroll"
import { MagneticButton } from "@/components/animations/MagneticButton"
import { toast } from "sonner"
import { getSocialPlatform, getSocialLabel } from "@/lib/social-icons"
import { ObfuscatedEmail, ObfuscatedPhone } from "@/components/ObfuscatedContact"

interface ContactProps {
  siteConfig: {
    name: string
    title: string
    description: string
    url: string
    email: string
    phone: string
    location: string
    availability: string
    socials: Record<string, string>
    linkedinUrl: string
    githubUrl: string
    portfolioUrl: string
    visibility: {
      email: boolean
      phone: boolean
      location: boolean
      linkedin: boolean
      github: boolean
      portfolio: boolean
    }
  } | null
}

const defaultSiteConfig: NonNullable<ContactProps["siteConfig"]> = {
  name: "",
  title: "",
  description: "",
  url: "",
  email: "",
  phone: "",
  location: "",
  availability: "",
  socials: {},
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  visibility: { email: true, phone: false, location: true, linkedin: true, github: true, portfolio: true },
}

/* ── Contact detail pill ─────────────────────── */

function ContactPill({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="border-border/50 bg-card/30 flex items-center gap-2.5 rounded-full border px-4 py-2 backdrop-blur-sm">
      <span className="text-primary/60">{icon}</span>
      <span className="text-muted-foreground text-sm">{children}</span>
    </div>
  )
}

/* ── Icons ───────────────────────────────────── */

const MailIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const PhoneIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const MapPinIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export function Contact({ siteConfig: siteConfigProp }: ContactProps) {
  const siteConfig = siteConfigProp ?? defaultSiteConfig
  const formRef = useRef<HTMLFormElement>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || "Failed to send message")
      }

      toast.success("Message sent! I'll get back to you soon.")
      formRef.current.reset()
      setFocused(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setSubmitting(false)
    }
  }

  // Map social platform keys to visibility flags
  const socialVisibility: Record<string, keyof typeof siteConfig.visibility> = {
    linkedin: "linkedin",
    github: "github",
    website: "portfolio",
    portfolio: "portfolio",
  }

  // Build socials dynamically, filtered by visibility
  const socials = Object.entries(siteConfig.socials)
    .filter(([key, url]) => {
      if (!url?.trim()) return false
      const visKey = socialVisibility[key]
      // If there's a visibility toggle for this platform, respect it; otherwise show
      return visKey ? siteConfig.visibility[visKey] : true
    })
    .map(([key, url]) => {
      const platform = getSocialPlatform(key)
      return {
        name: getSocialLabel(key),
        url,
        iconPath: platform?.iconPath ?? null,
      }
    })

  return (
    <section id="contact" className="section-padding relative">
      {/* Background gradient */}
      <div className="gradient-mesh absolute inset-0 -z-10 opacity-50" />

      <div className="container-wide">
        <div className="mx-auto max-w-2xl text-center">
          <RevealOnScroll>
            <span className="text-primary mb-3 block text-sm font-medium tracking-widest uppercase">
              Get In Touch
            </span>
          </RevealOnScroll>

          <TextReveal
            as="h2"
            type="words"
            className="mb-6 text-(length:--text-4xl) leading-tight font-bold"
          >
            Got a project? Let&apos;s talk
          </TextReveal>

          <RevealOnScroll delay={0.2}>
            <p className="text-muted-foreground mb-12">
              Have a project in mind, a question, or just want to say hi? My inbox is always open.
            </p>
          </RevealOnScroll>

          {/* Contact form */}
          <RevealOnScroll delay={0.4}>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="glass mx-auto max-w-lg space-y-6 rounded-3xl p-8 text-left"
            >
              {/* Name */}
              <div className="relative">
                <label
                  htmlFor="name"
                  className={`absolute left-4 transition-all duration-300 ${
                    focused === "name"
                      ? "text-primary top-2 text-xs"
                      : "text-muted-foreground top-4 text-sm"
                  }`}
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="border-border focus:border-primary w-full rounded-xl border bg-transparent px-4 pt-7 pb-3 text-sm transition-colors outline-none"
                  onFocus={() => setFocused("name")}
                  onBlur={(e) => {
                    if (!e.target.value) setFocused(null)
                  }}
                />
              </div>

              {/* Email */}
              <div className="relative">
                <label
                  htmlFor="email"
                  className={`absolute left-4 transition-all duration-300 ${
                    focused === "email"
                      ? "text-primary top-2 text-xs"
                      : "text-muted-foreground top-4 text-sm"
                  }`}
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="border-border focus:border-primary w-full rounded-xl border bg-transparent px-4 pt-7 pb-3 text-sm transition-colors outline-none"
                  onFocus={() => setFocused("email")}
                  onBlur={(e) => {
                    if (!e.target.value) setFocused(null)
                  }}
                />
              </div>

              {/* Message */}
              <div className="relative">
                <label
                  htmlFor="message"
                  className={`absolute left-4 transition-all duration-300 ${
                    focused === "message"
                      ? "text-primary top-2 text-xs"
                      : "text-muted-foreground top-4 text-sm"
                  }`}
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  className="border-border focus:border-primary w-full resize-none rounded-xl border bg-transparent px-4 pt-7 pb-3 text-sm transition-colors outline-none"
                  onFocus={() => setFocused("message")}
                  onBlur={(e) => {
                    if (!e.target.value) setFocused(null)
                  }}
                />
              </div>

              <MagneticButton
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
              >
                {submitting ? "Sending..." : "Send Message"}
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
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </MagneticButton>
            </form>
          </RevealOnScroll>

          {/* Contact details + social links */}
          <RevealOnScroll delay={0.5}>
            <div className="mt-12 space-y-6">
              {/* Contact pills */}
              {(siteConfig.visibility.email || siteConfig.visibility.phone || siteConfig.visibility.location) && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {siteConfig.visibility.email && siteConfig.email && (
                    <ContactPill icon={MailIcon}>
                      <ObfuscatedEmail
                        email={siteConfig.email}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      />
                    </ContactPill>
                  )}
                  {siteConfig.visibility.phone && siteConfig.phone && (
                    <ContactPill icon={PhoneIcon}>
                      <ObfuscatedPhone
                        phone={siteConfig.phone}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      />
                    </ContactPill>
                  )}
                  {siteConfig.visibility.location && siteConfig.location && (
                    <ContactPill icon={MapPinIcon}>
                      {siteConfig.location}
                    </ContactPill>
                  )}
                </div>
              )}

              {/* Social links */}
              {socials.length > 0 && (
                <div className="flex justify-center gap-4">
                  {socials.map((social) => (
                    <motion.a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-border bg-card/50 text-muted-foreground hover:border-primary/50 hover:text-primary flex size-14 items-center justify-center rounded-full border transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`Visit ${social.name} profile`}
                    >
                      {social.iconPath ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d={social.iconPath} />
                        </svg>
                      ) : (
                        <span className="text-sm font-bold">{social.name.charAt(0)}</span>
                      )}
                    </motion.a>
                  ))}
                </div>
              )}
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  )
}
