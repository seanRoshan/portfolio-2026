import { getAnthropicClient } from './client'
import type {
  AIRewriteResponse,
  ResumeScore,
  ResumeScoreDimension,
  JDMatchResult,
  ResumeWithRelations,
} from '@/types/resume-builder'
import {
  BUZZWORDS as CAREER_COACH_BUZZWORDS,
  WEAK_VERBS as CAREER_COACH_WEAK_VERBS,
  STRONG_VERBS as CAREER_COACH_STRONG_VERBS,
  hasMetricInText,
} from '@/lib/resume-builder/validation/rules'

async function callClaude(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const client = getAnthropicClient()
  if (!client) throw new Error('AI not available: ANTHROPIC_API_KEY not set')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock?.text ?? ''
}

// ===== Bullet Point Rewriter =====
export async function rewriteBullet(
  bullet: string,
  jobTitle: string,
  company: string
): Promise<AIRewriteResponse> {
  const system = `You are a resume writing expert. Rewrite resume bullet points to follow the XYZ formula:
"Accomplished [X impact] as measured by [Y metric] by doing [Z action]"

Requirements:
- Start with a strong action verb (Led, Built, Improved, etc.)
- Include at least one quantifiable metric
- Be specific about technologies used
- Max 2 lines (under 150 characters)
- No buzzwords or clichés

Respond in JSON format: { "rewritten": "...", "improvements": ["..."] }`

  const result = await callClaude(
    system,
    `Original bullet: "${bullet}"\nRole: ${jobTitle} at ${company}\n\nRewrite this bullet point.`
  )

  try {
    const parsed = JSON.parse(result)
    return {
      original: bullet,
      rewritten: parsed.rewritten,
      improvements: parsed.improvements ?? [],
    }
  } catch {
    // If JSON parsing fails, treat the response as the rewritten text
    return {
      original: bullet,
      rewritten: result.trim(),
      improvements: ['Rewritten using XYZ formula'],
    }
  }
}

// ===== Cliche Detector =====
export async function detectCliches(
  text: string
): Promise<{ cliches: Array<{ phrase: string; suggestion: string }> }> {
  const system = `You are a resume writing expert. Detect clichés, buzzwords, and weak language in resume text.
For each issue found, suggest a specific, actionable alternative.

Respond in JSON: { "cliches": [{ "phrase": "found phrase", "suggestion": "do this instead" }] }`

  const result = await callClaude(
    system,
    `Analyze this resume text for clichés and buzzwords:\n\n"${text}"`
  )

  try {
    return JSON.parse(result)
  } catch {
    return { cliches: [] }
  }
}

// ===== Summary Generator =====
export async function generateSummary(
  resume: ResumeWithRelations,
  targetJobDescription?: string
): Promise<string> {
  const system = `You are a resume writing expert. Generate a professional summary (2-3 sentences max) for a tech professional.
The summary should:
- Highlight years of experience and key technical skills
- Mention impact and career trajectory
- If a target job description is provided, tailor the summary to match
- Be concise, confident, and specific
- No buzzwords or clichés

Respond with ONLY the summary text, no quotes or formatting.`

  const experienceYears = resume.work_experiences.length > 0
    ? Math.max(
        ...resume.work_experiences.map((e) => {
          const start = e.start_date ? new Date(e.start_date).getFullYear() : new Date().getFullYear()
          const end = e.end_date ? new Date(e.end_date).getFullYear() : new Date().getFullYear()
          return end - start
        })
      )
    : 0

  const allSkills = resume.skill_categories.flatMap((c) => c.skills)
  const companies = resume.work_experiences.map((e) => e.company).filter(Boolean)
  const titles = resume.work_experiences.map((e) => e.job_title).filter(Boolean)

  let userMsg = `Generate a professional summary for:
- Name: ${resume.contact_info?.full_name}
- Experience Level: ${resume.experience_level ?? 'mid'}
- Approximate years: ${experienceYears}+
- Key skills: ${allSkills.slice(0, 15).join(', ')}
- Companies: ${companies.slice(0, 5).join(', ')}
- Recent titles: ${titles.slice(0, 3).join(', ')}`

  if (targetJobDescription) {
    userMsg += `\n\nTarget job description:\n${targetJobDescription.slice(0, 1000)}`
  }

  return await callClaude(system, userMsg)
}

// ===== Resume Scorer =====

