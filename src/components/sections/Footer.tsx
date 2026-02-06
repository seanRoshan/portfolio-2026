"use client"

import Link from "next/link"

interface FooterProps {
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
  navLinks: { label: string; href: string }[]
}

const defaultSiteConfig: NonNullable<FooterProps["siteConfig"]> = {
  name: "",
  title: "",
  description: "",
  url: "",
  email: "",
  location: "",
  availability: "",
  socials: {},
}

function FooterNavLink({ link }: { link: { label: string; href: string } }) {
  const className = "text-muted-foreground hover:text-foreground text-sm transition-colors"
  if (link.href.startsWith("#")) {
    return (
      <a href={link.href} className={className}>
        {link.label}
      </a>
    )
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  )
}

export function Footer({ siteConfig: siteConfigProp, navLinks }: FooterProps) {
  const siteConfig = siteConfigProp ?? defaultSiteConfig
  const currentYear = new Date().getFullYear()

  const socials = [
    { name: "GitHub", url: siteConfig.socials.github },
    { name: "LinkedIn", url: siteConfig.socials.linkedin },
    { name: "X", url: siteConfig.socials.twitter },
    { name: "Dribbble", url: siteConfig.socials.dribbble },
  ]

  return (
    <footer className="border-border/50 border-t">
      <div className="container-wide py-16">
        {/* Top row: logo + tagline */}
        <div className="mb-12 flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <Link
              href="/"
              className="hover:text-primary text-2xl font-bold tracking-tight transition-colors"
            >
              {siteConfig.name.split(" ")[0]}
              <span className="text-primary">.</span>
            </Link>
            <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">
              Building digital experiences that are fast, accessible, and impossible to forget.
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
                  <FooterNavLink key={link.href} link={link} />
                ))}
              </nav>
            </div>
            <div>
              <p className="text-muted-foreground/60 mb-3 text-xs font-semibold tracking-widest uppercase">
                More
              </p>
              <nav className="flex flex-col gap-2.5">
                {navLinks.slice(3).map((link) => (
                  <FooterNavLink key={link.href} link={link} />
                ))}
              </nav>
            </div>
            <div>
              <p className="text-muted-foreground/60 mb-3 text-xs font-semibold tracking-widest uppercase">
                Social
              </p>
              <nav className="flex flex-col gap-2.5">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {s.name}
                  </a>
                ))}
              </nav>
            </div>
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
            Designed & built with care in {siteConfig.location}
          </p>
        </div>
      </div>
    </footer>
  )
}
