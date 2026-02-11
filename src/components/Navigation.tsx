"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { LogIn, LayoutDashboard, LogOut } from "lucide-react"
import { AnimatedLogo } from "./AnimatedLogo"
import { ThemeToggle } from "./ThemeToggle"
import { cn } from "@/lib/utils"
import { logout } from "@/app/admin/actions"

interface NavigationProps {
  navLinks: { label: string; href: string }[]
  isAuthenticated?: boolean
  siteConfig: {
    name: string
    title: string
    description: string
    url: string
    email: string
    location: string
    availability: string
    socials: Record<string, string>
    linkAnimations: { header: string; footer: string }
  } | null
}

const defaultSiteConfig: NonNullable<NavigationProps["siteConfig"]> = {
  name: "",
  title: "",
  description: "",
  url: "",
  email: "",
  location: "",
  availability: "",
  socials: {},
  linkAnimations: { header: "underline-slide", footer: "underline-slide" },
}

export function Navigation({
  navLinks,
  siteConfig: siteConfigProp,
  isAuthenticated = false,
}: NavigationProps) {
  const siteConfig = siteConfigProp ?? defaultSiteConfig
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const [isLoggingOut, startLogoutTransition] = useTransition()

  // Resolve nav link href: on homepage use anchor, on other pages use full path for Blog
  function resolveHref(link: { label: string; href: string }) {
    if (link.href === "#blog" && !isHomePage) return "/blog"
    if (link.href.startsWith("#") && !isHomePage) return `/${link.href}`
    return link.href
  }

  // Check if a nav link is active based on current pathname
  function isLinkActive(link: { label: string; href: string }) {
    // On homepage, use intersection-based activeSection for anchor links
    if (isHomePage && link.href.startsWith("#")) return activeSection === link.href
    // Path-based links: match current pathname
    if (link.href === "/resume") return pathname === "/resume"
    if (link.href === "#blog") return pathname.startsWith("/blog")
    return false
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    const observerOptions = {
      rootMargin: "-20% 0px -70% 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(`#${entry.target.id}`)
        }
      })
    }, observerOptions)

    navLinks.forEach((link) => {
      if (!link.href.startsWith("#")) return
      const el = document.querySelector(link.href)
      if (el) observer.observe(el)
    })

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      observer.disconnect()
    }
  }, [navLinks])

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 right-0 left-0 z-[100] transition-all duration-500",
          isScrolled ? "glass py-3 shadow-lg shadow-black/5" : "bg-transparent py-5",
        )}
      >
        <nav className="container-wide flex items-center justify-between">
          {/* Logo */}
          <AnimatedLogo name={siteConfig.name} size="sm" />

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const href = resolveHref(link)
              const isAnchor = href.startsWith("#")
              const Tag = isAnchor ? "a" : Link
              const active = isLinkActive(link)
              const animClass =
                !active && siteConfig.linkAnimations.header !== "none"
                  ? `link-hover-${siteConfig.linkAnimations.header}`
                  : ""
              return (
                <Tag
                  key={link.href}
                  href={href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    animClass,
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="bg-accent absolute inset-0 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Tag>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Auth buttons — desktop */}
            <div className="hidden items-center gap-2 md:flex">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/admin"
                    className="border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    <LayoutDashboard className="h-3 w-3" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => startLogoutTransition(() => logout())}
                    disabled={isLoggingOut}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    <LogOut className="h-3 w-3" />
                    {isLoggingOut ? "..." : "Logout"}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  <LogIn className="h-3 w-3" />
                  Sign In
                </Link>
              )}
            </div>

            <ThemeToggle />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="relative flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMobileOpen}
            >
              <motion.span
                animate={isMobileOpen ? { rotate: 45, y: 4.5 } : { rotate: 0, y: 0 }}
                className="bg-foreground block h-[1.5px] w-5"
                transition={{ duration: 0.3 }}
              />
              <motion.span
                animate={isMobileOpen ? { opacity: 0 } : { opacity: 1 }}
                className="bg-foreground block h-[1.5px] w-5"
                transition={{ duration: 0.2 }}
              />
              <motion.span
                animate={isMobileOpen ? { rotate: -45, y: -4.5 } : { rotate: 0, y: 0 }}
                className="bg-foreground block h-[1.5px] w-5"
                transition={{ duration: 0.3 }}
              />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-background/95 fixed inset-0 z-[99] backdrop-blur-xl md:hidden"
          >
            <nav className="flex h-full flex-col items-center justify-center gap-8">
              {navLinks.map((link, i) => {
                const href = resolveHref(link)
                const isAnchor = href.startsWith("#")
                return isAnchor ? (
                  <motion.a
                    key={link.href}
                    href={href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: i * 0.07, duration: 0.4 }}
                    className="hover:text-primary text-3xl font-medium transition-colors"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {link.label}
                  </motion.a>
                ) : (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: i * 0.07, duration: 0.4 }}
                  >
                    <Link
                      href={href}
                      className="hover:text-primary text-3xl font-medium transition-colors"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                )
              })}

              {/* Auth link — mobile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: navLinks.length * 0.07, duration: 0.4 }}
                className="border-border/30 mt-4 flex items-center gap-4 border-t pt-8"
              >
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileOpen(false)}
                      className="text-muted-foreground hover:text-primary flex items-center gap-2 text-lg font-medium transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileOpen(false)
                        startLogoutTransition(() => logout())
                      }}
                      disabled={isLoggingOut}
                      className="text-muted-foreground hover:text-primary flex items-center gap-2 text-lg font-medium transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className="text-muted-foreground hover:text-primary flex items-center gap-2 text-lg font-medium transition-colors"
                  >
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </Link>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