// Use the comprehensive career coach lists from the validation rules module
// as the single source of truth for buzzwords, weak verbs, and strong verbs.
const BUZZWORDS = CAREER_COACH_BUZZWORDS
const STRONG_ACTION_VERBS = CAREER_COACH_STRONG_VERBS

function computeGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export function scoreResume(
  resume: ResumeWithRelations
): ResumeScore {
  const allBullets = [
    ...resume.work_experiences.flatMap((e) => e.achievements ?? []),
    ...resume.projects.flatMap((p) => p.achievements ?? []),
  ]
  const totalBullets = allBullets.length
  const dimensions: ResumeScoreDimension[] = []

  // === 1. Content Completeness (20%) ===
  const allSections = [
    { name: 'Contact', filled: !!resume.contact_info?.full_name },
    { name: 'Summary', filled: !!(resume.summary?.text && resume.summary.text.length > 0) },
    { name: 'Experience', filled: resume.work_experiences.length > 0 },
    { name: 'Education', filled: resume.education.length > 0 },
    { name: 'Skills', filled: resume.skill_categories.length > 0 },
    { name: 'Projects', filled: resume.projects.length > 0 },
    { name: 'Certifications', filled: resume.certifications.length > 0 },
    { name: 'Extracurriculars', filled: resume.extracurriculars.length > 0 },
  ]
  const filledCount = allSections.filter((s) => s.filled).length
  const totalSections = allSections.length

  const experiencesWithFewBullets = resume.work_experiences.filter(
    (e) => (e.achievements?.length ?? 0) < 3
  )
  const hasSummary = !!(resume.summary?.text && resume.summary.text.length >= 20)

  const completenessDeductions: string[] = []
  if (!hasSummary) completenessDeductions.push('Summary is missing or too short')
  if (experiencesWithFewBullets.length > 0) {
    completenessDeductions.push(
      `${experiencesWithFewBullets.length} experience${experiencesWithFewBullets.length > 1 ? 's' : ''} ha${experiencesWithFewBullets.length > 1 ? 've' : 's'} fewer than 3 bullets`
    )
  }

  const completenessScore = Math.round(
    (filledCount / totalSections) * 70 +
    (hasSummary ? 15 : 0) +
    (experiencesWithFewBullets.length === 0 && resume.work_experiences.length > 0 ? 15 : 0)
  )

  dimensions.push({
    name: 'Content Completeness',
    score: Math.min(completenessScore, 100),
    weight: 0.20,
    feedback: `${filledCount} of ${totalSections} sections populated`,
    suggestions: completenessDeductions,
  })

  // === 2. Metric Coverage (20%) — uses XYZ formula check ===
  const bulletsWithMetrics = allBullets.filter((b) =>
    hasMetricInText(b.text)
  ).length
  const metricScore = totalBullets > 0
    ? Math.round((bulletsWithMetrics / totalBullets) * 100)
    : 0

  const metricSuggestions: string[] = []
  if (totalBullets > 0 && bulletsWithMetrics < totalBullets) {
    const missing = totalBullets - bulletsWithMetrics
    metricSuggestions.push(
      `${missing} bullet${missing > 1 ? 's lack' : ' lacks'} quantifiable metrics (XYZ formula: Accomplished [X] as measured by [Y] by doing [Z])`
    )
  }
  if (totalBullets === 0) {
    metricSuggestions.push('Add achievement bullets to your experiences and projects')
  }

  dimensions.push({
    name: 'Metric Coverage',
    score: metricScore,
    weight: 0.20,
    feedback: `${bulletsWithMetrics} of ${totalBullets} bullets include quantifiable metrics`,
    suggestions: metricSuggestions,
  })

  // === 3. Action Verb Quality (15%) — enhanced with weak verb detection ===
  const bulletsWithStrongVerbs = allBullets.filter((b) => {
    const firstWord = b.text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
    return STRONG_ACTION_VERBS.has(firstWord ?? '')
  }).length
  const bulletsWithWeakVerbs = allBullets.filter((b) => {
    const firstWord = b.text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
    return CAREER_COACH_WEAK_VERBS.has(firstWord ?? '')
  }).length
  // Penalize weak verbs more heavily than just missing strong verbs
  const verbScore = totalBullets > 0
    ? Math.max(0, Math.round(
        ((bulletsWithStrongVerbs / totalBullets) * 100) -
        (bulletsWithWeakVerbs * 10)
      ))
    : 0

  const verbSuggestions: string[] = []
  if (totalBullets > 0 && bulletsWithStrongVerbs < totalBullets) {
    const nonStrong = totalBullets - bulletsWithStrongVerbs
    verbSuggestions.push(
      `${nonStrong} bullet${nonStrong > 1 ? 's' : ''} could start with stronger action verbs (Led, Built, Improved, etc.)`
    )
  }
  if (bulletsWithWeakVerbs > 0) {
    verbSuggestions.push(
      `${bulletsWithWeakVerbs} bullet${bulletsWithWeakVerbs > 1 ? 's start' : ' starts'} with a weak verb (was, did, used, worked, helped). Replace with impactful verbs.`
    )
  }

  dimensions.push({
    name: 'Action Verb Quality',
    score: Math.min(verbScore, 100),
    weight: 0.15,
    feedback: `${bulletsWithStrongVerbs} of ${totalBullets} bullets start with strong action verbs${bulletsWithWeakVerbs > 0 ? ` (${bulletsWithWeakVerbs} start with weak verbs)` : ''}`,
    suggestions: verbSuggestions,
  })

  // === 4. Buzzword-Free (15%) ===
  const allText = [
    resume.summary?.text ?? '',
    ...allBullets.map((b) => b.text),
  ].join(' ').toLowerCase()

  const foundBuzzwords = BUZZWORDS.filter((bw) => allText.includes(bw))
  const buzzwordScore = foundBuzzwords.length === 0
    ? 100
    : Math.max(0, 100 - foundBuzzwords.length * 20)

  const buzzSuggestions: string[] = []
  if (foundBuzzwords.length > 0) {
    buzzSuggestions.push(
      `Replace buzzwords with specific, measurable descriptions`
    )
  }

  dimensions.push({
    name: 'Buzzword-Free',
    score: buzzwordScore,
    weight: 0.15,
    feedback: foundBuzzwords.length === 0
      ? 'No buzzwords detected'
      : `Found ${foundBuzzwords.length} buzzword${foundBuzzwords.length > 1 ? 's' : ''}: ${foundBuzzwords.map((b) => "'" + b + "'").join(', ')}`,
    suggestions: buzzSuggestions,
  })

  // === 5. Length Appropriateness (10%) ===
  const totalChars = allBullets.reduce((sum, b) => sum + b.text.length, 0) +
    (resume.summary?.text?.length ?? 0) +
    resume.skill_categories.reduce((sum, c) => sum + c.skills.join(', ').length, 0) +
    resume.education.reduce((sum, e) => sum + (e.degree?.length ?? 0) + (e.institution?.length ?? 0), 0)

  const pageLimit = resume.settings?.page_limit ?? 1
  // Rough estimate: ~2500 chars per page of a resume
  const expectedMaxChars = pageLimit * 2500
  const expectedMinChars = pageLimit * 800

  let lengthScore: number
  let lengthFeedback: string
  const lengthSuggestions: string[] = []

  if (totalChars < expectedMinChars) {
    lengthScore = Math.round((totalChars / expectedMinChars) * 60)
    lengthFeedback = `Content is thin for a ${pageLimit}-page resume`
    lengthSuggestions.push('Add more detail to experiences and projects to fill the page')
  } else if (totalChars > expectedMaxChars * 1.3) {
    lengthScore = Math.max(30, 100 - Math.round(((totalChars - expectedMaxChars) / expectedMaxChars) * 100))
    lengthFeedback = `Content may overflow a ${pageLimit}-page resume`
    lengthSuggestions.push('Trim bullet points or increase page limit to fit content')
  } else {
    lengthScore = 100
    lengthFeedback = `Content length appropriate for ${pageLimit}-page resume`
  }

  dimensions.push({
    name: 'Length Appropriateness',
    score: Math.min(lengthScore, 100),
    weight: 0.10,
    feedback: lengthFeedback,
    suggestions: lengthSuggestions,
  })

  // === 6. Section Balance (10%) ===
  const sectionCharCounts: Record<string, number> = {
    Experience: resume.work_experiences.reduce(
      (sum, e) => sum + (e.achievements ?? []).reduce((s, a) => s + a.text.length, 0), 0
    ),
    Projects: resume.projects.reduce(
      (sum, p) => sum + (p.description?.length ?? 0) + (p.achievements ?? []).reduce((s, a) => s + a.text.length, 0), 0
    ),
    Skills: resume.skill_categories.reduce((sum, c) => sum + c.skills.join(', ').length, 0),
    Education: resume.education.reduce(
      (sum, e) => sum + (e.degree?.length ?? 0) + (e.institution?.length ?? 0) + (e.honors?.length ?? 0), 0
    ),
    Summary: resume.summary?.text?.length ?? 0,
  }

  const totalContentChars = Object.values(sectionCharCounts).reduce((a, b) => a + b, 0)
  let balanceScore = 100
  const balanceSuggestions: string[] = []
  let balanceFeedback = 'Section content is well balanced'

  if (totalContentChars > 0) {
    for (const [section, chars] of Object.entries(sectionCharCounts)) {
      const pct = Math.round((chars / totalContentChars) * 100)
      if (pct > 75) {
        balanceScore = Math.max(30, 100 - (pct - 60))
        balanceFeedback = `${section} section has ${pct}% of content — consider balancing`
        balanceSuggestions.push(`Expand other sections or trim ${section} content`)
        break
      }
    }
  }

  dimensions.push({
    name: 'Section Balance',
    score: balanceScore,
    weight: 0.10,
    feedback: balanceFeedback,
    suggestions: balanceSuggestions,
  })

  // === 7. Formatting (10%) ===
  const dates = resume.work_experiences
    .flatMap((e) => [e.start_date, e.end_date])
    .filter(Boolean) as string[]

  let formattingScore = 100
  let formattingFeedback = 'All dates use consistent format'
  const formattingSuggestions: string[] = []

  // Check for empty visible sections
  const hiddenSet = new Set(resume.settings?.hidden_sections ?? [])
  const sectionOrder = resume.settings?.section_order ?? []
  const emptyVisibleSections: string[] = []

  for (const section of sectionOrder) {
    if (hiddenSet.has(section)) continue
    const isEmpty =
      (section === 'experience' && resume.work_experiences.length === 0) ||
      (section === 'skills' && resume.skill_categories.length === 0) ||
      (section === 'education' && resume.education.length === 0) ||
      (section === 'projects' && resume.projects.length === 0) ||
      (section === 'certifications' && resume.certifications.length === 0) ||
      (section === 'extracurriculars' && resume.extracurriculars.length === 0) ||
      (section === 'summary' && !resume.summary?.text)
    if (isEmpty) emptyVisibleSections.push(section)
  }

  if (emptyVisibleSections.length > 0) {
    formattingScore -= emptyVisibleSections.length * 15
    formattingSuggestions.push(
      `${emptyVisibleSections.length} visible section${emptyVisibleSections.length > 1 ? 's are' : ' is'} empty: ${emptyVisibleSections.join(', ')}`
    )
  }

  // Check date consistency (all should parse as valid dates)
  const invalidDates = dates.filter((d) => isNaN(new Date(d).getTime()))
  if (invalidDates.length > 0) {
    formattingScore -= 20
    formattingFeedback = `${invalidDates.length} date${invalidDates.length > 1 ? 's' : ''} may have formatting issues`
    formattingSuggestions.push('Review date formatting for consistency')
  }

  dimensions.push({
    name: 'Formatting',
    score: Math.max(0, Math.min(formattingScore, 100)),
    weight: 0.10,
    feedback: formattingFeedback,
    suggestions: formattingSuggestions,
  })

  // === Calculate Overall Score ===
  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
  )

  return {
    overall,
    dimensions,
    grade: computeGrade(overall),
  }
}
// ===== Job Description Matcher =====
export async function matchJobDescription(
  resume: ResumeWithRelations,
  jobDescription: string
): Promise<JDMatchResult> {
  const system = `You are a resume optimization expert. Analyze a job description against a resume and provide matching insights.

Respond in JSON format:
{
  "matchRate": <number 0-100>,
  "presentKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["missing1", "missing2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "reorderSuggestions": ["reorder1"]
}`

  const allSkills = resume.skill_categories.flatMap((c) => c.skills)
  const allBullets = resume.work_experiences.flatMap((e) =>
    (e.achievements ?? []).map((a) => a.text)
  )

  const userMsg = `Job Description:\n${jobDescription.slice(0, 2000)}

Resume Skills: ${allSkills.join(', ')}

Resume Bullet Points:
${allBullets.slice(0, 10).join('\n')}

Analyze the match between this job description and resume.`

  const result = await callClaude(system, userMsg)

  try {
    return JSON.parse(result)
  } catch {
    return {
      matchRate: 0,
      presentKeywords: [],
      missingKeywords: [],
      suggestions: ['Unable to parse AI response'],
      reorderSuggestions: [],
    }
  }
}

