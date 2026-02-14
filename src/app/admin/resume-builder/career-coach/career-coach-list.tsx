'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  MessageSquare,
  Briefcase,
  FolderKanban,
  Target,
  BookOpen,
  Trash2,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createCoachSession, deleteCoachSession } from './actions'
import type { CareerCoachSession, CoachSessionType } from '@/types/resume-builder'

const SESSION_TYPES: {
  value: CoachSessionType
  label: string
  description: string
  icon: typeof MessageSquare
}[] = [
  {
    value: 'general',
    label: 'General Career Advice',
    description: 'Get guidance on your career trajectory',
    icon: MessageSquare,
  },
  {
    value: 'experience_builder',
    label: 'Experience Builder',
    description: 'Interview me about my work to generate bullet points',
    icon: Briefcase,
  },
  {
    value: 'project_builder',
    label: 'Project Builder',
    description: 'Help document my projects',
    icon: FolderKanban,
  },
  {
    value: 'interview_prep',
    label: 'Interview Prep',
    description: 'Practice behavioral questions using STAR method',
    icon: Target,
  },
  {
    value: 'career_narrative',
    label: 'Career Narrative',
    description: 'Build a cohesive career story',
    icon: BookOpen,
  },
]

function getSessionTypeConfig(type: CoachSessionType) {
  return SESSION_TYPES.find((t) => t.value === type) ?? SESSION_TYPES[0]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface CareerCoachListProps {
  sessions: CareerCoachSession[]
}

export function CareerCoachList({ sessions }: CareerCoachListProps) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [topic, setTopic] = useState('')
  const [sessionType, setSessionType] = useState<CoachSessionType>('general')

  function handleCreate() {
    startTransition(async () => {
      try {
        const session = await createCoachSession({
          topic: topic || 'New Session',
          session_type: sessionType,
        })
        setShowCreate(false)
        setTopic('')
        setSessionType('general')
        toast.success('Session created')
        router.push(`/admin/resume-builder/career-coach/${session.id}`)
      } catch {
        toast.error('Failed to create session')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteCoachSession(id)
        setShowDelete(null)
        toast.success('Session deleted')
      } catch {
        toast.error('Failed to delete session')
      }
    })
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Career Coach</h2>
          <p className="text-muted-foreground text-sm">
            AI-powered coaching sessions to build your resume content and
            prepare for interviews.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">No sessions yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Start a coaching session to get personalized career guidance.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Start Session
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => {
            const config = getSessionTypeConfig(session.session_type)
            const Icon = config.icon
            return (
              <Card
                key={session.id}
                className="group relative cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                onClick={() =>
                  router.push(
                    `/admin/resume-builder/career-coach/${session.id}`
                  )
                }
              >
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="line-clamp-1 font-semibold">
                        {session.topic}
                      </h3>
                      <Badge variant="secondary" className="mt-1 gap-1 text-xs">
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDelete(session.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-muted-foreground space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {session.messages.length} message
                      {session.messages.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Updated {formatDate(session.updated_at)}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Session Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Coaching Session</DialogTitle>
            <DialogDescription>
              Choose a session type and topic to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Session Type</Label>
              <div className="mt-2 grid gap-2">
                {SESSION_TYPES.map((type) => {
                  const Icon = type.icon
                  const isSelected = sessionType === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSessionType(type.value)}
                    >
                      <Icon
                        className={`mt-0.5 h-5 w-5 shrink-0 ${
                          isSelected
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium">{type.label}</div>
                        <div className="text-muted-foreground text-xs">
                          {type.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Document my backend migration project"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Creating...' : 'Start Session'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The entire conversation history will
              be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDelete(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDelete && handleDelete(showDelete)}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
