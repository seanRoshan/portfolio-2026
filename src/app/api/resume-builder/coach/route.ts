import { NextRequest, NextResponse } from 'next/server'
import { isAIAvailable } from '@/lib/resume-builder/ai/client'
import { coachChat } from '@/lib/resume-builder/ai/services'
import { getResumeWithRelations } from '@/lib/resume-builder/queries'
import type { ResumeWithRelations } from '@/types/resume-builder'

function buildResumeContext(resume: ResumeWithRelations): string {
  const sections: string[] = []

  if (resume.contact_info?.full_name) {
    sections.push(`Name: ${resume.contact_info.full_name}`)
  }

  if (resume.summary?.text) {
    sections.push(`Summary: ${resume.summary.text}`)
  }

  if (resume.work_experiences.length > 0) {
    const experienceLines = resume.work_experiences.map((exp) => {
      const bullets = (exp.achievements ?? [])
        .map((a) => `  - ${a.text}`)
        .join('\n')
      const dateRange = [exp.start_date, exp.end_date ?? 'Present']
        .filter(Boolean)
        .join(' - ')
      return `${exp.job_title} at ${exp.company} (${dateRange})\n${bullets}`
    })
    sections.push(`Work Experience:\n${experienceLines.join('\n\n')}`)
  }

  if (resume.projects.length > 0) {
    const projectLines = resume.projects.map((proj) => {
      const bullets = (proj.achievements ?? [])
        .map((a) => `  - ${a.text}`)
        .join('\n')
      return `${proj.name}${proj.description ? `: ${proj.description}` : ''}\n${bullets}`
    })
    sections.push(`Projects:\n${projectLines.join('\n\n')}`)
  }

  if (resume.skill_categories.length > 0) {
    const skillLines = resume.skill_categories.map(
      (cat) => `${cat.name}: ${cat.skills.join(', ')}`
    )
    sections.push(`Skills:\n${skillLines.join('\n')}`)
  }

  if (resume.education.length > 0) {
    const eduLines = resume.education.map(
      (edu) =>
        `${edu.degree} in ${edu.field_of_study ?? 'N/A'} from ${edu.institution}`
    )
    sections.push(`Education:\n${eduLines.join('\n')}`)
  }

  return sections.join('\n\n')
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAIAvailable()) {
    return NextResponse.json(
      { error: 'AI features require ANTHROPIC_API_KEY to be configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { sessionType, messages, resumeId } = body

    let resumeContext: string | undefined
    if (resumeId) {
      const resume = await getResumeWithRelations(resumeId)
      if (resume) {
        resumeContext = buildResumeContext(resume)
      }
    }

    const response = await coachChat(sessionType, messages, resumeContext)
    return NextResponse.json({ response })
  } catch (error) {
    console.error('Coach API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Coach request failed' },
      { status: 500 }
    )
  }
}
