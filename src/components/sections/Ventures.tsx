"use client"

import Image from "next/image"
import { motion } from "motion/react"
import { ExternalLink, Rocket } from "lucide-react"
import { TextReveal } from "@/components/animations/TextReveal"
import { RevealOnScroll } from "@/components/animations/RevealOnScroll"

interface VentureItem {
  name: string
  role: string
  url: string | null
  iconUrl: string | null
  iconUrlDark: string | null
  foundedYear: string | null
}

interface VenturesProps {
  venturesData: VentureItem[]
}

export function Ventures({ venturesData }: VenturesProps) {
  if (venturesData.length === 0) return null

  return (
    <section id="ventures" className="section-padding relative">
      <div className="container-wide">
        <div className="mx-auto max-w-2xl text-center">
          <RevealOnScroll>
            <span className="text-primary mb-3 block text-sm font-medium tracking-widest uppercase">
              Ventures
            </span>
          </RevealOnScroll>

          <TextReveal
            as="h2"
            type="words"
            className="mb-6 text-(length:--text-4xl) leading-tight font-bold"
          >
            Built, launched, learned
          </TextReveal>

          <RevealOnScroll delay={0.2}>
            <p className="text-muted-foreground mb-12">
              What I have shipped on my own terms.
            </p>
          </RevealOnScroll>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {venturesData.map((venture, index) => {
            const CardContent = (
              <motion.div
                key={venture.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
                className="group"
              >
                <div className="glass hover:border-primary/20 hover:shadow-primary/5 flex flex-col items-center rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  {/* Logo — fixed bounding box, theme-aware */}
                  <div className="mb-4 flex h-20 w-full items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    {venture.iconUrl && venture.iconUrlDark ? (
                      <>
                        <div className="dark:hidden">
                          <Image
                            src={venture.iconUrl}
                            alt={venture.name}
                            width={280}
                            height={80}
                            className="max-h-20 max-w-full object-contain"
                            unoptimized
                          />
                        </div>
                        <div className="hidden dark:block">
                          <Image
                            src={venture.iconUrlDark}
                            alt={venture.name}
                            width={280}
                            height={80}
                            className="max-h-20 max-w-full object-contain"
                            unoptimized
                          />
                        </div>
                      </>
                    ) : (venture.iconUrl || venture.iconUrlDark) ? (
                      <Image
                        src={(venture.iconUrl || venture.iconUrlDark)!}
                        alt={venture.name}
                        width={280}
                        height={80}
                        className="max-h-20 max-w-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-2xl">
                        <Rocket className="text-primary h-10 w-10" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="mb-1 text-base font-semibold">
                    {venture.name}
                    {venture.url && (
                      <ExternalLink className="text-muted-foreground ml-1.5 inline h-3.5 w-3.5 transition-colors group-hover:text-current" />
                    )}
                  </h3>

                  {/* Role badge */}
                  <span className="text-primary/80 bg-primary/10 mb-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium">
                    {venture.role}
                  </span>

                  {/* Founded year */}
                  {venture.foundedYear && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Est. {venture.foundedYear}
                    </p>
                  )}
                </div>
              </motion.div>
            )

            if (venture.url) {
              return (
                <a
                  key={venture.name}
                  href={venture.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {CardContent}
                </a>
              )
            }

            return CardContent
          })}
        </div>
      </div>
    </section>
  )
}
