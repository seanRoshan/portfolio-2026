import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { Hero } from "@/components/sections/Hero"
import { About } from "@/components/sections/About"
import { JsonLd } from "@/components/JsonLd"

// Dynamically import below-the-fold sections to reduce initial JS parse (TBT)
const Ventures = dynamic(() =>
  import("@/components/sections/Ventures").then((m) => ({ default: m.Ventures })),
)
const Projects = dynamic(() =>
  import("@/components/sections/Projects").then((m) => ({ default: m.Projects })),
)
const Skills = dynamic(() =>
  import("@/components/sections/Skills").then((m) => ({ default: m.Skills })),
)
const Experience = dynamic(() =>
  import("@/components/sections/Experience").then((m) => ({ default: m.Experience })),
)
const Credentials = dynamic(() =>
  import("@/components/sections/Credentials").then((m) => ({ default: m.Credentials })),
)
const Blog = dynamic(() => import("@/components/sections/Blog").then((m) => ({ default: m.Blog })))
const Contact = dynamic(() =>
  import("@/components/sections/Contact").then((m) => ({ default: m.Contact })),
)
import { getCachedSiteConfig } from "@/lib/seo"
import { personAndWebsiteJsonLd } from "@/lib/json-ld"
import {
  getSiteConfig,
  getHeroData,
  getAboutData,
  getProjectsData,
  getSkillsData,
  getExperienceData,
  getEducationData,
  getCertificationData,
  getVenturesData,
  getBlogData,
} from "@/lib/queries"

export async function generateMetadata(): Promise<Metadata> {
  const config = await getCachedSiteConfig()
  if (!config) return {}

  return {
    title: { absolute: config.siteTitle },
    alternates: { canonical: config.siteUrl || undefined },
  }
}

export default async function Home() {
  const [
    siteConfig,
    heroData,
    aboutData,
    projectsData,
    skillsData,
    experienceData,
    educationData,
    certificationData,
    venturesData,
    blogData,
    seoConfig,
  ] = await Promise.all([
    getSiteConfig(),
    getHeroData(),
    getAboutData(),
    getProjectsData(),
    getSkillsData(),
    getExperienceData(),
    getEducationData(),
    getCertificationData(),
    getVenturesData(),
    getBlogData(),
    getCachedSiteConfig(),
  ])

  return (
    <main>
      {seoConfig && <JsonLd data={personAndWebsiteJsonLd(seoConfig)} />}
      <Hero heroData={heroData} siteConfig={siteConfig} />
      <About aboutData={aboutData} />
      <Ventures venturesData={venturesData} />
      <Projects projectsData={projectsData} />
      <Skills skillsData={skillsData} />
      <Experience experienceData={experienceData} />
      <Credentials educationData={educationData} certificationData={certificationData} />
      <Blog blogData={blogData} />
      <Contact siteConfig={siteConfig} />
    </main>
  )
}
