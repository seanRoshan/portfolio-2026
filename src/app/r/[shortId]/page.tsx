import { cache } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getResumeByShortId, getResumeWithRelations } from "@/lib/resume-builder/queries"
import { googleFontUrl } from "@/lib/resume-builder/fonts"
import { PragmaticTemplate } from "@/components/resume-builder/templates/PragmaticTemplate"
import { MonoTemplate } from "@/components/resume-builder/templates/MonoTemplate"
import { SmarkdownTemplate } from "@/components/resume-builder/templates/SmarkdownTemplate"
import { CareerCupTemplate } from "@/components/resume-builder/templates/CareerCupTemplate"
import { ParkerTemplate } from "@/components/resume-builder/templates/ParkerTemplate"
import { ExperiencedTemplate } from "@/components/resume-builder/templates/ExperiencedTemplate"
import { TEMPLATE_IDS } from "@/components/resume-builder/templates/shared"
import type { ResumeWithRelations } from "@/types/resume-builder"
import { ResumeToolbar } from "./toolbar"

const templateMap: Record<string, React.ComponentType<{ resume: ResumeWithRelations }>> = {
  [TEMPLATE_IDS.pragmatic]: PragmaticTemplate,
  [TEMPLATE_IDS.mono]: MonoTemplate,
  [TEMPLATE_IDS.smarkdown]: SmarkdownTemplate,
  [TEMPLATE_IDS.careercup]: CareerCupTemplate,
  [TEMPLATE_IDS.parker]: ParkerTemplate,
  [TEMPLATE_IDS.experienced]: ExperiencedTemplate,
}

// Deduplicate data fetching between generateMetadata and page component
const getSharedResume = cache(async (shortId: string) => {
  const resume = await getResumeByShortId(shortId)
  if (!resume) return null
  return getResumeWithRelations(resume.id)
})

interface PageProps {
  params: Promise<{ shortId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shortId } = await params
  if (!/^[a-zA-Z0-9_-]{4,20}$/.test(shortId)) {
    return { title: "Resume Not Found" }
  }

  const full = await getSharedResume(shortId)
  if (!full) return { title: "Resume Not Found" }

  const name = full.contact_info?.full_name
  const title = name ? `${name} — Resume` : `${full.title} — Resume`
  const description =
    name && full.target_role ? `${name} — ${full.target_role}` : name || full.title

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    robots: { index: false, follow: false },
  }
}

export default async function ShareableResumePage({ params }: PageProps) {
  const { shortId } = await params
  if (!/^[a-zA-Z0-9_-]{4,20}$/.test(shortId)) notFound()

  const full = await getSharedResume(shortId)
  if (!full) notFound()

  const TemplateComponent = templateMap[full.template_id ?? ""] ?? PragmaticTemplate
  const fontFamily = full.settings?.font_family ?? "Inter"
  const fontUrl = googleFontUrl(fontFamily)

  return (
    <>
      <link rel="stylesheet" href={fontUrl} />
      <div className="min-h-screen bg-gray-100 print:bg-white">
        <ResumeToolbar resumeId={full.id} />
        <main className="mx-auto min-h-[11in] w-[8.5in] bg-white shadow-lg print:shadow-none">
          <TemplateComponent resume={full} />
        </main>
      </div>
    </>
  )
}
