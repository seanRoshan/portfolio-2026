'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Briefcase,
  FolderKanban,
  Target,
  BookOpen,
  FileText,
  X,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  updateCoachSessionMessages,
  updateCoachSessionContent,
} from '../actions'
import type {
  CareerCoachSession,
  CoachMessage,
  CoachSessionType,
  Resume,
} from '@/types/resume-builder'

// ===== Constants =====

const SESSION_TYPE_CONFIG: Record<
  CoachSessionType,
  { label: string; icon: typeof MessageSquare }
> = {
  general: { label: 'General Career Advice', icon: MessageSquare },
  experience_builder: { label: 'Experience Builder', icon: Briefcase },
  project_builder: { label: 'Project Builder', icon: FolderKanban },
  interview_prep: { label: 'Interview Prep', icon: Target },
  career_narrative: { label: 'Career Narrative', icon: BookOpen },
}

// ===== Helper Functions =====

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function renderMessageContent(content: string): React.ReactNode[] {
  return content.split('\n').map((line, i) => {
    if (line.trim() === '') {
      return <br key={i} />
    }

    const parts = line.split(/(\*\*.*?\*\*)/g)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      return part
    })

    return (
      <p key={i} className="mb-1 last:mb-0">
        {rendered}
      </p>
    )
  })
}

function extractBulletPoints(messages: CoachMessage[]): string[] {
  const bullets: string[] = []
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue
    const lines = msg.content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (
        (trimmed.startsWith('- ') || trimmed.startsWith('* ')) &&
        trimmed.length > 20
      ) {
        bullets.push(trimmed.slice(2))
      }
    }
  }
  return bullets
}

// ===== Sub-Components =====

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="bg-muted-foreground/60 h-2 w-2 animate-bounce rounded-full [animation-delay:0ms]" />
      <span className="bg-muted-foreground/60 h-2 w-2 animate-bounce rounded-full [animation-delay:150ms]" />
      <span className="bg-muted-foreground/60 h-2 w-2 animate-bounce rounded-full [animation-delay:300ms]" />
    </div>
  )
}

interface BulletItemProps {
  text: string
}

function BulletItem({ text }: BulletItemProps) {
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
        {copied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  )
}

interface GeneratedContentPanelProps {
  sessionType: CoachSessionType
  bullets: string[]
}

function GeneratedContentPanel({
  sessionType,
  bullets,
}: GeneratedContentPanelProps) {
  const title =
    sessionType === 'experience_builder'
      ? 'Generated Bullets'
      : 'Generated Descriptions'

  if (bullets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <FileText className="text-muted-foreground mb-2 h-8 w-8" />
        <p className="text-muted-foreground text-sm">
          {sessionType === 'experience_builder'
            ? 'Achievement bullet points will appear here as the coach generates them.'
            : 'Project descriptions will appear here as the coach generates them.'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {bullets.map((bullet, i) => (
          <BulletItem key={i} text={bullet} />
        ))}
      </div>
    </div>
  )
}

// ===== Main Component =====

interface ChatInterfaceProps {
  session: CareerCoachSession
  resumes: Resume[]
}

export function ChatInterface({ session, resumes }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<CoachMessage[]>(session.messages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasSidebar =
    session.session_type === 'experience_builder' ||
    session.session_type === 'project_builder'

  const config = SESSION_TYPE_CONFIG[session.session_type]
  const Icon = config.icon
  const generatedBullets = extractBulletPoints(messages)

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return
    const scrollContainer = scrollRef.current.querySelector(
      '[data-radix-scroll-area-viewport]'
    )
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: CoachMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    // Resize textarea back to default
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const response = await fetch('/api/resume-builder/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          sessionType: session.session_type,
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          resumeId: selectedResumeId || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Failed to get response')
      }

      const data = await response.json()
      const assistantMessage: CoachMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)

      // Persist messages to database
      await updateCoachSessionMessages(session.id, finalMessages)

      // Update generated content if this is a builder session
      if (hasSidebar) {
        const bullets = extractBulletPoints(finalMessages)
        if (bullets.length > 0) {
          await updateCoachSessionContent(session.id, { bullets })
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send message'
      )
      // Remove the optimistic user message on failure
      setMessages(messages)
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectedResume = resumes.find((r) => r.id === selectedResumeId)

  return (
    <div
      className="flex"
      style={{ height: 'calc(100vh - 56px)' }}
    >
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
                  onClick={() => setSelectedResumeId('')}
                  className="hover:text-foreground ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Select
              value={selectedResumeId}
              onValueChange={setSelectedResumeId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Add resume context" />
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

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1">
          <div className="mx-auto max-w-3xl space-y-4 p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Icon className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">
                  {config.label}
                </h3>
                <p className="text-muted-foreground max-w-md text-sm">
                  {getWelcomeMessage(session.session_type)}
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {renderMessageContent(msg.content)}
                  </div>
                  <div
                    className={`mt-1 text-[10px] ${
                      msg.role === 'user'
                        ? 'text-primary-foreground/60'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl">
                  <LoadingDots />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="max-h-32 min-h-10 resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mx-auto mt-2 max-w-3xl text-center text-[10px]">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Sidebar for builder sessions */}
      {hasSidebar && (
        <>
          <Separator orientation="vertical" />
          <div className="hidden w-80 flex-col lg:flex">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold">
                {session.session_type === 'experience_builder'
                  ? 'Generated Bullets'
                  : 'Generated Descriptions'}
              </h3>
              <p className="text-muted-foreground text-xs">
                {generatedBullets.length} item
                {generatedBullets.length !== 1 ? 's' : ''} generated
              </p>
            </div>
            <ScrollArea className="flex-1">
              <GeneratedContentPanel
                sessionType={session.session_type}
                bullets={generatedBullets}
              />
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
    case 'experience_builder':
      return "I'll interview you about your work experience to help generate strong, metrics-driven bullet points for your resume. Tell me about a role or project you'd like to document."
    case 'project_builder':
      return "Let's document your projects together. Tell me about a project you've worked on, and I'll help you write compelling descriptions and achievement bullets."
    case 'interview_prep':
      return "I'll help you prepare for behavioral interviews using the STAR method. We can practice with questions tailored to your experience. Ready to start?"
    case 'career_narrative':
      return "Let's build a cohesive story that connects your experiences. Tell me about your career journey, and I'll help you craft a compelling narrative."
    default:
      return "I'm your AI career coach. Ask me anything about your career, resume strategy, job search, or professional development."
  }
}
