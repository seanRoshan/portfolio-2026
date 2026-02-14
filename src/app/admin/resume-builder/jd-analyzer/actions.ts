'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveJobDescription(data: {
  title: string
  company?: string
  raw_text: string
  extracted_skills?: string[]
  extracted_requirements?: string[]
  extracted_qualifications?: string[]
  analysis?: Record<string, unknown>
  application_id?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('job_descriptions').insert({
    user_id: user?.id,
    title: data.title,
    company: data.company || null,
    raw_text: data.raw_text,
    extracted_skills: data.extracted_skills ?? null,
    extracted_requirements: data.extracted_requirements ?? null,
    extracted_qualifications: data.extracted_qualifications ?? null,
    analysis: data.analysis ?? null,
    application_id: data.application_id || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/resume-builder/jd-analyzer')
}

export async function deleteJobDescription(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('job_descriptions')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/resume-builder/jd-analyzer')
}
