import { notFound } from "next/navigation"
import { AdminHeader } from "../../../admin-header"
import { getCoachSession, getResumes } from "@/lib/resume-builder/queries"
import { getAgentConfig } from "../actions"
import { ChatInterface } from "./chat-interface"

interface ChatPageProps {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params
  const [session, resumes, agentConfig] = await Promise.all([getCoachSession(id), getResumes(), getAgentConfig("career_interviewer")])

  if (!session) notFound()

  return (
    <>
      <AdminHeader title="Career Coach" />
      <ChatInterface session={session} resumes={resumes} agentConfig={agentConfig ?? { model_id: null, max_tokens: null, system_prompt: null }} />
    </>
  )
}
