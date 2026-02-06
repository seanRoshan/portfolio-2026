"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { TextReveal } from "@/components/animations/TextReveal";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { toast } from "sonner";

interface ContactProps {
  siteConfig: {
    name: string;
    title: string;
    description: string;
    url: string;
    email: string;
    location: string;
    availability: string;
    socials: Record<string, string>;
  } | null;
}

const defaultSiteConfig: NonNullable<ContactProps["siteConfig"]> = {
  name: "",
  title: "",
  description: "",
  url: "",
  email: "",
  location: "",
  availability: "",
  socials: {},
};

export function Contact({ siteConfig: siteConfigProp }: ContactProps) {
  const siteConfig = siteConfigProp ?? defaultSiteConfig;
  const formRef = useRef<HTMLFormElement>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to send message");
      }

      toast.success("Message sent! I'll get back to you soon.");
      formRef.current.reset();
      setFocused(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(siteConfig.email);
    toast.success("Email copied to clipboard!");
  };

  const socials = [
    {
      name: "GitHub",
      url: siteConfig.socials.github,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      ),
    },
    {
      name: "LinkedIn",
      url: siteConfig.socials.linkedin,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      ),
    },
    {
      name: "X",
      url: siteConfig.socials.twitter,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      ),
    },
    {
      name: "Dribbble",
      url: siteConfig.socials.dribbble,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.91 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"/></svg>
      ),
    },
  ];

  return (
    <section id="contact" className="section-padding relative">
      {/* Background gradient */}
      <div className="gradient-mesh absolute inset-0 -z-10 opacity-50" />

      <div className="container-wide">
        <div className="mx-auto max-w-2xl text-center">
          <RevealOnScroll>
            <span className="mb-3 block text-sm font-medium uppercase tracking-widest text-primary">
              Get In Touch
            </span>
          </RevealOnScroll>

          <TextReveal
            as="h2"
            type="words"
            className="mb-6 text-[length:var(--text-4xl)] font-bold leading-tight"
          >
            Let us build something great together
          </TextReveal>

          <RevealOnScroll delay={0.2}>
            <p className="mb-12 text-muted-foreground">
              Have a project in mind, a question, or just want to say hi?
              My inbox is always open.
            </p>
          </RevealOnScroll>

          {/* Email copy button */}
          <RevealOnScroll delay={0.3}>
            <button
              onClick={copyEmail}
              className="glass group mb-12 inline-flex items-center gap-3 rounded-full px-6 py-3 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
            >
              <span className="text-lg font-medium">{siteConfig.email}</span>
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
                className="text-muted-foreground transition-colors group-hover:text-primary"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
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
                      ? "top-2 text-xs text-primary"
                      : "top-4 text-sm text-muted-foreground"
                  }`}
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-xl border border-border bg-transparent px-4 pt-7 pb-3 text-sm outline-none transition-colors focus:border-primary"
                  onFocus={() => setFocused("name")}
                  onBlur={(e) => {
                    if (!e.target.value) setFocused(null);
                  }}
                />
              </div>

              {/* Email */}
              <div className="relative">
                <label
                  htmlFor="email"
                  className={`absolute left-4 transition-all duration-300 ${
                    focused === "email"
                      ? "top-2 text-xs text-primary"
                      : "top-4 text-sm text-muted-foreground"
                  }`}
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-border bg-transparent px-4 pt-7 pb-3 text-sm outline-none transition-colors focus:border-primary"
                  onFocus={() => setFocused("email")}
                  onBlur={(e) => {
                    if (!e.target.value) setFocused(null);
                  }}
                />
              </div>

              {/* Message */}
              <div className="relative">
                <label
                  htmlFor="message"
                  className={`absolute left-4 transition-all duration-300 ${
                    focused === "message"
                      ? "top-2 text-xs text-primary"
                      : "top-4 text-sm text-muted-foreground"
                  }`}
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  className="w-full resize-none rounded-xl border border-border bg-transparent px-4 pt-7 pb-3 text-sm outline-none transition-colors focus:border-primary"
                  onFocus={() => setFocused("message")}
                  onBlur={(e) => {
                    if (!e.target.value) setFocused(null);
                  }}
                />
              </div>

              <MagneticButton
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
          <RevealOnScroll delay={0.5}>
            <div className="mt-12 flex justify-center gap-4">
              {socials.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/50 text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Visit ${social.name} profile`}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
