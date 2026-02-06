"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, LayoutDashboard, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { logout } from "@/app/admin/actions";

interface NavigationProps {
  navLinks: { label: string; href: string }[];
  isAuthenticated?: boolean;
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

const defaultSiteConfig: NonNullable<NavigationProps["siteConfig"]> = {
  name: "",
  title: "",
  description: "",
  url: "",
  email: "",
  location: "",
  availability: "",
  socials: {},
};

export function Navigation({ navLinks, siteConfig: siteConfigProp, isAuthenticated = false }: NavigationProps) {
  const siteConfig = siteConfigProp ?? defaultSiteConfig;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isLoggingOut, startLogoutTransition] = useTransition();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const observerOptions = {
      rootMargin: "-20% 0px -70% 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(`#${entry.target.id}`);
        }
      });
    }, observerOptions);

    navLinks.forEach((link) => {
      const el = document.querySelector(link.href);
      if (el) observer.observe(el);
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [navLinks]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 right-0 left-0 z-[100] transition-all duration-500",
          isScrolled
            ? "glass py-3 shadow-lg shadow-black/5"
            : "py-5 bg-transparent"
        )}
      >
        <nav className="container-wide flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            className="text-lg font-bold tracking-tight transition-colors hover:text-primary"
          >
            {siteConfig.name.split(" ")[0]}
            <span className="text-primary">.</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  activeSection === link.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {activeSection === link.href && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full bg-accent"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Auth buttons — desktop */}
            <div className="hidden items-center gap-2 md:flex">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  >
                    <LayoutDashboard className="h-3 w-3" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => startLogoutTransition(() => logout())}
                    disabled={isLoggingOut}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <LogOut className="h-3 w-3" />
                    {isLoggingOut ? "..." : "Logout"}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
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
                animate={
                  isMobileOpen
                    ? { rotate: 45, y: 4.5 }
                    : { rotate: 0, y: 0 }
                }
                className="block h-[1.5px] w-5 bg-foreground"
                transition={{ duration: 0.3 }}
              />
              <motion.span
                animate={isMobileOpen ? { opacity: 0 } : { opacity: 1 }}
                className="block h-[1.5px] w-5 bg-foreground"
                transition={{ duration: 0.2 }}
              />
              <motion.span
                animate={
                  isMobileOpen
                    ? { rotate: -45, y: -4.5 }
                    : { rotate: 0, y: 0 }
                }
                className="block h-[1.5px] w-5 bg-foreground"
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
            className="fixed inset-0 z-[99] bg-background/95 backdrop-blur-xl md:hidden"
          >
            <nav className="flex h-full flex-col items-center justify-center gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  className="text-3xl font-medium transition-colors hover:text-primary"
                  onClick={() => setIsMobileOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}

              {/* Auth link — mobile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: navLinks.length * 0.07, duration: 0.4 }}
                className="mt-4 flex items-center gap-4 border-t border-border/30 pt-8"
              >
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center gap-2 text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { setIsMobileOpen(false); startLogoutTransition(() => logout()) }}
                      disabled={isLoggingOut}
                      className="flex items-center gap-2 text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-2 text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
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
  );
}