// ===== Jargon Translator =====
export async function translateJargon(
  text: string
): Promise<{ original: string; translated: string }[]> {
  const system = `You are a resume writing expert. Find internal project names, acronyms, and jargon in resume text and suggest generic descriptions that recruiters can understand.

Respond in JSON: [{ "original": "Project Phoenix", "translated": "a company-wide platform migration initiative" }]`

  const result = await callClaude(
    system,
    `Find jargon in this text and suggest generic replacements:\n\n"${text}"`
  )

  try {
    return JSON.parse(result)
  } catch {
    return []
  }
}

// ===== Cover Letter Generator =====
export async function generateCoverLetter(
  resume: ResumeWithRelations,
  company: string,
  position: string,
  jobDescription?: string,
  tone: string = 'professional'
): Promise<string> {
  const system = `You are a cover letter writing expert. Write a personalized cover letter following the company-first approach:
1. Show genuine interest in the company before talking about yourself
2. Be specific about why this company and this role
3. Connect your experience to their needs
4. Tone: ${tone}, sincere, bold
5. Keep it to 3-4 short paragraphs
6. No generic templates or filler

Respond with ONLY the cover letter text.`

  const allSkills = resume.skill_categories.flatMap((c) => c.skills)
  const recentExp = resume.work_experiences.slice(0, 3)

  let userMsg = `Write a cover letter for:
- Applicant: ${resume.contact_info?.full_name}
- Company: ${company}
- Position: ${position}
- Key Skills: ${allSkills.slice(0, 10).join(', ')}
- Recent Experience:
${recentExp.map((e) => `  - ${e.job_title} at ${e.company}`).join('\n')}`

  if (jobDescription) {
    userMsg += `\n\nJob Description:\n${jobDescription.slice(0, 1500)}`
  }

  return await callClaude(system, userMsg)
}

