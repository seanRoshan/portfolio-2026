import { Navigation } from "@/components/Navigation"
import { CustomCursor } from "@/components/CustomCursor"
import { ScrollProgress } from "@/components/ScrollProgress"
import { Hero } from "@/components/sections/Hero"
import { About } from "@/components/sections/About"
import { Projects } from "@/components/sections/Projects"
import { Skills } from "@/components/sections/Skills"
import { Experience } from "@/components/sections/Experience"
import { Blog } from "@/components/sections/Blog"
import { Contact } from "@/components/sections/Contact"
import { Footer } from "@/components/sections/Footer"
import {
  getSiteConfig,
  getHeroData,
  getAboutData,
  getProjectsData,
  getSkillsData,
  getExperienceData,
  getBlogData,
  getNavLinks,
} from "@/lib/queries"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const [
    siteConfig,
    heroData,
    aboutData,
    projectsData,
    skillsData,
    experienceData,
    blogData,
    navLinks,
    supabase,
  ] = await Promise.all([
    getSiteConfig(),
    getHeroData(),
    getAboutData(),
    getProjectsData(),
    getSkillsData(),
    getExperienceData(),
    getBlogData(),
    getNavLinks(),
    createClient(),
  ])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="noise-overlay relative">
      <CustomCursor />
      <ScrollProgress />
      <Navigation navLinks={navLinks} siteConfig={siteConfig} isAuthenticated={!!user} />
      <main>
        <Hero heroData={heroData} siteConfig={siteConfig} />
        <About aboutData={aboutData} />
        <Projects projectsData={projectsData} />
        <Skills skillsData={skillsData} />
        <Experience experienceData={experienceData} />
        <Blog blogData={blogData} />
        <Contact siteConfig={siteConfig} />
      </main>
      <Footer siteConfig={siteConfig} navLinks={navLinks} />
    </div>
  )
}
