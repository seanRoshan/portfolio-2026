"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import { TextReveal } from "@/components/animations/TextReveal"
import { RevealOnScroll } from "@/components/animations/RevealOnScroll"
import { MagneticButton } from "@/components/animations/MagneticButton"
import { toast } from "sonner"
import { getSocialPlatform, getSocialLabel } from "@/lib/social-icons"

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

  // Build socials dynamically from the registry
  const socials = Object.entries(siteConfig.socials)
    .filter(([, url]) => url?.trim())
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

          {/* Social links */}
          {socials.length > 0 && (
            <RevealOnScroll delay={0.5}>
              <div className="mt-12 flex justify-center gap-4">
                {socials.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border bg-card/50 text-muted-foreground hover:border-primary/30 hover:text-primary flex h-12 w-12 items-center justify-center rounded-full border transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Visit ${social.name} profile`}
                  >
                    {social.iconPath ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d={social.iconPath} />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">{social.name.charAt(0)}</span>
                    )}
                  </motion.a>
                ))}
              </div>
            </RevealOnScroll>
          )}
        </div>
      </div>
    </section>
  )
}