// ===== Career Coach =====
export async function coachChat(
  sessionType: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  resumeContext?: string
): Promise<string> {
  const systemPrompts: Record<string, string> = {
    general: `You are an expert career coach for software engineers. Help the user with their career questions. Be specific, actionable, and encouraging.`,
    experience_builder: `You are an expert career coach helping the user document their work experience.
Ask specific questions to extract achievements:
- "How many users did this serve?"
- "By what percentage did this improve performance?"
- "How much revenue/cost was involved?"
- "What was the before/after measurement?"

After gathering enough info, generate XYZ-formula bullet points they can add to their resume.
Respond in a conversational tone but be structured in your questioning.`,
    project_builder: `You are an expert career coach helping document projects for a resume.
Ask about: tech stack, user impact, metrics, challenges solved.
Generate project descriptions and achievement bullets.`,
    interview_prep: `You are an expert interview coach. Use the STAR method to help practice behavioral questions.
Draw from the user's resume experience to create personalized practice questions and feedback.`,
    career_narrative: `You are an expert career coach helping build a cohesive career narrative.
Help the user connect their experiences into a compelling story of growth.
Generate a professional summary that ties everything together.`,
  }

  const system = systemPrompts[sessionType] ?? systemPrompts.general
  const fullSystem = resumeContext
    ? `${system}\n\nUser's resume context:\n${resumeContext}`
    : system

  const client = getAnthropicClient()
  if (!client) throw new Error('AI not available')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: fullSystem,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock?.text ?? ''
}

// ===== JD Analyzer =====
export async function analyzeJobDescription(
  rawText: string
): Promise<{
  skills: string[]
  requirements: string[]
  qualifications: string[]
  experienceLevel: string
  redFlags: string[]
  summary: string
}> {
  const system = `You are an expert at analyzing job descriptions. Extract structured information.

Respond in JSON:
{
  "skills": ["skill1", "skill2"],
  "requirements": ["req1", "req2"],
  "qualifications": ["qual1", "qual2"],
  "experienceLevel": "senior",
  "redFlags": ["flag1"],
  "summary": "Brief 2-sentence summary of what they're looking for"
}`

  const result = await callClaude(
    system,
    `Analyze this job description:\n\n${rawText.slice(0, 3000)}`
  )

  try {
    return JSON.parse(result)
  } catch {
    return {
      skills: [],
      requirements: [],
      qualifications: [],
      experienceLevel: 'unknown',
      redFlags: [],
      summary: 'Unable to parse analysis',
    }
  }
}
