import { notFound } from 'next/navigation'
import { AdminHeader } from '../../../admin-header'
import { getCoachSession, getResumes } from '@/lib/resume-builder/queries'
import { ChatInterface } from './chat-interface'

interface ChatPageProps {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params
  const [session, resumes] = await Promise.all([
    getCoachSession(id),
    getResumes(),
  ])

  if (!session) notFound()

  return (
    <>
      <AdminHeader title="Career Coach" />
      <ChatInterface session={session} resumes={resumes} />
    </>
  )
}
