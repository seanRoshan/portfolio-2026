import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getResumeData, getResumeSkills, getResumeExperience } from "@/lib/queries"
import { ResumePublicView } from "@/components/resume/ResumePublicView"

export const metadata: Metadata = {
  title: "Resume — Alex Rivera",
  description:
    "Professional resume and work experience of Alex Rivera, Senior Full-Stack Developer.",
  openGraph: {
    title: "Resume — Alex Rivera",
    description: "Professional resume and work experience of Alex Rivera.",
  },
}

export default async function ResumePage() {
  const [resume, skills, experience] = await Promise.all([
    getResumeData(),
    getResumeSkills(),
    getResumeExperience(),
  ])

  if (!resume) return notFound()

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="container-wide">
        <ResumePublicView data={resume} skills={skills} experience={experience} />
      </div>
    </main>
  )
}
