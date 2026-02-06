"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { TextReveal } from "@/components/animations/TextReveal";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { skillsData } from "@/data/portfolio";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

function SkillBar({ name, level }: { name: string; level: number }) {
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = barRef.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {level}%
        </span>
      </div>
      <div className="skill-bar-bg h-1.5 overflow-hidden rounded-full">
        <div
          ref={barRef}
          className="skill-bar-fill h-full rounded-full origin-left"
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}

export function Skills() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <section id="skills" className="section-padding relative">
      <div className="container-wide">
        <RevealOnScroll>
          <span className="mb-3 block text-sm font-medium uppercase tracking-widest text-primary">
            Skills & Expertise
          </span>
        </RevealOnScroll>

        <TextReveal
          as="h2"
          type="words"
          className="mb-16 max-w-2xl text-[length:var(--text-4xl)] font-bold leading-tight"
        >
          Tools and technologies I master
        </TextReveal>

        {/* Category tabs */}
        <RevealOnScroll className="mb-12">
          <div className="flex flex-wrap gap-2">
            {skillsData.categories.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(i)}
                className={cn(
                  "rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300",
                  activeCategory === i
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-card/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </RevealOnScroll>

        {/* Skills grid */}
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {skillsData.categories[activeCategory].skills.map((skill) => (
              <SkillBar
                key={skill.name}
                name={skill.name}
                level={skill.level}
              />
            ))}
          </div>
        </div>

        {/* Floating tech tags */}
        <RevealOnScroll className="mt-20">
          <div className="flex flex-wrap justify-center gap-3 opacity-40">
            {["Git", "Linux", "Vim", "Figma", "Webpack", "Vite", "Jest", "Cypress", "Playwright", "Storybook"].map(
              (tool) => (
                <span
                  key={tool}
                  className="rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted-foreground"
                >
                  {tool}
                </span>
              )
            )}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
