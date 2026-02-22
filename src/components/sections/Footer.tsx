"use client"

import { AnimatedLogo } from "@/components/AnimatedLogo"
import { AnimatedLink } from "@/components/AnimatedLink"

interface VentureLink {
  name: string
  url: string | null
  iconUrl: string | null
}

interface FooterProps {
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
    linkAnimations: { header: string; footer: string }
  } | null
  navLinks: { label: string; href: string }[]
  venturesData?: VentureLink[]
}

const defaultSiteConfig: NonNullable<FooterProps["siteConfig"]> = {
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
  linkAnimations: { header: "underline-slide", footer: "underline-slide" },
}

function formatSocialName(key: string): string {
  const nameMap: Record<string, string> = {
    github: "GitHub",
    linkedin: "LinkedIn",
    twitter: "X",
    youtube: "YouTube",
  }
  return nameMap[key.toLowerCase()] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

function FooterNavLink({
  link,
  animation,
}: {
  link: { label: string; href: string }
  animation: string
}) {
  return (
    <AnimatedLink
      href={link.href}
      animation={animation}
      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
    >
      {link.label}
    </AnimatedLink>
  )
}

export function Footer({ siteConfig: siteConfigProp, navLinks, venturesData = [] }: FooterProps) {
  const siteConfig = siteConfigProp ?? defaultSiteConfig
  const currentYear = new Date().getFullYear()

  const socials = Object.entries(siteConfig.socials)
    .filter(([, url]) => url?.trim())
    .map(([key, url]) => ({ name: formatSocialName(key), url }))

  return (
    <footer className="border-border/50 border-t">
      <div className="container-wide py-16">
        {/* Top row: logo + tagline */}
        <div className="mb-12 flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <AnimatedLogo name={siteConfig.name} size="lg" />
            <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">
              Building software that&apos;s fast, reliable, and built to last.
            </p>
          </div>

          {/* Nav columns */}
          <div className="flex gap-16">
            <div>
              <p className="text-muted-foreground/60 mb-3 text-xs font-semibold tracking-widest uppercase">
                Navigate
              </p>
              <nav className="flex flex-col gap-2.5">
                {navLinks.slice(0, 3).map((link) => (
                  <FooterNavLink key={link.href} link={link} animation={siteConfig.linkAnimations.footer} />
                ))}
              </nav>
            </div>
            <div>
              <p className="text-muted-foreground/60 mb-3 text-xs font-semibold tracking-widest uppercase">
                More
              </p>
              <nav className="flex flex-col gap-2.5">
                {navLinks.slice(3).map((link) => (
                  <FooterNavLink key={link.href} link={link} animation={siteConfig.linkAnimations.footer} />
                ))}
              </nav>
            </div>
            {socials.length > 0 && (
              <div>
                <p className="text-muted-foreground/60 mb-3 text-xs font-semibold tracking-widest uppercase">
                  Social
                </p>
                <nav className="flex flex-col gap-2.5">
                  {socials.map((s) => (
                    <AnimatedLink
                      key={s.name}
                      href={s.url}
                      external
                      animation={siteConfig.linkAnimations.footer}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {s.name}
                    </AnimatedLink>
                  ))}
                </nav>
              </div>
            )}
            {venturesData.length > 0 && (
              <div>
                <p className="text-muted-foreground/60 mb-3 text-xs font-semibold tracking-widest uppercase">
                  Ventures
                </p>
                <nav className="flex flex-col gap-2.5">
                  {venturesData.map((v) =>
                    v.url ? (
                      <AnimatedLink
                        key={v.name}
                        href={v.url}
                        external
                        animation={siteConfig.linkAnimations.footer}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {v.name}
                      </AnimatedLink>
                    ) : (
                      <span
                        key={v.name}
                        className="text-muted-foreground text-sm"
                      >
                        {v.name}
                      </span>
                    ),
                  )}
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="bg-border/50 h-px w-full" />

        {/* Bottom row */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 md:flex-row">
          <p className="text-muted-foreground text-xs">
            &copy; {currentYear} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">
            Crafted with care somewhere on Planet Earth
          </p>
        </div>
      </div>
    </footer>
  )
}
