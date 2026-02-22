import { NextRequest, NextResponse } from 'next/server'
import {
  rewriteBullet,
  detectCliches,
  generateSummary,
  scoreResume,
  matchJobDescription,
  translateJargon,
  generateCoverLetter,
  analyzeJobDescription,
} from '@/lib/resume-builder/ai/services'
import { isAIAvailable } from '@/lib/resume-builder/ai/client'
import { getResumeWithRelations } from '@/lib/resume-builder/queries'

export async function POST(request: NextRequest) {
  if (!isAIAvailable()) {
    return NextResponse.json(
      { error: 'AI features require ANTHROPIC_API_KEY to be configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'rewrite-bullet': {
        const { bullet, jobTitle, company } = body
        const result = await rewriteBullet(bullet, jobTitle, company)
        return NextResponse.json(result)
      }

      case 'detect-cliches': {
        const { text } = body
        const result = await detectCliches(text)
        return NextResponse.json(result)
      }

      case 'generate-summary': {
        const { resumeId, jobDescription } = body
        const resume = await getResumeWithRelations(resumeId)
        if (!resume) {
          return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
        }
        const summary = await generateSummary(resume, jobDescription)
        return NextResponse.json({ summary })
      }

      case 'score-resume': {
        const { resumeId } = body
        const resume = await getResumeWithRelations(resumeId)
        if (!resume) {
          return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
        }
        const score = await scoreResume(resume)
        return NextResponse.json(score)
      }

      case 'match-jd': {
        const { resumeId, jobDescription } = body
        const resume = await getResumeWithRelations(resumeId)
        if (!resume) {
          return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
        }
        const match = await matchJobDescription(resume, jobDescription)
        return NextResponse.json(match)
      }

      case 'translate-jargon': {
        const { text } = body
        const result = await translateJargon(text)
        return NextResponse.json({ translations: result })
      }

      case 'generate-cover-letter': {
        const { resumeId, company, position, jobDescription, tone } = body
        const resume = await getResumeWithRelations(resumeId)
        if (!resume) {
          return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
        }
        const content = await generateCoverLetter(
          resume,
          company,
          position,
          jobDescription,
          tone
        )
        return NextResponse.json({ content })
      }

      case 'analyze-jd': {
        const { text } = body
        const result = await analyzeJobDescription(text)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI request failed' },
      { status: 500 }
    )
  }
}
