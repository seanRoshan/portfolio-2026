"use client";

interface FooterProps {
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
  navLinks: { label: string; href: string }[];
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
};

export function Footer({ siteConfig: siteConfigProp, navLinks }: FooterProps) {
  const siteConfig = siteConfigProp ?? defaultSiteConfig;
  const currentYear = new Date().getFullYear();

  const socials = [
    { name: "GitHub", url: siteConfig.socials.github },
    { name: "LinkedIn", url: siteConfig.socials.linkedin },
    { name: "X", url: siteConfig.socials.twitter },
    { name: "Dribbble", url: siteConfig.socials.dribbble },
  ];

  return (
    <footer className="border-t border-border/50">
      <div className="container-wide py-16">
        {/* Top row: logo + tagline */}
        <div className="mb-12 flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <a
              href="#"
              className="text-2xl font-bold tracking-tight transition-colors hover:text-primary"
            >
              {siteConfig.name.split(" ")[0]}
              <span className="text-primary">.</span>
            </a>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Building digital experiences that are fast, accessible, and
              impossible to forget.
            </p>
          </div>

          {/* Nav columns */}
          <div className="flex gap-16">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Navigate
              </p>
              <nav className="flex flex-col gap-2.5">
                {navLinks.slice(0, 3).map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                More
              </p>
              <nav className="flex flex-col gap-2.5">
                {navLinks.slice(3).map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Social
              </p>
              <nav className="flex flex-col gap-2.5">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.name}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border/50" />

        {/* Bottom row */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Designed & built with care in {siteConfig.location}
          </p>
        </div>
      </div>
    </footer>
  );
}
