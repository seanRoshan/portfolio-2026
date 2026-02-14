import { getAnthropicClient } from './client'
import type {
  AIRewriteResponse,
  ResumeScore,
  JDMatchResult,
  ResumeWithRelations,
} from '@/types/resume-builder'

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
export async function scoreResume(
  resume: ResumeWithRelations
): Promise<ResumeScore> {
  // Calculate scores locally for speed (AI would be too slow for real-time)
  const allBullets = [
    ...resume.work_experiences.flatMap((e) => e.achievements ?? []),
    ...resume.projects.flatMap((p) => p.achievements ?? []),
  ]

  const totalBullets = allBullets.length
  const bulletsWithMetrics = allBullets.filter((b) => /\d+/.test(b.text)).length

  const strongVerbs = new Set([
    'led', 'built', 'designed', 'implemented', 'improved', 'optimized',
    'developed', 'created', 'launched', 'architected', 'managed', 'reduced',
    'increased', 'automated', 'streamlined', 'delivered', 'deployed',
    'migrated', 'scaled', 'drove', 'spearheaded', 'championed',
  ])
  const bulletsWithVerbs = allBullets.filter((b) => {
    const firstWord = b.text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
    return strongVerbs.has(firstWord ?? '')
  }).length

  const metricScore = totalBullets > 0 ? Math.round((bulletsWithMetrics / totalBullets) * 100) : 0
  const verbScore = totalBullets > 0 ? Math.round((bulletsWithVerbs / totalBullets) * 100) : 0

  // Section completeness
  const requiredSections = ['contact', 'experience', 'skills']
  const filledSections = [
    resume.contact_info?.full_name ? 'contact' : null,
    resume.work_experiences.length > 0 ? 'experience' : null,
    resume.skill_categories.length > 0 ? 'skills' : null,
    resume.education.length > 0 ? 'education' : null,
    resume.summary?.text ? 'summary' : null,
  ].filter(Boolean)
  const completenessScore = Math.round(
    (filledSections.length / Math.max(requiredSections.length + 2, 1)) * 100
  )

  // Conciseness (page estimate)
  const totalChars = allBullets.reduce((sum, b) => sum + b.text.length, 0) +
    (resume.summary?.text?.length ?? 0)
  const concisenessScore = totalChars < 3000 ? 100 : totalChars < 5000 ? 75 : 50

  const overall = Math.round(
    metricScore * 0.25 +
    verbScore * 0.20 +
    100 * 0.15 + // formatting always 100 (we enforce it)
    completenessScore * 0.15 +
    75 * 0.15 + // keyword relevance placeholder
    concisenessScore * 0.10
  )

  return {
    overall,
    dimensions: {
      metricCoverage: {
        score: metricScore,
        weight: 0.25,
        details: `${bulletsWithMetrics}/${totalBullets} bullets have metrics`,
      },
      activeLanguage: {
        score: verbScore,
        weight: 0.20,
        details: `${bulletsWithVerbs}/${totalBullets} bullets start with strong verbs`,
      },
      formattingConsistency: {
        score: 100,
        weight: 0.15,
        details: 'Template enforces consistent formatting',
      },
      sectionCompleteness: {
        score: completenessScore,
        weight: 0.15,
        details: `${filledSections.length}/5 sections filled`,
      },
      keywordRelevance: {
        score: 75,
        weight: 0.15,
        details: 'Add a job description to calculate keyword match',
      },
      conciseness: {
        score: concisenessScore,
        weight: 0.10,
        details: `${totalChars} characters total`,
      },
    },
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
