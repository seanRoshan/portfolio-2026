import type { ResumeWithRelations, ValidationResult } from '@/types/resume-builder'

// Approved action verbs from the guide
export const STRONG_VERBS = new Set([
  'led', 'directed', 'managed', 'coordinated', 'spearheaded', 'championed',
  'built', 'designed', 'architected', 'developed', 'implemented', 'created', 'launched',
  'improved', 'optimized', 'enhanced', 'streamlined', 'accelerated', 'reduced',
  'analyzed', 'evaluated', 'assessed', 'investigated', 'diagnosed',
  'presented', 'documented', 'authored', 'published', 'mentored', 'trained',
  'migrated', 'automated', 'deployed', 'configured', 'integrated', 'refactored',
  'scaled', 'delivered', 'established', 'introduced', 'drove', 'enabled',
  'pioneered', 'transformed', 'restructured', 'negotiated', 'secured',
  'increased', 'decreased',
])

// Weak verbs to flag (phrase-based with suggested replacements)
const WEAK_VERB_PHRASES: Record<string, string[]> = {
  'worked on': ['Built', 'Implemented', 'Developed'],
  'responsible for': ['Led', 'Managed', 'Drove'],
  'took part in': ['Contributed to', 'Collaborated on'],
  'assisted with': ['Supported', 'Enabled'],
  'helped with': ['Enabled', 'Facilitated'],
  'helped': ['Enabled', 'Facilitated'],
  'was involved in': ['Contributed to', 'Led'],
  'duties included': ['Led', 'Managed', 'Delivered'],
}

// Weak single-word verbs that should not start bullets
export const WEAK_VERBS = new Set([
  'was', 'did', 'had', 'got', 'made', 'went', 'used',
  'worked', 'helped', 'assisted', 'participated', 'responsible',
  'involved', 'utilized', 'leveraged',
])

// Comprehensive buzzword/cliche list for career coach checks
export const BUZZWORDS = [
  'team player', 'go-getter', 'self-starter', 'detail-oriented',
  'hard worker', 'think outside the box', 'synergy', 'leverage',
  'proactive', 'results-driven', 'dynamic', 'passionate',
  'motivated', 'excellent communication skills', 'fast learner',
  'responsible for', 'assisted with', 'helped with', 'worked on',
  'duties included', 'various tasks', 'many projects',
  'strong work ethic', 'problem solver', 'innovative thinker',
  'hit the ground running', 'paradigm shift',
  'excellent communication', 'passionate about',
  'guru', 'ninja', 'rockstar', 'visionary', 'world-class',
]

// Sloppy language patterns
const SLOPPY_PATTERNS = ['etc.', 'and so on', 'stuff', 'things', 'various']

