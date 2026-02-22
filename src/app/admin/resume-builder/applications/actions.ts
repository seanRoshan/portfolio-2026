'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { jobApplicationSchema } from '@/lib/schemas/resume-builder'
import type { ApplicationStatus } from '@/types/resume-builder'

export async function createApplication(formData: {
  company: string
  position: string
  url?: string
  status?: ApplicationStatus
  applied_date?: string
  notes?: string
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string
  location?: string
  remote_type?: 'remote' | 'hybrid' | 'onsite' | null
  contact_name?: string
  contact_email?: string
  resume_id?: string | null
}) {
  const parsed = jobApplicationSchema.safeParse(formData)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const insertData: Record<string, unknown> = {
    user_id: user?.id,
    company: parsed.data.company,
    position: parsed.data.position,
    status: parsed.data.status ?? 'saved',
    salary_currency: parsed.data.salary_currency ?? 'USD',
  }

  if (parsed.data.url) insertData.url = parsed.data.url
  if (parsed.data.applied_date) insertData.applied_date = parsed.data.applied_date
  if (parsed.data.notes) insertData.notes = parsed.data.notes
  if (parsed.data.salary_min != null) insertData.salary_min = parsed.data.salary_min
  if (parsed.data.salary_max != null) insertData.salary_max = parsed.data.salary_max
  if (parsed.data.location) insertData.location = parsed.data.location
  if (parsed.data.remote_type) insertData.remote_type = parsed.data.remote_type
  if (parsed.data.contact_name) insertData.contact_name = parsed.data.contact_name
  if (parsed.data.contact_email) insertData.contact_email = parsed.data.contact_email
  if (parsed.data.resume_id) insertData.resume_id = parsed.data.resume_id

  const { error } = await supabase
    .from('job_applications')
    .insert(insertData)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/resume-builder/applications')
}

export async function updateApplication(
  id: string,
  data: {
    company?: string
    position?: string
    url?: string | null
    status?: ApplicationStatus
    applied_date?: string | null
    response_date?: string | null
    notes?: string | null
    salary_min?: number | null
    salary_max?: number | null
    salary_currency?: string
    location?: string | null
    remote_type?: 'remote' | 'hybrid' | 'onsite' | null
    contact_name?: string | null
    contact_email?: string | null
    resume_id?: string | null
  }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('job_applications')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/resume-builder/applications')
  revalidatePath(`/admin/resume-builder/applications/${id}`)
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { status }

  // Auto-set response_date when moving to a response status
  if (['phone_screen', 'technical', 'onsite', 'offer', 'accepted', 'rejected'].includes(status)) {
    const { data: existing } = await supabase
      .from('job_applications')
      .select('response_date')
      .eq('id', id)
      .single()

    if (existing && !existing.response_date) {
      updateData.response_date = new Date().toISOString().split('T')[0]
    }
  }

  const { error } = await supabase
    .from('job_applications')
    .update(updateData)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/resume-builder/applications')
  revalidatePath(`/admin/resume-builder/applications/${id}`)
}

export async function deleteApplication(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/resume-builder/applications')
}
