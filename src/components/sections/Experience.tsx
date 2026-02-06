"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { TextReveal } from "@/components/animations/TextReveal";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { experienceData } from "@/data/portfolio";

gsap.registerPlugin(ScrollTrigger);

function TimelineEntry({
  entry,
  index,
}: {
  entry: (typeof experienceData)[0];
  index: number;
}) {
  const isLeft = index % 2 === 0;

  return (
    <div
      className={`timeline-entry relative flex gap-8 md:gap-0 ${
        isLeft ? "md:flex-row" : "md:flex-row-reverse"
      }`}
      style={{ opacity: 0 }}
    >
      {/* Content */}
      <div className={`flex-1 md:px-8 ${isLeft ? "md:text-right" : "md:text-left"}`}>
        <div
          className={`glass inline-block rounded-2xl p-6 text-left transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5`}
        >
          <span className="mb-1 block text-xs font-medium text-primary">
            {entry.period}
          </span>
          <h3 className="mb-1 text-[length:var(--text-xl)] font-semibold">
            {entry.role}
          </h3>
          <a
            href={entry.companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 inline-block text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {entry.company}
          </a>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            {entry.description}
          </p>
          <ul className="space-y-1.5">
            {entry.achievements.map((achievement, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                {achievement}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Timeline dot */}
      <div className="absolute left-0 top-0 flex h-full flex-col items-center md:left-1/2 md:-translate-x-1/2">
        <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
      </div>

      {/* Empty space for alternating layout */}
      <div className="hidden flex-1 md:block" />
    </div>
  );
}

export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const entries = gsap.utils.toArray<HTMLElement>(".timeline-entry");

      entries.forEach((entry, i) => {
        const isLeft = i % 2 === 0;
        gsap.fromTo(
          entry,
          { opacity: 0, x: isLeft ? -40 : 40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: entry,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Animate the timeline line
      gsap.fromTo(
        ".timeline-line",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 40%",
            scrub: 1,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="section-padding relative"
    >
      <div className="container-wide">
        <RevealOnScroll>
          <span className="mb-3 block text-sm font-medium uppercase tracking-widest text-primary">
            Career Journey
          </span>
        </RevealOnScroll>

        <TextReveal
          as="h2"
          type="words"
          className="mb-16 max-w-2xl text-[length:var(--text-4xl)] font-bold leading-tight"
        >
          Where I have been and what I have built
        </TextReveal>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-0 top-0 hidden h-full w-px md:left-1/2 md:block">
            <div className="timeline-line h-full w-full origin-top bg-gradient-to-b from-primary via-primary/50 to-transparent" />
          </div>

          {/* Mobile line */}
          <div className="absolute left-[7px] top-0 h-full w-px bg-border md:hidden" />

          <div className="space-y-12 pl-8 md:space-y-16 md:pl-0">
            {experienceData.map((entry, i) => (
              <TimelineEntry key={entry.company} entry={entry} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