export function validateResume(resume: ResumeWithRelations): ValidationResult[] {
  const results: ValidationResult[] = []

  // === CRITICAL RULES ===

  // Contact info completeness
  if (!resume.contact_info?.full_name) {
    results.push({
      severity: 'critical',
      section: 'contact',
      field: 'full_name',
      message: 'Full name is required',
    })
  }
  if (!resume.contact_info?.email) {
    results.push({
      severity: 'critical',
      section: 'contact',
      field: 'email',
      message: 'Email address is required',
    })
  }
  if (!resume.contact_info?.city && !resume.contact_info?.country) {
    results.push({
      severity: 'critical',
      section: 'contact',
      field: 'location',
      message: 'Location is required (city or country)',
    })
  }

  // At least one experience or project
  if (
    resume.work_experiences.length === 0 &&
    resume.projects.length === 0
  ) {
    results.push({
      severity: 'critical',
      section: 'experience',
      message: 'Add at least one work experience or project',
    })
  }

  // No empty visible sections
  const visibleSections = new Set(
    (resume.settings?.section_order ?? []).filter(
      (s) => !(resume.settings?.hidden_sections ?? []).includes(s)
    )
  )

  if (
    visibleSections.has('experience') &&
    resume.work_experiences.length === 0
  ) {
    results.push({
      severity: 'warning',
      section: 'experience',
      message: 'Work experience section is visible but empty',
      suggestion: 'Add experience or hide the section',
    })
  }

  if (visibleSections.has('skills') && resume.skill_categories.length === 0) {
    results.push({
      severity: 'warning',
      section: 'skills',
      message: 'Skills section is visible but empty',
      suggestion: 'Add skills or hide the section',
    })
  }

  // === WARNING RULES ===

  // Check contact link count
  const linkCount = [
    resume.contact_info?.linkedin_url,
    resume.contact_info?.github_url,
    resume.contact_info?.portfolio_url,
  ].filter(Boolean).length
  if (linkCount > 4) {
    results.push({
      severity: 'warning',
      section: 'contact',
      message: 'Too many contact links (max 4 recommended)',
    })
  }

  // === Career Coach Rule: LinkedIn URL check ===
  if (!resume.contact_info?.linkedin_url) {
    results.push({
      severity: 'warning',
      section: 'contact',
      field: 'linkedin_url',
      message: 'LinkedIn URL missing — critical for tech industry resumes',
      suggestion: 'Add your LinkedIn profile URL for recruiter visibility',
    })
  }

  // Check achievement bullets for each experience
  for (const exp of resume.work_experiences) {
    const bulletCount = exp.achievements?.length ?? 0

    // === Career Coach Rule: Bullet count per experience (3-6 recommended) ===
    if (bulletCount > 6) {
      results.push({
        severity: 'warning',
        section: 'experience',
        field: exp.id,
        message: `Experience '${exp.company || exp.job_title || 'Role'}' has ${bulletCount} bullets (recommended: 3-6)`,
        suggestion: 'Trim to the 3-6 most impactful achievements',
      })
    }

    if (bulletCount > 0 && bulletCount < 3) {
      results.push({
        severity: 'warning',
        section: 'experience',
        field: exp.id,
        message: `Experience '${exp.company || exp.job_title || 'Role'}' has ${bulletCount} bullet${bulletCount === 1 ? '' : 's'} (recommended: 3-6)`,
        suggestion: 'Add more achievement bullets to demonstrate impact',
      })
    }

    for (const a of exp.achievements ?? []) {
      const analysis = analyzeAchievement(a.text)
      for (const warning of analysis.warnings) {
        results.push({
          severity: 'warning',
          section: 'experience',
          field: a.id,
          message: warning,
        })
      }
    }
  }

  // Also check project bullets
  for (const proj of resume.projects) {
    for (const a of proj.achievements ?? []) {
      const analysis = analyzeAchievement(a.text)
      for (const warning of analysis.warnings) {
        results.push({
          severity: 'warning',
          section: 'projects',
          field: a.id,
          message: warning,
        })
      }
    }
  }

  // Summary visibility check
  if (
    resume.summary?.is_visible &&
    (!resume.summary?.text || resume.summary.text.length < 20)
  ) {
    results.push({
      severity: 'warning',
      section: 'summary',
      message: 'Summary is visible but too short',
      suggestion: 'Write 1-3 sentences or hide the section',
    })
  }

  // === Career Coach Rule: Summary length check ===
  if (resume.summary?.text && resume.summary.text.trim().length > 0) {
    const wordCount = resume.summary.text.trim().split(/\s+/).length
    if (wordCount < 50) {
      results.push({
        severity: 'warning',
        section: 'summary',
        message: `Summary is too short (${wordCount} words, recommended: 50-200)`,
        suggestion: 'Expand your summary to 2-4 sentences highlighting experience, skills, and career trajectory',
      })
    } else if (wordCount > 200) {
      results.push({
        severity: 'warning',
        section: 'summary',
        message: `Summary is too long (${wordCount} words, recommended: 50-200)`,
        suggestion: 'Condense your summary to 2-4 impactful sentences',
      })
    }
  }

  return results
}

export interface AchievementAnalysis {
  hasMetric: boolean
  startsWithVerb: boolean
  warnings: string[]
  suggestions: string[]
}

export function analyzeAchievement(text: string): AchievementAnalysis {
  if (!text.trim()) {
    return { hasMetric: false, startsWithVerb: false, warnings: [], suggestions: [] }
  }

  const warnings: string[] = []
  const suggestions: string[] = []

  // === Career Coach Rule: XYZ Formula Check ===
  // Check for metrics (numbers, percentages, dollar amounts)
  const hasMetric = hasMetricInText(text)
  if (!hasMetric) {
    warnings.push('Bullet lacks quantifiable metrics (XYZ formula)')
    suggestions.push('Add a number, percentage, or dollar amount to show measurable impact')
  }

  // Check first word against strong verbs
  const firstWord = text.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '')
  const startsWithVerb = STRONG_VERBS.has(firstWord)

  // === Career Coach Rule: Weak Action Verb Start ===
  if (WEAK_VERBS.has(firstWord)) {
    warnings.push(
      `Bullet starts with weak verb '${firstWord}'. Consider: Led, Built, Designed, Drove, Implemented, Architected, Delivered, Reduced, Increased`
    )
  }

  // Check for weak verb phrases in text
  const lowerText = text.toLowerCase()
  for (const [weak, replacements] of Object.entries(WEAK_VERB_PHRASES)) {
    if (lowerText.includes(weak)) {
      warnings.push(
        `"${weak}" is passive. Try: ${replacements.join(', ')}`
      )
    }
  }

  // === Career Coach Rule: Buzzword/Cliche Check ===
  for (const buzz of BUZZWORDS) {
    if (lowerText.includes(buzz)) {
      warnings.push(
        `Contains buzzword/cliche: '${buzz}'`
      )
    }
  }

  // Check for sloppy language
  for (const pattern of SLOPPY_PATTERNS) {
    if (lowerText.includes(pattern)) {
      warnings.push(`"${pattern}" is vague. Be specific.`)
    }
  }

  // Check line length (approximately 2 lines at 10pt)
  if (text.length > 200) {
    warnings.push('Bullet is too long. Keep to max 2 lines.')
  }

  return { hasMetric, startsWithVerb, warnings, suggestions }
}

/** Check if text contains quantifiable metrics (numbers, %, $, measurement words) */
export function hasMetricInText(text: string): boolean {
  return /\d/.test(text) || /\$/.test(text) || /%/.test(text)
}
