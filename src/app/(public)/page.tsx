import type { Metadata } from "next"
import { Hero } from "@/components/sections/Hero"
import { About } from "@/components/sections/About"
import { Projects } from "@/components/sections/Projects"
import { Skills } from "@/components/sections/Skills"
import { Experience } from "@/components/sections/Experience"
import { Credentials } from "@/components/sections/Credentials"
import { Ventures } from "@/components/sections/Ventures"
import { Blog } from "@/components/sections/Blog"
import { Contact } from "@/components/sections/Contact"
import { JsonLd } from "@/components/JsonLd"
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
