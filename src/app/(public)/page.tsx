import { Hero } from "@/components/sections/Hero"
import { About } from "@/components/sections/About"
import { Projects } from "@/components/sections/Projects"
import { Skills } from "@/components/sections/Skills"
import { Experience } from "@/components/sections/Experience"
import { Blog } from "@/components/sections/Blog"
import { Contact } from "@/components/sections/Contact"
import {
  getSiteConfig,
  getHeroData,
  getAboutData,
  getProjectsData,
  getSkillsData,
  getExperienceData,
  getBlogData,
} from "@/lib/queries"

export default async function Home() {
  const [siteConfig, heroData, aboutData, projectsData, skillsData, experienceData, blogData] =
    await Promise.all([
      getSiteConfig(),
      getHeroData(),
      getAboutData(),
      getProjectsData(),
      getSkillsData(),
      getExperienceData(),
      getBlogData(),
    ])

  return (
    <main>
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
