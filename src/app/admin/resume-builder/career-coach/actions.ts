'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  CareerCoachSession,
  CoachMessage,
  CoachSessionType,
} from '@/types/resume-builder'

export async function createCoachSession(data: {
  topic: string
  session_type: CoachSessionType
}): Promise<CareerCoachSession> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: session, error } = await supabase
    .from('career_coach_sessions')
    .insert({
      user_id: user?.id,
      topic: data.topic,
      session_type: data.session_type,
      messages: [],
      generated_content: {},
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/resume-builder/career-coach')
  return session as CareerCoachSession
}

export async function deleteCoachSession(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('career_coach_sessions')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/resume-builder/career-coach')
}

export async function updateCoachSessionMessages(
  id: string,
  messages: CoachMessage[]
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('career_coach_sessions')
    .update({ messages })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/resume-builder/career-coach')
  revalidatePath(`/admin/resume-builder/career-coach/${id}`)
}

export async function updateCoachSessionContent(
  id: string,
  generatedContent: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('career_coach_sessions')
    .update({ generated_content: generatedContent })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/career-coach/${id}`)
}
