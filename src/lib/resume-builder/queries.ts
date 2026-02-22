import { createClient } from '@/lib/supabase/server'
import type {
  Resume,
  ResumeTemplate,
  ResumeContactInfo,
  ResumeSummary,
  ResumeWorkExperience,
  ResumeAchievement,
  ResumeEducation,
  ResumeSkillCategory,
  ResumeProject,
  ResumeCertification,
  ResumeExtracurricular,
  ResumeSettings,
  ResumeWithRelations,
  JobApplication,
  JobDescription,
  CareerCoachSession,
  CoverLetter,
} from '@/types/resume-builder'

// ===== Templates =====

export async function getTemplates(): Promise<ResumeTemplate[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resume_templates')
    .select('*')
    .order('name')
  return (data as ResumeTemplate[]) ?? []
}

export async function getTemplate(id: string): Promise<ResumeTemplate | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resume_templates')
    .select('*')
    .eq('id', id)
    .single()
  return data as ResumeTemplate | null
}

// ===== Resumes =====

export async function getResumes(): Promise<Resume[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resumes')
    .select('*')
    .order('updated_at', { ascending: false })
  return (data as Resume[]) ?? []
}

export async function getResume(id: string): Promise<Resume | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .single()
  return data as Resume | null
}

export async function getResumeByShortId(
  shortId: string
): Promise<Resume | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resumes')
    .select('*')
    .eq('short_id', shortId)
    .single()
  return data as Resume | null
}

export async function getResumeContactInfo(
  resumeId: string
): Promise<ResumeContactInfo | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resume_contact_info')
    .select('*')
    .eq('resume_id', resumeId)
    .single()
  return data as ResumeContactInfo | null
}

export async function getResumeSummary(
  resumeId: string
): Promise<ResumeSummary | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resume_summaries')
    .select('*')
    .eq('resume_id', resumeId)
    .single()
  return data as ResumeSummary | null
}

export async function getResumeWorkExperiences(
  resumeId: string
): Promise<ResumeWorkExperience[]> {
  const supabase = await createClient()
  const { data: experiences } = await supabase
    .from('resume_work_experiences')
    .select('*')
    .eq('resume_id', resumeId)
    .order('sort_order')

  if (!experiences?.length) return []

  // Fetch achievements for all experiences
  const expIds = experiences.map((e) => e.id)
  const { data: achievements } = await supabase
    .from('resume_achievements')
    .select('*')
    .in('parent_id', expIds)
    .eq('parent_type', 'work')
    .order('sort_order')

  return experiences.map((exp) => ({
    ...exp,
    achievements:
      (achievements as ResumeAchievement[])?.filter(
        (a) => a.parent_id === exp.id
      ) ?? [],
  })) as ResumeWorkExperience[]
}

export async function getResumeEducation(
  resumeId: string
): Promise<ResumeEducation[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resume_education')
    .select('*')
    .eq('resume_id', resumeId)
    .order('sort_order')
  return (data as ResumeEducation[]) ?? []
}

export async function getResumeSkillCategories(
  resumeId: string
): Promise<ResumeSkillCategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resume_skill_categories')
    .select('*')
    .eq('resume_id', resumeId)
    .order('sort_order')
  return (data as ResumeSkillCategory[]) ?? []
}

export async function getResumeProjects(
  resumeId: string
): Promise<ResumeProject[]> {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('resume_projects')
    .select('*')
    .eq('resume_id', resumeId)
    .order('sort_order')

  if (!projects?.length) return []

  const projIds = projects.map((p) => p.id)
  const { data: achievements } = await supabase
    .from('resume_achievements')
    .select('*')
    .in('parent_id', projIds)
    .eq('parent_type', 'project')
    .order('sort_order')

  return projects.map((proj) => ({
    ...proj,
    achievements:
      (achievements as ResumeAchievement[])?.filter(
        (a) => a.parent_id === proj.id
      ) ?? [],
  })) as ResumeProject[]
}

export async function getResumeCertifications(
  resumeId: string
): Promise<ResumeCertification[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resume_certifications')
    .select('*')
    .eq('resume_id', resumeId)
    .order('sort_order')
  return (data as ResumeCertification[]) ?? []
}

export async function getResumeExtracurriculars(
  resumeId: string
): Promise<ResumeExtracurricular[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resume_extracurriculars')
    .select('*')
    .eq('resume_id', resumeId)
    .order('sort_order')
  return (data as ResumeExtracurricular[]) ?? []
}

export async function getResumeSettings(
  resumeId: string
): Promise<ResumeSettings | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resume_settings')
    .select('*')
    .eq('resume_id', resumeId)
    .single()
  return data as ResumeSettings | null
}

export async function getResumeWithRelations(
  resumeId: string
): Promise<ResumeWithRelations | null> {
  const [
    resume,
    template,
    contactInfo,
    summary,
    workExperiences,
    education,
    skillCategories,
    projects,
    certifications,
    extracurriculars,
    settings,
  ] = await Promise.all([
    getResume(resumeId),
    getResume(resumeId).then((r) =>
      r?.template_id ? getTemplate(r.template_id) : null
    ),
    getResumeContactInfo(resumeId),
    getResumeSummary(resumeId),
    getResumeWorkExperiences(resumeId),
    getResumeEducation(resumeId),
    getResumeSkillCategories(resumeId),
    getResumeProjects(resumeId),
    getResumeCertifications(resumeId),
    getResumeExtracurriculars(resumeId),
    getResumeSettings(resumeId),
  ])

  if (!resume) return null

  return {
    ...resume,
    template,
    contact_info: contactInfo,
    summary,
    work_experiences: workExperiences,
    education,
    skill_categories: skillCategories,
    projects,
    certifications,
    extracurriculars,
    settings,
  }
}

// ===== Job Applications =====

export async function getJobApplications(): Promise<JobApplication[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('job_applications')
    .select('*, resume:resumes(id, title)')
    .order('updated_at', { ascending: false })
  return (data as JobApplication[]) ?? []
}

export async function getJobApplication(
  id: string
): Promise<JobApplication | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('job_applications')
    .select('*, resume:resumes(id, title)')
    .eq('id', id)
    .single()
  return data as JobApplication | null
}

// ===== Job Descriptions =====

export async function getJobDescriptions(): Promise<JobDescription[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('job_descriptions')
    .select('*')
    .order('created_at', { ascending: false })
  return (data as JobDescription[]) ?? []
}

export async function getJobDescription(
  id: string
): Promise<JobDescription | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('job_descriptions')
    .select('*')
    .eq('id', id)
    .single()
  return data as JobDescription | null
}

// ===== Career Coach =====

export async function getCoachSessions(): Promise<CareerCoachSession[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('career_coach_sessions')
    .select('*')
    .order('updated_at', { ascending: false })
  return (data as CareerCoachSession[]) ?? []
}

export async function getCoachSession(
  id: string
): Promise<CareerCoachSession | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('career_coach_sessions')
    .select('*')
    .eq('id', id)
    .single()
  return data as CareerCoachSession | null
}

// ===== Cover Letters =====

export async function getCoverLetters(): Promise<CoverLetter[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cover_letters')
    .select('*')
    .order('updated_at', { ascending: false })
  return (data as CoverLetter[]) ?? []
}

export async function getCoverLetter(
  id: string
): Promise<CoverLetter | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cover_letters')
    .select('*')
    .eq('id', id)
    .single()
  return data as CoverLetter | null
}
