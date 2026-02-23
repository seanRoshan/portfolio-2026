"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Briefcase,
  FolderKanban,
  Target,
  BookOpen,
  MessageSquare,
  FileText,
  X,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { AgentChat } from "@/components/agent-chat"
import { updateCoachSessionMessages } from "../actions"
import type { CareerCoachSession, CoachSessionType, Resume } from "@/types/resume-builder"

// ===== Constants =====

const SESSION_TYPE_CONFIG: Record<CoachSessionType, { label: string; icon: typeof MessageSquare }> =
  {
    general: { label: "General Career Advice", icon: MessageSquare },
    experience_builder: { label: "Experience Builder", icon: Briefcase },
    project_builder: { label: "Project Builder", icon: FolderKanban },
    interview_prep: { label: "Interview Prep", icon: Target },
    career_narrative: { label: "Career Narrative", icon: BookOpen },
  }

// ===== Sub-Components =====

function BulletItem({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group flex items-start gap-2 rounded-md border p-2 text-sm">
      <span className="flex-1">{text}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  )
}

// ===== Main Component =====

interface ChatInterfaceProps {
  session: CareerCoachSession
  resumes: Resume[]
}

export function ChatInterface({ session, resumes }: ChatInterfaceProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id ?? "")
  const [savedItems, setSavedItems] = useState<string[]>([])

  const config = SESSION_TYPE_CONFIG[session.session_type]
  const Icon = config.icon

  const hasSidebar =
    session.session_type === "experience_builder" || session.session_type === "project_builder"

  // Track tool results for the sidebar
  const handleToolResult = useCallback((toolName: string, result: unknown) => {
    const r = result as { success?: boolean; message?: string }
    if (r?.success && r?.message) {
      setSavedItems((prev) => [...prev, r.message!])
      toast.success(r.message)
    }
  }, [])

  // Persist messages to DB
  const handleMessagesChange = useCallback(
    (messages: Array<{ role: string; content: string }>) => {
      const coachMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date().toISOString(),
      }))
      updateCoachSessionMessages(session.id, coachMessages).catch(() => {
        // Silent persistence failure — messages are still in UI state
      })
    },
    [session.id],
  )

  const selectedResume = resumes.find((r) => r.id === selectedResumeId)

  return (
    <div className="flex" style={{ height: "calc(100vh - 56px)" }}>
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/admin/resume-builder/career-coach">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">{session.topic}</h2>
            <Badge variant="secondary" className="mt-0.5 gap-1 text-xs">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {selectedResume && (
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                Using {selectedResume.title}
                <button
                  type="button"
                  onClick={() => setSelectedResumeId("")}
                  className="hover:text-foreground ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select resume" />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((resume) => (
                  <SelectItem key={resume.id} value={resume.id}>
                    {resume.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* AgentChat — streaming agentic chat */}
        <AgentChat
          apiEndpoint="/api/agents/coach"
          body={{ resumeId: selectedResumeId }}
          onToolResult={handleToolResult}
          onMessagesChange={handleMessagesChange}
          placeholder="Tell me about a role, project, or skill..."
          emptyMessage={getWelcomeMessage(session.session_type)}
        />
      </div>

      {/* Sidebar for builder sessions */}
      {hasSidebar && (
        <>
          <Separator orientation="vertical" />
          <div className="hidden w-80 flex-col lg:flex">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Saved Items</h3>
              <p className="text-muted-foreground text-xs">
                {savedItems.length} item{savedItems.length !== 1 ? "s" : ""} saved to resume
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                {savedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="text-muted-foreground mb-2 h-8 w-8" />
                    <p className="text-muted-foreground text-sm">
                      Items will appear here as the coach saves them to your resume.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedItems.map((item, i) => (
                      <BulletItem key={i} text={item} />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  )
}

// ===== Helpers =====

function getWelcomeMessage(sessionType: CoachSessionType): string {
  switch (sessionType) {
    case "experience_builder":
      return "I'll interview you about your work experience to extract strong, metrics-driven bullet points. Tell me about a role or project you'd like to document."
    case "project_builder":
      return "Let's document your projects. Tell me about a project, and I'll help you write compelling descriptions with measurable impact."
    case "interview_prep":
      return "I'll help you prepare for behavioral interviews using the STAR method. Ready to start?"
    case "career_narrative":
      return "Let's build a cohesive story that connects your experiences. Tell me about your career journey."
    default:
      return "I'm your AI career coach. Ask me anything about your career, resume strategy, or professional development."
  }
}
