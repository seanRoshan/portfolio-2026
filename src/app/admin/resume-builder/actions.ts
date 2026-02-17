'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ExperienceLevel } from '@/types/resume-builder'
import { fetchPortfolioData } from '@/lib/resume-builder/ai/portfolio-data'
import { tailorResume, getTemplateId } from '@/lib/resume-builder/ai/tailor-resume'

function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8)
}

// ===== Resume CRUD =====

export async function createResume(formData: {
  title: string
  experience_level: ExperienceLevel
  target_role?: string
  is_master?: boolean
  template_id?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get the default template (Pragmatic)
  const templateId =
    formData.template_id ?? 'a1b2c3d4-0001-4000-8000-000000000001'

  const { data: resume, error } = await supabase
    .from('resumes')
    .insert({
      user_id: user?.id,
      title: formData.title,
      template_id: templateId,
      experience_level: formData.experience_level,
      target_role: formData.target_role || null,
      is_master: formData.is_master ?? false,
      short_id: generateShortId(),
    })
    .select()
    .single()

  if (error) {
    console.error('[createResume] Insert error:', error)
    throw new Error(error.message)
  }

  // Create default related records
  const results = await Promise.all([
    supabase
      .from('resume_contact_info')
      .insert({ resume_id: resume.id, full_name: '' }),
    supabase
      .from('resume_summaries')
      .insert({ resume_id: resume.id, text: '', is_visible: true }),
    supabase.from('resume_settings').insert({
      resume_id: resume.id,
      section_order: getDefaultSectionOrder(formData.experience_level),
      page_limit: getDefaultPageLimit(formData.experience_level),
    }),
  ])

  for (const result of results) {
    if (result.error) {
      console.error('[createResume] Related record error:', result.error)
    }
  }

  revalidatePath('/admin/resume-builder')
  return resume.id as string
}

export async function generateTailoredResume(formData: {
  experience_level: ExperienceLevel
  job_description: string
}): Promise<string> {
  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Fetch portfolio data
  const portfolio = await fetchPortfolioData()

  // 3. Call AI tailoring
  const tailored = await tailorResume(
    portfolio,
    formData.job_description,
    formData.experience_level
  )

  // 4. Resolve template UUID
  const templateId = getTemplateId(tailored.suggested_template)

  // 5. Parse target_role from title (split on em-dash, en-dash, or hyphen)
  const targetRole =
    tailored.suggested_title.split('—')[0]?.trim() ||
    tailored.suggested_title.split('–')[0]?.trim() ||
    tailored.suggested_title.split('-')[0]?.trim() ||
    null

  // 6. Insert resume record
  const { data: resume, error: resumeError } = await supabase
    .from('resumes')
    .insert({
      user_id: user?.id,
      title: tailored.suggested_title,
      template_id: templateId,
      experience_level: formData.experience_level,
      target_role: targetRole,
      is_master: false,
      short_id: generateShortId(),
    })
    .select()
    .single()

  if (resumeError) {
    console.error('[generateTailoredResume] Resume insert error:', resumeError)
    throw new Error(`Failed to create resume: ${resumeError.message}`)
  }

  // 7. Insert contact_info, summary, and settings in parallel
  const parallelResults = await Promise.all([
    supabase.from('resume_contact_info').insert({
      resume_id: resume.id,
      full_name: tailored.contact_info.full_name,
      email: tailored.contact_info.email || null,
      phone: tailored.contact_info.phone || null,
      city: tailored.contact_info.city || null,
      country: tailored.contact_info.country || null,
      linkedin_url: tailored.contact_info.linkedin_url || null,
      github_url: tailored.contact_info.github_url || null,
      portfolio_url: tailored.contact_info.portfolio_url || null,
    }),
    supabase.from('resume_summaries').insert({
      resume_id: resume.id,
      text: tailored.summary,
      is_visible: true,
    }),
    supabase.from('resume_settings').insert({
      resume_id: resume.id,
      section_order: tailored.section_order,
      page_limit: getDefaultPageLimit(formData.experience_level),
    }),
  ])

  for (const result of parallelResults) {
    if (result.error) {
      console.error(
        '[generateTailoredResume] Related record error:',
        result.error
      )
    }
  }

  // 8. Insert work experiences sequentially (need parent ID for achievements)
  for (let i = 0; i < tailored.work_experiences.length; i++) {
    const exp = tailored.work_experiences[i]
    const { data: newExp, error: expError } = await supabase
      .from('resume_work_experiences')
      .insert({
        resume_id: resume.id,
        job_title: exp.job_title,
        company: exp.company,
        location: exp.location || null,
        start_date: exp.start_date || null,
        end_date: exp.end_date || null,
        sort_order: i,
      })
      .select()
      .single()

    if (expError) {
      console.error(
        '[generateTailoredResume] Work experience insert error:',
        expError
      )
      continue
    }

    if (exp.achievements.length > 0) {
      const { error: achError } = await supabase
        .from('resume_achievements')
        .insert(
          exp.achievements.map((text, idx) => ({
            parent_id: newExp.id,
            parent_type: 'work' as const,
            text,
            has_metric: /\d/.test(text),
            sort_order: idx,
          }))
        )

      if (achError) {
        console.error(
          '[generateTailoredResume] Work achievements insert error:',
          achError
        )
      }
    }
  }

  // 9. Insert skill categories in bulk
  if (tailored.skill_categories.length > 0) {
    const { error: skillsError } = await supabase
      .from('resume_skill_categories')
      .insert(
        tailored.skill_categories.map((cat, i) => ({
          resume_id: resume.id,
          name: cat.name,
          skills: cat.skills,
          sort_order: i,
        }))
      )

    if (skillsError) {
      console.error(
        '[generateTailoredResume] Skills insert error:',
        skillsError
      )
    }
  }

  // 10. Insert projects sequentially (need parent ID for achievements)
  for (let i = 0; i < tailored.projects.length; i++) {
    const proj = tailored.projects[i]
    const { data: newProj, error: projError } = await supabase
      .from('resume_projects')
      .insert({
        resume_id: resume.id,
        name: proj.name,
        description: proj.description || null,
        project_url: proj.url || null,
        source_url: proj.source_url || null,
        sort_order: i,
      })
      .select()
      .single()

    if (projError) {
      console.error(
        '[generateTailoredResume] Project insert error:',
        projError
      )
      continue
    }

    if (proj.achievements.length > 0) {
      const { error: achError } = await supabase
        .from('resume_achievements')
        .insert(
          proj.achievements.map((text, idx) => ({
            parent_id: newProj.id,
            parent_type: 'project' as const,
            text,
            has_metric: /\d/.test(text),
            sort_order: idx,
          }))
        )

      if (achError) {
        console.error(
          '[generateTailoredResume] Project achievements insert error:',
          achError
        )
      }
    }
  }

  // 11. Insert education in bulk
  if (tailored.education.length > 0) {
    const { error: eduError } = await supabase
      .from('resume_education')
      .insert(
        tailored.education.map((edu, i) => ({
          resume_id: resume.id,
          degree: edu.degree,
          institution: edu.institution,
          field_of_study: edu.field_of_study || null,
          graduation_date: edu.graduation_date || null,
          sort_order: i,
        }))
      )

    if (eduError) {
      console.error(
        '[generateTailoredResume] Education insert error:',
        eduError
      )
    }
  }

  // 12. Insert certifications in bulk
  if (tailored.certifications.length > 0) {
    const { error: certError } = await supabase
      .from('resume_certifications')
      .insert(
        tailored.certifications.map((cert, i) => ({
          resume_id: resume.id,
          name: cert.name,
          issuer: cert.issuer || null,
          date: cert.date || null,
          sort_order: i,
        }))
      )

    if (certError) {
      console.error(
        '[generateTailoredResume] Certifications insert error:',
        certError
      )
    }
  }

  // 13. Insert extracurriculars in bulk
  if (tailored.extracurriculars.length > 0) {
    const { error: extraError } = await supabase
      .from('resume_extracurriculars')
      .insert(
        tailored.extracurriculars.map((extra, i) => ({
          resume_id: resume.id,
          type: extra.type,
          title: extra.title,
          description: extra.description || null,
          url: extra.url || null,
          sort_order: i,
        }))
      )

    if (extraError) {
      console.error(
        '[generateTailoredResume] Extracurriculars insert error:',
        extraError
      )
    }
  }

  revalidatePath('/admin/resume-builder')
  return resume.id as string
}

export async function deleteResume(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('resumes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/resume-builder')
}

export async function cloneResume(id: string, newTitle: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch original resume and all related data
  const { data: original } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .single()

  if (!original) throw new Error('Resume not found')

  // Create new resume
  const { data: newResume, error } = await supabase
    .from('resumes')
    .insert({
      user_id: user?.id,
      title: newTitle,
      template_id: original.template_id,
      experience_level: original.experience_level,
      target_role: original.target_role,
      is_master: false,
      parent_resume_id: original.is_master ? original.id : original.parent_resume_id,
      short_id: generateShortId(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Clone all related records
  const [contactInfo, summary, experiences, education, skills, projects, certs, extras, settings] =
    await Promise.all([
      supabase.from('resume_contact_info').select('*').eq('resume_id', id).single(),
      supabase.from('resume_summaries').select('*').eq('resume_id', id).single(),
      supabase.from('resume_work_experiences').select('*').eq('resume_id', id),
      supabase.from('resume_education').select('*').eq('resume_id', id),
      supabase.from('resume_skill_categories').select('*').eq('resume_id', id),
      supabase.from('resume_projects').select('*').eq('resume_id', id),
      supabase.from('resume_certifications').select('*').eq('resume_id', id),
      supabase.from('resume_extracurriculars').select('*').eq('resume_id', id),
      supabase.from('resume_settings').select('*').eq('resume_id', id).single(),
    ])

  // Clone contact info
  if (contactInfo.data) {
    const { id: _id, resume_id: _rid, ...rest } = contactInfo.data
    await supabase.from('resume_contact_info').insert({ ...rest, resume_id: newResume.id })
  }

  // Clone summary
  if (summary.data) {
    const { id: _id, resume_id: _rid, ...rest } = summary.data
    await supabase.from('resume_summaries').insert({ ...rest, resume_id: newResume.id })
  }

  // Clone experiences + achievements
  if (experiences.data?.length) {
    for (const exp of experiences.data) {
      const { id: oldId, resume_id: _rid, parent_experience_id: _pid, created_at: _ca, updated_at: _ua, ...rest } = exp
      const { data: newExp } = await supabase
        .from('resume_work_experiences')
        .insert({ ...rest, resume_id: newResume.id })
        .select()
        .single()

      if (newExp) {
        const { data: achievements } = await supabase
          .from('resume_achievements')
          .select('*')
          .eq('parent_id', oldId)
          .eq('parent_type', 'work')

        if (achievements?.length) {
          await supabase.from('resume_achievements').insert(
            achievements.map((a) => ({
              parent_id: newExp.id,
              parent_type: 'work' as const,
              text: a.text,
              has_metric: a.has_metric,
              sort_order: a.sort_order,
            }))
          )
        }
      }
    }
  }

  // Clone education
  if (education.data?.length) {
    await supabase.from('resume_education').insert(
      education.data.map((e) => {
        const { id: _id, resume_id: _rid, created_at: _ca, ...rest } = e
        return { ...rest, resume_id: newResume.id }
      })
    )
  }

  // Clone skills
  if (skills.data?.length) {
    await supabase.from('resume_skill_categories').insert(
      skills.data.map((s) => {
        const { id: _id, resume_id: _rid, ...rest } = s
        return { ...rest, resume_id: newResume.id }
      })
    )
  }

  // Clone projects + achievements
  if (projects.data?.length) {
    for (const proj of projects.data) {
      const { id: oldId, resume_id: _rid, created_at: _ca, ...rest } = proj
      const { data: newProj } = await supabase
        .from('resume_projects')
        .insert({ ...rest, resume_id: newResume.id })
        .select()
        .single()

      if (newProj) {
        const { data: achievements } = await supabase
          .from('resume_achievements')
          .select('*')
          .eq('parent_id', oldId)
          .eq('parent_type', 'project')

        if (achievements?.length) {
          await supabase.from('resume_achievements').insert(
            achievements.map((a) => ({
              parent_id: newProj.id,
              parent_type: 'project' as const,
              text: a.text,
              has_metric: a.has_metric,
              sort_order: a.sort_order,
            }))
          )
        }
      }
    }
  }

  // Clone certifications
  if (certs.data?.length) {
    await supabase.from('resume_certifications').insert(
      certs.data.map((c) => {
        const { id: _id, resume_id: _rid, ...rest } = c
        return { ...rest, resume_id: newResume.id }
      })
    )
  }

  // Clone extracurriculars
  if (extras.data?.length) {
    await supabase.from('resume_extracurriculars').insert(
      extras.data.map((e) => {
        const { id: _id, resume_id: _rid, ...rest } = e
        return { ...rest, resume_id: newResume.id }
      })
    )
  }

  // Clone settings
  if (settings.data) {
    const { id: _id, resume_id: _rid, ...rest } = settings.data
    await supabase.from('resume_settings').insert({ ...rest, resume_id: newResume.id })
  }

  revalidatePath('/admin/resume-builder')
  return newResume.id as string
}

// ===== Resume Editor Actions =====

export async function updateContactInfo(
  resumeId: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_contact_info')
    .update(data)
    .eq('resume_id', resumeId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function updateSummary(
  resumeId: string,
  data: { text: string; is_visible: boolean }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_summaries')
    .update(data)
    .eq('resume_id', resumeId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function addWorkExperience(resumeId: string) {
  const supabase = await createClient()

  // Get current max sort order
  const { data: existing } = await supabase
    .from('resume_work_experiences')
    .select('sort_order')
    .eq('resume_id', resumeId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('resume_work_experiences')
    .insert({
      resume_id: resumeId,
      job_title: '',
      company: '',
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
  return data
}

export async function updateWorkExperience(
  id: string,
  resumeId: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_work_experiences')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function deleteWorkExperience(id: string, resumeId: string) {
  const supabase = await createClient()
  // Delete achievements first
  await supabase
    .from('resume_achievements')
    .delete()
    .eq('parent_id', id)
    .eq('parent_type', 'work')

  const { error } = await supabase
    .from('resume_work_experiences')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function addAchievement(
  parentId: string,
  parentType: 'work' | 'project',
  resumeId: string
) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('resume_achievements')
    .select('sort_order')
    .eq('parent_id', parentId)
    .eq('parent_type', parentType)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('resume_achievements')
    .insert({
      parent_id: parentId,
      parent_type: parentType,
      text: '',
      has_metric: false,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
  return data
}

export async function updateAchievement(
  id: string,
  resumeId: string,
  data: { text: string }
) {
  const supabase = await createClient()
  const hasMetric = /\d/.test(data.text)
  const { error } = await supabase
    .from('resume_achievements')
    .update({ text: data.text, has_metric: hasMetric })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function deleteAchievement(id: string, resumeId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_achievements')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function addEducation(resumeId: string) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('resume_education')
    .select('sort_order')
    .eq('resume_id', resumeId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { error } = await supabase.from('resume_education').insert({
    resume_id: resumeId,
    degree: '',
    institution: '',
    sort_order: nextOrder,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function updateEducation(
  id: string,
  resumeId: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_education')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function deleteEducation(id: string, resumeId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_education')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function addSkillCategory(resumeId: string) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('resume_skill_categories')
    .select('sort_order')
    .eq('resume_id', resumeId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { error } = await supabase.from('resume_skill_categories').insert({
    resume_id: resumeId,
    name: '',
    skills: [],
    sort_order: nextOrder,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function updateSkillCategory(
  id: string,
  resumeId: string,
  data: { name?: string; skills?: string[] }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_skill_categories')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function deleteSkillCategory(id: string, resumeId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_skill_categories')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function addProject(resumeId: string) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('resume_projects')
    .select('sort_order')
    .eq('resume_id', resumeId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('resume_projects')
    .insert({
      resume_id: resumeId,
      name: '',
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
  return data
}

export async function updateProject(
  id: string,
  resumeId: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_projects')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function deleteProject(id: string, resumeId: string) {
  const supabase = await createClient()
  await supabase
    .from('resume_achievements')
    .delete()
    .eq('parent_id', id)
    .eq('parent_type', 'project')

  const { error } = await supabase
    .from('resume_projects')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function addCertification(resumeId: string) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('resume_certifications')
    .select('sort_order')
    .eq('resume_id', resumeId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { error } = await supabase.from('resume_certifications').insert({
    resume_id: resumeId,
    name: '',
    sort_order: nextOrder,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function updateCertification(
  id: string,
  resumeId: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_certifications')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function deleteCertification(id: string, resumeId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_certifications')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function addExtracurricular(resumeId: string) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('resume_extracurriculars')
    .select('sort_order')
    .eq('resume_id', resumeId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { error } = await supabase.from('resume_extracurriculars').insert({
    resume_id: resumeId,
    type: 'other',
    title: '',
    sort_order: nextOrder,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function updateExtracurricular(
  id: string,
  resumeId: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_extracurriculars')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function deleteExtracurricular(id: string, resumeId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_extracurriculars')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function updateResumeSettings(
  resumeId: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resume_settings')
    .update(data)
    .eq('resume_id', resumeId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function updateResumeTemplate(
  resumeId: string,
  templateId: string
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resumes')
    .update({ template_id: templateId })
    .eq('id', resumeId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

export async function updateResumeTitle(resumeId: string, title: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resumes')
    .update({ title })
    .eq('id', resumeId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
}

// ===== Helpers =====

function getDefaultSectionOrder(level: ExperienceLevel): string[] {
  switch (level) {
    case 'intern':
    case 'new_grad':
      return [
        'contact',
        'education',
        'experience',
        'projects',
        'skills',
        'extracurriculars',
      ]
    case 'bootcamp_grad':
      return [
        'contact',
        'summary',
        'skills',
        'projects',
        'experience',
        'education',
        'certifications',
      ]
    case 'junior':
    case 'mid':
      return [
        'contact',
        'summary',
        'experience',
        'skills',
        'projects',
        'education',
        'certifications',
      ]
    case 'senior':
    case 'staff_plus':
      return [
        'contact',
        'summary',
        'experience',
        'extracurriculars',
        'skills',
        'education',
      ]
    case 'tech_lead':
    case 'eng_manager':
      return [
        'contact',
        'summary',
        'experience',
        'extracurriculars',
        'skills',
        'education',
      ]
    default:
      return [
        'contact',
        'summary',
        'experience',
        'skills',
        'projects',
        'education',
        'certifications',
        'extracurriculars',
      ]
  }
}

function getDefaultPageLimit(
  level: ExperienceLevel
): 1 | 2 | 3 {
  switch (level) {
    case 'intern':
    case 'new_grad':
    case 'bootcamp_grad':
    case 'junior':
      return 1
    case 'mid':
    case 'senior':
    case 'staff_plus':
    case 'tech_lead':
    case 'eng_manager':
      return 2
    default:
      return 2
  }
}
