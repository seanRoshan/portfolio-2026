import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  getResumeData,
  getResumeSkills,
  getResumeExperience,
  getResumeEducation,
  getResumeCertifications,
} from "@/lib/queries"
import { getCachedSiteConfig } from "@/lib/seo"
import { profilePageJsonLd } from "@/lib/json-ld"
import { JsonLd } from "@/components/JsonLd"
import { ResumePublicView } from "@/components/resume/ResumePublicView"

export async function generateMetadata(): Promise<Metadata> {
  const config = await getCachedSiteConfig()
  const description = config
    ? `Professional resume and work experience of ${config.name}.`
    : "Professional resume and work experience."

  return {
    title: "Resume",
    description,
    openGraph: {
      title: config ? `Resume — ${config.name}` : "Resume",
      description,
    },
    alternates: { canonical: config ? `${config.siteUrl}/resume` : undefined },
  }
}

export default async function ResumePage() {
  const [resume, skills, experience, education, certifications, config] = await Promise.all([
    getResumeData(),
    getResumeSkills(),
    getResumeExperience(),
    getResumeEducation(),
    getResumeCertifications(),
    getCachedSiteConfig(),
  ])

  if (!resume) return notFound()

  return (
    <main className="min-h-screen pt-24 pb-16">
      {config && <JsonLd data={profilePageJsonLd(config)} />}
      <div className="container-wide">
        <ResumePublicView
          data={resume}
          skills={skills}
          experience={experience}
          education={education}
          certifications={certifications}
        />
      </div>
    </main>
  )
}
