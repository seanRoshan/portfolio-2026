'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Trash2,
  Edit,
  Mail,
  User,
  Globe,
  Wifi,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  Save,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
} from '../actions'
import type {
  JobApplication,
  ApplicationStatus,
  RemoteType,
  CoverLetter,
  Resume,
} from '@/types/resume-builder'

// ===== Constants =====

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bgColor: string }
> = {
  saved: {
    label: 'Saved',
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
  applied: {
    label: 'Applied',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
  },
  phone_screen: {
    label: 'Phone Screen',
    color: 'text-cyan-700 dark:text-cyan-300',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/40',
  },
  technical: {
    label: 'Technical',
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-100 dark:bg-violet-900/40',
  },
  onsite: {
    label: 'Onsite',
    color: 'text-indigo-700 dark:text-indigo-300',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
  },
  offer: {
    label: 'Offer',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  accepted: {
    label: 'Accepted',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
  },
}

const ALL_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'technical', label: 'Technical' },
  { value: 'onsite', label: 'Onsite' },
  { value: 'offer', label: 'Offer' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

const REMOTE_TYPES: { value: RemoteType; label: string }[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
]

// ===== Helpers =====

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string
): string {
  if (min == null && max == null) return 'Not specified'
  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  })
  if (min != null && max != null) return `${fmt.format(min)} - ${fmt.format(max)}`
  if (min != null) return `${fmt.format(min)}+`
  return `Up to ${fmt.format(max!)}`
}

function remoteTypeLabel(type: RemoteType | null): string {
  if (!type) return 'Not specified'
  return REMOTE_TYPES.find((r) => r.value === type)?.label ?? type
}

// ===== Component =====

interface ApplicationDetailProps {
  application: JobApplication
  coverLetters: CoverLetter[]
  resumes: Resume[]
}

