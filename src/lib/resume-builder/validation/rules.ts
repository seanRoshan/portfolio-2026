import type { ResumeWithRelations, ValidationResult } from '@/types/resume-builder'

// Approved action verbs from the guide
const STRONG_VERBS = new Set([
  'led', 'directed', 'managed', 'coordinated', 'spearheaded', 'championed',
  'built', 'designed', 'architected', 'developed', 'implemented', 'created', 'launched',
  'improved', 'optimized', 'enhanced', 'streamlined', 'accelerated', 'reduced',
  'analyzed', 'evaluated', 'assessed', 'investigated', 'diagnosed',
  'presented', 'documented', 'authored', 'published', 'mentored', 'trained',
  'migrated', 'automated', 'deployed', 'configured', 'integrated', 'refactored',
  'scaled', 'delivered', 'established', 'introduced', 'drove', 'enabled',
  'pioneered', 'transformed', 'restructured', 'negotiated', 'secured',
])

// Weak verbs to flag
const WEAK_VERBS: Record<string, string[]> = {
  'worked on': ['Built', 'Implemented', 'Developed'],
  'responsible for': ['Led', 'Managed', 'Drove'],
  'took part in': ['Contributed to', 'Collaborated on'],
  'assisted with': ['Supported', 'Enabled'],
  'helped': ['Enabled', 'Facilitated'],
  'was involved in': ['Contributed to', 'Led'],
}

// Buzzwords to flag
const BUZZWORDS = [
  'team player', 'fast learner', 'self-starter', 'think outside the box',
  'go-getter', 'hit the ground running', 'synergy', 'leverage',
  'paradigm shift', 'proactive', 'detail-oriented', 'results-driven',
  'excellent communication', 'passionate about', 'hard worker',
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
  if (!resume.contact_info?.city || !resume.contact_info?.country) {
    results.push({
      severity: 'critical',
      section: 'contact',
      field: 'location',
      message: 'City and country are required',
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
      severity: 'critical',
      section: 'experience',
      message: 'Work experience section is visible but empty',
      suggestion: 'Add experience or hide the section',
    })
  }

  if (visibleSections.has('skills') && resume.skill_categories.length === 0) {
    results.push({
      severity: 'critical',
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
    resume.contact_info?.blog_url,
  ].filter(Boolean).length
  if (linkCount > 4) {
    results.push({
      severity: 'warning',
      section: 'contact',
      message: 'Too many contact links (max 4 recommended)',
    })
  }

  // Check achievement bullets
  for (const exp of resume.work_experiences) {
    const bulletCount = exp.achievements?.length ?? 0

    if (bulletCount > 5) {
      results.push({
        severity: 'warning',
        section: 'experience',
        field: exp.id,
        message: `"${exp.job_title || 'Role'}" has ${bulletCount} bullets (max 5)`,
      })
    }

    if (bulletCount > 0 && bulletCount < 2) {
      results.push({
        severity: 'warning',
        section: 'experience',
        field: exp.id,
        message: `"${exp.job_title || 'Role'}" has only ${bulletCount} bullet (3-4 recommended)`,
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

  // Check for metrics
  const hasMetric = /\d+/.test(text)
  if (!hasMetric) {
    warnings.push('No quantifiable metric found. Add numbers for impact.')
  }

  // Check first word against strong verbs
  const firstWord = text.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '')
  const startsWithVerb = STRONG_VERBS.has(firstWord)

  // Check for weak verbs
  const lowerText = text.toLowerCase()
  for (const [weak, replacements] of Object.entries(WEAK_VERBS)) {
    if (lowerText.includes(weak)) {
      warnings.push(
        `"${weak}" is passive. Try: ${replacements.join(', ')}`
      )
    }
  }

  // Check for buzzwords
  for (const buzz of BUZZWORDS) {
    if (lowerText.includes(buzz)) {
      warnings.push(
        `"${buzz}" is a buzzword. Be specific instead.`
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
