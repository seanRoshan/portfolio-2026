"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { TextReveal } from "@/components/animations/TextReveal";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { StaggerChildren } from "@/components/animations/StaggerChildren";

gsap.registerPlugin(ScrollTrigger);

interface AboutProps {
  aboutData: {
    headline: string;
    description: string[];
    stats: { label: string; value: number }[];
    techStack: { name: string; category: string }[];
  } | null;
}

const defaultAboutData: NonNullable<AboutProps["aboutData"]> = {
  headline: "",
  description: [],
  stats: [],
  techStack: [],
};

function AnimatedCounter({ value, label }: { value: number; label: string }) {
  const counterRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = counterRef.current;
    if (!el) return;

    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toLocaleString() + (value >= 100 ? "+" : "+");
      },
    });
  });

  return (
    <div className="text-center">
      <span
        ref={counterRef}
        className="block text-[length:var(--text-4xl)] font-bold text-gradient"
      >
        0
      </span>
      <span className="mt-1 block text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function About({ aboutData: aboutDataProp }: AboutProps) {
  const aboutData = aboutDataProp ?? defaultAboutData;
  return (
    <section id="about" className="section-padding relative">
      <div className="container-wide">
        {/* Section heading */}
        <RevealOnScroll>
          <span className="mb-3 block text-sm font-medium uppercase tracking-widest text-primary">
            About Me
          </span>
        </RevealOnScroll>

        <TextReveal
          as="h2"
          type="words"
          className="mb-16 max-w-3xl text-[length:var(--text-4xl)] font-bold leading-tight"
        >
          {aboutData.headline}
        </TextReveal>

        {/* Content grid */}
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left: Portrait placeholder */}
          <RevealOnScroll className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-secondary">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your photo here
                  </p>
                </div>
              </div>
            </div>
            {/* Decorative element */}
            <div className="absolute -right-4 -bottom-4 -z-10 h-full w-full rounded-3xl border border-primary/20" />
          </RevealOnScroll>

          {/* Right: Text content */}
          <div className="flex flex-col justify-center">
            {aboutData.description.map((paragraph, i) => (
              <RevealOnScroll key={i} delay={i * 0.15}>
                <p className="mb-6 text-[length:var(--text-base)] leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              </RevealOnScroll>
            ))}

            {/* Stats */}
            <StaggerChildren className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {aboutData.stats.map((stat) => (
                <AnimatedCounter
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                />
              ))}
            </StaggerChildren>
          </div>
        </div>

        {/* Tech stack */}
        <div className="mt-24">
          <RevealOnScroll>
            <h3 className="mb-8 text-center text-[length:var(--text-xl)] font-semibold">
              Technologies I Work With
            </h3>
          </RevealOnScroll>

          <StaggerChildren className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
            {aboutData.techStack.map((tech) => (
              <span
                key={tech.name}
                className="glass rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:scale-105 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
              >
                {tech.name}
              </span>
            ))}
          </StaggerChildren>
        </div>
      </div>
    </section>
  );
}