export function ApplicationDetail({
  application,
  coverLetters,
  resumes,
}: ApplicationDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [notes, setNotes] = useState(application.notes ?? '')
  const [notesSaved, setNotesSaved] = useState(true)
  const daysSinceApplied = useMemo(() => {
    if (!application.applied_date) return null
    // eslint-disable-next-line react-hooks/purity -- computing elapsed days legitimately needs current time
    return Math.floor((Date.now() - new Date(application.applied_date).getTime()) / (1000 * 60 * 60 * 24))
  }, [application.applied_date])

  // Edit form state
  const [editData, setEditData] = useState({
    company: application.company,
    position: application.position,
    url: application.url ?? '',
    status: application.status,
    applied_date: application.applied_date ?? '',
    response_date: application.response_date ?? '',
    salary_min: application.salary_min?.toString() ?? '',
    salary_max: application.salary_max?.toString() ?? '',
    salary_currency: application.salary_currency,
    location: application.location ?? '',
    remote_type: (application.remote_type ?? '') as string,
    contact_name: application.contact_name ?? '',
    contact_email: application.contact_email ?? '',
    resume_id: application.resume_id ?? '',
    notes: application.notes ?? '',
  })

  function handleStatusChange(status: ApplicationStatus) {
    startTransition(async () => {
      try {
        await updateApplicationStatus(application.id, status)
        toast.success(`Status updated to ${STATUS_CONFIG[status].label}`)
      } catch {
        toast.error('Failed to update status')
      }
    })
  }

  function handleSaveNotes() {
    startTransition(async () => {
      try {
        await updateApplication(application.id, { notes: notes || null })
        setNotesSaved(true)
        toast.success('Notes saved')
      } catch {
        toast.error('Failed to save notes')
      }
    })
  }

  function handleEdit() {
    startTransition(async () => {
      try {
        await updateApplication(application.id, {
          company: editData.company,
          position: editData.position,
          url: editData.url || null,
          status: editData.status,
          applied_date: editData.applied_date || null,
          response_date: editData.response_date || null,
          salary_min: editData.salary_min
            ? Number(editData.salary_min)
            : null,
          salary_max: editData.salary_max
            ? Number(editData.salary_max)
            : null,
          salary_currency: editData.salary_currency,
          location: editData.location || null,
          remote_type: (editData.remote_type as RemoteType) || null,
          contact_name: editData.contact_name || null,
          contact_email: editData.contact_email || null,
          resume_id: editData.resume_id || null,
          notes: editData.notes || null,
        })
        setShowEdit(false)
        setNotes(editData.notes)
        setNotesSaved(true)
        toast.success('Application updated')
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to update application'
        )
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteApplication(application.id)
        toast.success('Application deleted')
        router.push('/admin/resume-builder/applications')
      } catch {
        toast.error('Failed to delete application')
      }
    })
  }

  // Timeline events
  const timeline = buildTimeline(application)

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back Link */}
      <Link
        href="/admin/resume-builder/applications"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <Building2 className="text-primary h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {application.company}
              </h2>
              <p className="text-muted-foreground text-base">
                {application.position}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={isPending}>
                <StatusBadge status={application.status} />
                <span className="sr-only">Change status</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ALL_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  className={cn(
                    application.status === s.value && 'bg-accent'
                  )}
                >
                  <span
                    className={cn(
                      'mr-2 inline-block h-2 w-2 rounded-full',
                      STATUS_CONFIG[s.value].bgColor
                    )}
                  />
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowEdit(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Info Grid */}
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Application Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                icon={Calendar}
                label="Applied Date"
                value={formatDate(application.applied_date)}
              />
              <InfoRow
                icon={Calendar}
                label="Response Date"
                value={formatDate(application.response_date)}
              />
              <InfoRow
                icon={MapPin}
                label="Location"
                value={application.location ?? 'Not specified'}
              />
              <InfoRow
                icon={Wifi}
                label="Remote Type"
                value={remoteTypeLabel(application.remote_type)}
              />
              <InfoRow
                icon={DollarSign}
                label="Salary Range"
                value={formatSalary(
                  application.salary_min,
                  application.salary_max,
                  application.salary_currency
                )}
              />
              <InfoRow
                icon={User}
                label="Contact"
                value={application.contact_name ?? 'Not specified'}
              />
              <InfoRow
                icon={Mail}
                label="Contact Email"
                value={application.contact_email ?? 'Not specified'}
              />
              {application.url ? (
                <div className="flex items-start gap-3">
                  <Globe className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">Job URL</p>
                    <a
                      href={application.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center gap-1 text-sm hover:underline"
                    >
                      <span className="truncate">{application.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>
              ) : (
                <InfoRow icon={Globe} label="Job URL" value="Not specified" />
              )}
            </div>

            {/* Linked Resume */}
            {application.resume && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center gap-3">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Linked Resume
                    </p>
                    <Link
                      href={`/admin/resume-builder/${application.resume.id}/edit`}
                      className="text-primary text-sm hover:underline"
                    >
                      {application.resume.title}
                    </Link>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Notes Section */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Notes</h3>
              {!notesSaved && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveNotes}
                  disabled={isPending}
                  className="gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isPending ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
            <Textarea
              placeholder="Add notes about this application, interview prep, follow-ups..."
              rows={5}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setNotesSaved(false)
              }}
            />
          </Card>

          {/* Cover Letters */}
          {coverLetters.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 font-semibold">Cover Letters</h3>
              <div className="space-y-2">
                {coverLetters.map((cl) => (
                  <div
                    key={cl.id}
                    className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {cl.company} - {cl.position}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(cl.created_at)} &middot;{' '}
                        {cl.tone.charAt(0).toUpperCase() + cl.tone.slice(1)}{' '}
                        tone
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {cl.tone}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar - Timeline */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Timeline</h3>
            <div className="space-y-0">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative flex gap-3 pb-6 last:pb-0">
                  {/* Connector line */}
                  {idx < timeline.length - 1 && (
                    <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
                  )}
                  {/* Icon */}
                  <div
                    className={cn(
                      'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                      event.variant === 'success' &&
                        'bg-green-100 dark:bg-green-900/40',
                      event.variant === 'destructive' &&
                        'bg-red-100 dark:bg-red-900/40',
                      event.variant === 'default' &&
                        'bg-blue-100 dark:bg-blue-900/40',
                      event.variant === 'muted' &&
                        'bg-muted'
                    )}
                  >
                    <TimelineIcon variant={event.variant} />
                  </div>
                  {/* Content */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{event.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {event.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-5">
            <h3 className="mb-3 font-semibold">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={application.status} />
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days since applied</span>
                <span className="font-medium">
                  {daysSinceApplied ?? '--'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last updated</span>
                <span className="font-medium">
                  {formatDate(application.updated_at)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ===== Edit Dialog ===== */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              Update the details for this application.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-company">Company *</Label>
                <Input
                  id="edit-company"
                  value={editData.company}
                  onChange={(e) =>
                    setEditData((d) => ({ ...d, company: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-position">Position *</Label>
                <Input
                  id="edit-position"
                  value={editData.position}
                  onChange={(e) =>
                    setEditData((d) => ({ ...d, position: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-url">Job URL</Label>
              <Input
                id="edit-url"
                value={editData.url}
                onChange={(e) =>
                  setEditData((d) => ({ ...d, url: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editData.status}
                  onValueChange={(v) =>
                    setEditData((d) => ({
                      ...d,
                      status: v as ApplicationStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-applied-date">Applied Date</Label>
                <Input
                  id="edit-applied-date"
                  type="date"
                  value={editData.applied_date}
                  onChange={(e) =>
                    setEditData((d) => ({
                      ...d,
                      applied_date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-response-date">Response Date</Label>
              <Input
                id="edit-response-date"
                type="date"
                value={editData.response_date}
                onChange={(e) =>
                  setEditData((d) => ({
                    ...d,
                    response_date: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="edit-salary-min">Salary Min</Label>
                <Input
                  id="edit-salary-min"
                  type="number"
                  value={editData.salary_min}
                  onChange={(e) =>
                    setEditData((d) => ({
                      ...d,
                      salary_min: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-salary-max">Salary Max</Label>
                <Input
                  id="edit-salary-max"
                  type="number"
                  value={editData.salary_max}
                  onChange={(e) =>
                    setEditData((d) => ({
                      ...d,
                      salary_max: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-currency">Currency</Label>
                <Select
                  value={editData.salary_currency}
                  onValueChange={(v) =>
                    setEditData((d) => ({ ...d, salary_currency: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editData.location}
                  onChange={(e) =>
                    setEditData((d) => ({ ...d, location: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-remote">Remote Type</Label>
                <Select
                  value={editData.remote_type}
                  onValueChange={(v) =>
                    setEditData((d) => ({ ...d, remote_type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REMOTE_TYPES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-contact-name">Contact Name</Label>
                <Input
                  id="edit-contact-name"
                  value={editData.contact_name}
                  onChange={(e) =>
                    setEditData((d) => ({
                      ...d,
                      contact_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-contact-email">Contact Email</Label>
                <Input
                  id="edit-contact-email"
                  type="email"
                  value={editData.contact_email}
                  onChange={(e) =>
                    setEditData((d) => ({
                      ...d,
                      contact_email: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-resume">Linked Resume</Label>
              <Select
                value={editData.resume_id}
                onValueChange={(v) =>
                  setEditData((d) => ({ ...d, resume_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resume..." />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={4}
                value={editData.notes}
                onChange={(e) =>
                  setEditData((d) => ({ ...d, notes: e.target.value }))
                }
              />
            </div>

            <Button
              onClick={handleEdit}
              disabled={
                isPending || !editData.company || !editData.position
              }
              className="w-full"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The application for{' '}
              <strong>
                {application.position} at {application.company}
              </strong>{' '}
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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

// ===== Types =====

type TimelineVariant = 'success' | 'destructive' | 'default' | 'muted'

interface TimelineEvent {
  label: string
  date: string
  variant: TimelineVariant
}

// ===== Sub-components =====

function TimelineIcon({ variant }: { variant: TimelineVariant }) {
  switch (variant) {
    case 'success':
      return (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
      )
    case 'destructive':
      return (
        <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
      )
    case 'default':
      return (
        <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      )
    case 'muted':
      return <Circle className="text-muted-foreground h-3.5 w-3.5" />
  }
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      variant="secondary"
      className={cn('text-xs', config.bgColor, config.color)}
    >
      {config.label}
    </Badge>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

// ===== Timeline Builder =====

function buildTimeline(app: JobApplication): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // Created
  events.push({
    label: 'Application created',
    date: formatDate(app.created_at),
    variant: 'muted',
  })

  // Applied
  if (app.applied_date) {
    events.push({
      label: 'Applied',
      date: formatDate(app.applied_date),
      variant: 'default',
    })
  }

  // Response received
  if (app.response_date) {
    events.push({
      label: 'Response received',
      date: formatDate(app.response_date),
      variant: 'default',
    })
  }

  // Current status marker (if beyond applied)
  const advancedStatuses: ApplicationStatus[] = [
    'phone_screen',
    'technical',
    'onsite',
    'offer',
    'accepted',
  ]
  if (advancedStatuses.includes(app.status)) {
    events.push({
      label: `Moved to ${STATUS_CONFIG[app.status].label}`,
      date: formatDate(app.updated_at),
      variant: app.status === 'accepted' ? 'success' : 'default',
    })
  }

  // Rejected / Withdrawn
  if (app.status === 'rejected') {
    events.push({
      label: 'Rejected',
      date: formatDate(app.updated_at),
      variant: 'destructive',
    })
  }
  if (app.status === 'withdrawn') {
    events.push({
      label: 'Withdrawn',
      date: formatDate(app.updated_at),
      variant: 'destructive',
    })
  }

  return events
}
