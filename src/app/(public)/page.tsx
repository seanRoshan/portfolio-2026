import type { Metadata } from "next"
import { Hero } from "@/components/sections/Hero"
import { About } from "@/components/sections/About"
import { Projects } from "@/components/sections/Projects"
import { Skills } from "@/components/sections/Skills"
import { Experience } from "@/components/sections/Experience"
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
  getBlogData,
} from "@/lib/queries"

export async function generateMetadata(): Promise<Metadata> {
  const config = await getCachedSiteConfig()
  if (!config) return {}

  return {
    title: { absolute: config.siteTitle },
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
    blogData,
    seoConfig,
  ] = await Promise.all([
    getSiteConfig(),
    getHeroData(),
    getAboutData(),
    getProjectsData(),
    getSkillsData(),
    getExperienceData(),
    getBlogData(),
    getCachedSiteConfig(),
  ])

  return (
    <main>
      {seoConfig && <JsonLd data={personAndWebsiteJsonLd(seoConfig)} />}
      <Hero heroData={heroData} siteConfig={siteConfig} />
      <About
        aboutData={aboutData}
        allSkills={
          skillsData?.categories.flatMap((cat) =>
            cat.skills.map((s) => ({ name: s.name, iconName: s.iconName })),
          ) ?? []
        }
      />
      <Projects projectsData={projectsData} />
      <Skills skillsData={skillsData} />
      <Experience experienceData={experienceData} />
      <Blog blogData={blogData} />
      <Contact siteConfig={siteConfig} />
    </main>
  )
}
