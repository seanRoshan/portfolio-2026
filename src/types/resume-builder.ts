// TypeScript interfaces for the Resume Builder system

export type ExperienceLevel =
  | 'intern'
  | 'new_grad'
  | 'bootcamp_grad'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'staff_plus'
  | 'tech_lead'
  | 'eng_manager'

export type FontFamily = string

export type FontSizePreset = 'compact' | 'comfortable' | 'spacious'
export type DateFormat = 'full' | 'month_year' | 'year_only'
export type PageMargin = 'compact' | 'normal' | 'wide'
export type TemplateCategory = 'recommended' | 'classic' | 'creative' | 'minimal'
export type TemplateLayout = 'single_column' | 'two_column'
export type AchievementParentType = 'work' | 'project'
export type ExtracurricularType =
  | 'patent'
  | 'publication'
  | 'talk'
  | 'open_source'
  | 'community'
  | 'other'

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'phone_screen'
  | 'technical'
  | 'onsite'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export type RemoteType = 'remote' | 'hybrid' | 'onsite'

export type CoachSessionType =
  | 'general'
  | 'experience_builder'
  | 'project_builder'
  | 'interview_prep'
  | 'career_narrative'

export type CoverLetterTone =
  | 'professional'
  | 'passionate'
  | 'bold'
  | 'conversational'

// ===== Template =====
export interface ResumeTemplate {
  id: string
  name: string
  description: string | null
  category: TemplateCategory
  layout: TemplateLayout
  target_experience_levels: ExperienceLevel[]
  max_pages: number
  preview_image_url: string | null
  tokens: TemplateTokens
  created_at: string
}

export interface TemplateTokens {
  fontFamily: { heading: string; body: string }
  fontSize: {
    name: string
    sectionHeader: string
    jobTitle: string
    body: string
    date: string
  }
  spacing: {
    sectionGap: string
    entryGap: string
    lineHeight: string
    pageMargin: string
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    divider: string
  }
  layout: {
    columnRatio?: string
    headerStyle: 'centered' | 'left_aligned' | 'full_width'
    sectionDivider: 'line' | 'space' | 'border' | 'none'
  }
}

// ===== Resume =====
export interface Resume {
  id: string
  user_id: string | null
  title: string
  template_id: string | null
  experience_level: ExperienceLevel | null
  target_role: string | null
  company_name: string | null
  job_location: string | null
  work_mode: RemoteType | null
  job_description_text: string | null
  is_master: boolean
  parent_resume_id: string | null
  short_id: string | null
  created_at: string
  updated_at: string
}

export interface ResumeContactInfo {
  id: string
  resume_id: string
  full_name: string
  email: string | null
  phone: string | null
  city: string | null
  state: string | null
  country: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  blog_url: string | null
}

export interface ResumeSummary {
  id: string
  resume_id: string
  text: string | null
  is_visible: boolean
}

export interface ResumeWorkExperience {
  id: string
  resume_id: string
  job_title: string
  company: string
  location: string | null
  start_date: string | null
  end_date: string | null
  is_promotion: boolean
  parent_experience_id: string | null
  sort_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
  achievements?: ResumeAchievement[]
}

export interface ResumeAchievement {
  id: string
  parent_id: string
  parent_type: AchievementParentType
  text: string
  has_metric: boolean
  sort_order: number
  created_at: string
}

export interface ResumeEducation {
  id: string
  resume_id: string
  degree: string
  institution: string
  field_of_study: string | null
  graduation_date: string | null
  gpa: number | null
  relevant_coursework: string[] | null
  honors: string | null
  sort_order: number
  created_at: string
}

export interface ResumeSkillCategory {
  id: string
  resume_id: string
  name: string
  skills: string[]
  sort_order: number
}

export interface ResumeProject {
  id: string
  resume_id: string
  name: string
  project_url: string | null
  source_url: string | null
  description: string | null
  sort_order: number
  created_at: string
  achievements?: ResumeAchievement[]
}

export interface ResumeCertification {
  id: string
  resume_id: string
  name: string
  issuer: string | null
  date: string | null
  sort_order: number
}

export interface ResumeExtracurricular {
  id: string
  resume_id: string
  type: ExtracurricularType | null
  title: string
  description: string | null
  url: string | null
  sort_order: number
}

export interface ResumeSettings {
  id: string
  resume_id: string
  accent_color: string
  font_family: FontFamily
  font_size_preset: FontSizePreset
  date_format: DateFormat
  section_order: string[]
  hidden_sections: string[]
  page_limit: 1 | 2 | 3
  font_size_base?: number
  background_color?: string
  page_margin?: PageMargin
  name_font_size?: number
  section_title_uppercase?: boolean
  right_panel_color?: string
}

// ===== Full Resume (with all relations) =====
export interface ResumeWithRelations extends Resume {
  template: ResumeTemplate | null
  contact_info: ResumeContactInfo | null
  summary: ResumeSummary | null
  work_experiences: ResumeWorkExperience[]
  education: ResumeEducation[]
  skill_categories: ResumeSkillCategory[]
  projects: ResumeProject[]
  certifications: ResumeCertification[]
  extracurriculars: ResumeExtracurricular[]
  settings: ResumeSettings | null
}

// ===== Job Applications =====
export interface JobApplication {
  id: string
  user_id: string | null
  company: string
  position: string
  url: string | null
  status: ApplicationStatus
  resume_id: string | null
  applied_date: string | null
  response_date: string | null
  notes: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  location: string | null
  remote_type: RemoteType | null
  contact_name: string | null
  contact_email: string | null
  created_at: string
  updated_at: string
  resume?: Resume | null
}

// ===== Job Descriptions =====
export interface JobDescription {
  id: string
  user_id: string | null
  application_id: string | null
  title: string
  company: string | null
  raw_text: string
  extracted_skills: string[] | null
  extracted_requirements: string[] | null
  extracted_qualifications: string[] | null
  analysis: Record<string, unknown> | null
  created_at: string
}

// ===== Career Coach =====
export interface CareerCoachSession {
  id: string
  user_id: string | null
  topic: string
  session_type: CoachSessionType
  messages: CoachMessage[]
  generated_content: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// ===== Cover Letters =====
export interface CoverLetter {
  id: string
  user_id: string | null
  application_id: string | null
  resume_id: string | null
  company: string
  position: string
  content: string | null
  tone: CoverLetterTone
  created_at: string
  updated_at: string
}

// ===== Validation =====
export type ValidationSeverity = 'critical' | 'warning' | 'style'

export interface ValidationResult {
  severity: ValidationSeverity
  section: string
  field?: string
  message: string
  suggestion?: string
}

// ===== AI =====
export interface AIRewriteRequest {
  bullet: string
  jobTitle: string
  company: string
}

export interface AIRewriteResponse {
  original: string
  rewritten: string
  improvements: string[]
}

export interface ResumeScoreDimension {
  name: string
  score: number
  weight: number
  feedback: string
  suggestions: string[]
}

export interface ResumeScore {
  overall: number
  dimensions: ResumeScoreDimension[]
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface JDMatchResult {
  matchRate: number
  presentKeywords: string[]
  missingKeywords: string[]
  suggestions: string[]
  reorderSuggestions: string[]
}
