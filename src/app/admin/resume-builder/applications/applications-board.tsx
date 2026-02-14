'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Trash2,
  Edit,
  MoreHorizontal,
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  Briefcase,
  TrendingUp,
  Trophy,
  GripVertical,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  createApplication,
  updateApplicationStatus,
  deleteApplication,
} from './actions'
import type {
  JobApplication,
  ApplicationStatus,
  RemoteType,
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

const KANBAN_COLUMNS: {
  id: string
  label: string
  statuses: ApplicationStatus[]
  headerColor: string
}[] = [
  {
    id: 'saved',
    label: 'Saved',
    statuses: ['saved'],
    headerColor: 'bg-slate-500',
  },
  {
    id: 'applied',
    label: 'Applied',
    statuses: ['applied'],
    headerColor: 'bg-blue-500',
  },
  {
    id: 'phone_screen',
    label: 'Phone Screen',
    statuses: ['phone_screen'],
    headerColor: 'bg-cyan-500',
  },
  {
    id: 'technical',
    label: 'Technical',
    statuses: ['technical'],
    headerColor: 'bg-violet-500',
  },
  {
    id: 'onsite',
    label: 'Onsite',
    statuses: ['onsite'],
    headerColor: 'bg-indigo-500',
  },
  {
    id: 'offer',
    label: 'Offer',
    statuses: ['offer'],
    headerColor: 'bg-emerald-500',
  },
  {
    id: 'closed',
    label: 'Closed',
    statuses: ['accepted', 'rejected', 'withdrawn'],
    headerColor: 'bg-gray-500',
  },
]

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

type SortField =
  | 'company'
  | 'position'
  | 'status'
  | 'applied_date'
  | 'salary_min'
  | 'location'
type SortDirection = 'asc' | 'desc'

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
  if (min == null && max == null) return '--'
  const fmt = (n: number) => {
    if (n >= 1000) return `${Math.round(n / 1000)}k`
    return n.toString()
  }
  const sym = currency === 'USD' ? '$' : currency
  if (min != null && max != null) return `${sym}${fmt(min)} - ${sym}${fmt(max)}`
  if (min != null) return `${sym}${fmt(min)}+`
  return `Up to ${sym}${fmt(max!)}`
}

// ===== Component =====

interface ApplicationsBoardProps {
  applications: JobApplication[]
  resumes: Resume[]
}

export function ApplicationsBoard({
  applications,
  resumes,
}: ApplicationsBoardProps) {
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('applied_date')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    url: '',
    status: 'saved' as ApplicationStatus,
    applied_date: '',
    notes: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    location: '',
    remote_type: '' as string,
    contact_name: '',
    contact_email: '',
    resume_id: '',
  })

  // ===== Stats =====
  const stats = useMemo(() => {
    const total = applications.length
    const applied = applications.filter((a) => a.status === 'applied').length
    const interviewing = applications.filter((a) =>
      ['phone_screen', 'technical', 'onsite'].includes(a.status)
    ).length
    const offers = applications.filter((a) =>
      ['offer', 'accepted'].includes(a.status)
    ).length
    const withResponse = applications.filter((a) => a.response_date).length
    const responseRate = total > 0 ? Math.round((withResponse / total) * 100) : 0

    return { total, applied, interviewing, offers, responseRate }
  }, [applications])

  // ===== Sorting & Filtering for List View =====
  const filteredAndSorted = useMemo(() => {
    let items = [...applications]

    if (statusFilter !== 'all') {
      items = items.filter((a) => a.status === statusFilter)
    }

    items.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'company':
          comparison = a.company.localeCompare(b.company)
          break
        case 'position':
          comparison = a.position.localeCompare(b.position)
          break
        case 'status': {
          const statusOrder = ALL_STATUSES.map((s) => s.value)
          comparison =
            statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
          break
        }
        case 'applied_date': {
          const dateA = a.applied_date ? new Date(a.applied_date).getTime() : 0
          const dateB = b.applied_date ? new Date(b.applied_date).getTime() : 0
          comparison = dateA - dateB
          break
        }
        case 'salary_min':
          comparison = (a.salary_min ?? 0) - (b.salary_min ?? 0)
          break
        case 'location':
          comparison = (a.location ?? '').localeCompare(b.location ?? '')
          break
      }
      return sortDir === 'asc' ? comparison : -comparison
    })

    return items
  }, [applications, statusFilter, sortField, sortDir])

  // ===== Kanban grouping =====
  const kanbanData = useMemo(() => {
    const grouped: Record<string, JobApplication[]> = {}
    for (const col of KANBAN_COLUMNS) {
      grouped[col.id] = applications.filter((a) =>
        col.statuses.includes(a.status)
      )
    }
    return grouped
  }, [applications])

  // ===== Handlers =====
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function resetForm() {
    setFormData({
      company: '',
      position: '',
      url: '',
      status: 'saved',
      applied_date: '',
      notes: '',
      salary_min: '',
      salary_max: '',
      salary_currency: 'USD',
      location: '',
      remote_type: '',
      contact_name: '',
      contact_email: '',
      resume_id: '',
    })
  }

  function handleCreate() {
    startTransition(async () => {
      try {
        await createApplication({
          company: formData.company,
          position: formData.position,
          url: formData.url || undefined,
          status: formData.status,
          applied_date: formData.applied_date || undefined,
          notes: formData.notes || undefined,
          salary_min: formData.salary_min
            ? Number(formData.salary_min)
            : null,
          salary_max: formData.salary_max
            ? Number(formData.salary_max)
            : null,
          salary_currency: formData.salary_currency,
          location: formData.location || undefined,
          remote_type: (formData.remote_type as RemoteType) || null,
          contact_name: formData.contact_name || undefined,
          contact_email: formData.contact_email || undefined,
          resume_id: formData.resume_id || null,
        })
        setShowCreate(false)
        resetForm()
        toast.success('Application created')
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to create application'
        )
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteApplication(id)
        setShowDelete(null)
        toast.success('Application deleted')
      } catch {
        toast.error('Failed to delete application')
      }
    })
  }

  // ===== Drag & Drop =====
  const handleDragStart = useCallback(
    (e: React.DragEvent, applicationId: string) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', applicationId)
      setDraggedId(applicationId)
    },
    []
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, columnId: string) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragOverColumn(columnId)
    },
    []
  )

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, column: (typeof KANBAN_COLUMNS)[number]) => {
      e.preventDefault()
      const applicationId = e.dataTransfer.getData('text/plain')
      setDraggedId(null)
      setDragOverColumn(null)

      if (!applicationId) return

      // Determine the target status -- use the first status in the column
      // For closed column, we need to figure out which sub-status makes sense
      const targetStatus = column.statuses[0]
      const app = applications.find((a) => a.id === applicationId)
      if (!app || app.status === targetStatus) return

      // If dropping in 'closed' column and app was already in one of the closed statuses, skip
      if (
        column.id === 'closed' &&
        column.statuses.includes(app.status)
      ) {
        return
      }

      startTransition(async () => {
        try {
          await updateApplicationStatus(applicationId, targetStatus)
          toast.success(
            `Moved to ${STATUS_CONFIG[targetStatus].label}`
          )
        } catch {
          toast.error('Failed to update status')
        }
      })
    },
    [applications]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverColumn(null)
  }, [])

  // ===== Render =====
  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Application Tracker
          </h2>
          <p className="text-muted-foreground text-sm">
            Track your job applications from saved to offer.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <Briefcase className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Interviewing
              </p>
              <p className="text-2xl font-bold">{stats.interviewing}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Offers</p>
              <p className="text-2xl font-bold">{stats.offers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <ArrowUpDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Response Rate
              </p>
              <p className="text-2xl font-bold">{stats.responseRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            Board
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <List className="h-4 w-4" />
            List
          </TabsTrigger>
        </TabsList>

        {/* ===== Board View ===== */}
        <TabsContent value="board">
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4 pt-2">
              {KANBAN_COLUMNS.map((column) => {
                const columnApps = kanbanData[column.id] ?? []
                const isOver = dragOverColumn === column.id

                return (
                  <div
                    key={column.id}
                    className={cn(
                      'flex w-[280px] shrink-0 flex-col rounded-lg border transition-colors',
                      isOver
                        ? 'border-primary/50 bg-primary/5'
                        : 'bg-muted/30'
                    )}
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column)}
                  >
                    {/* Column Header */}
                    <div className="flex items-center gap-2 p-3">
                      <div
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          column.headerColor
                        )}
                      />
                      <span className="text-sm font-semibold">
                        {column.label}
                      </span>
                      <Badge
                        variant="secondary"
                        className="ml-auto text-xs"
                      >
                        {columnApps.length}
                      </Badge>
                    </div>
                    <Separator />

                    {/* Cards */}
                    <div className="flex flex-col gap-2 p-2">
                      {columnApps.length === 0 ? (
                        <div className="text-muted-foreground flex h-20 items-center justify-center rounded border border-dashed text-xs">
                          No applications
                        </div>
                      ) : (
                        columnApps.map((app) => (
                          <KanbanCard
                            key={app.id}
                            application={app}
                            isDragging={draggedId === app.id}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDelete={(id) => setShowDelete(id)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>

        {/* ===== List View ===== */}
        <TabsContent value="list">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground h-4 w-4" />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-muted-foreground ml-auto text-sm">
              {filteredAndSorted.length} application
              {filteredAndSorted.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filteredAndSorted.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16">
              <Briefcase className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">
                No applications found
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {statusFilter !== 'all'
                  ? 'Try changing the filter.'
                  : 'Create your first application to get started.'}
              </p>
              {statusFilter === 'all' && (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Application
                </Button>
              )}
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader
                      label="Company"
                      field="company"
                      currentField={sortField}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Position"
                      field="position"
                      currentField={sortField}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Status"
                      field="status"
                      currentField={sortField}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Applied"
                      field="applied_date"
                      currentField={sortField}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Salary"
                      field="salary_min"
                      currentField={sortField}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Location"
                      field="location"
                      currentField={sortField}
                      direction={sortDir}
                      onSort={handleSort}
                    />
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSorted.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <Link
                          href={`/admin/resume-builder/applications/${app.id}`}
                          className="font-medium hover:underline"
                        >
                          {app.company}
                        </Link>
                      </TableCell>
                      <TableCell>{app.position}</TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(app.applied_date)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatSalary(
                          app.salary_min,
                          app.salary_max,
                          app.salary_currency
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {app.location ?? '--'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/resume-builder/applications/${app.id}`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setShowDelete(app.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ===== Create Application Dialog ===== */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Application</DialogTitle>
            <DialogDescription>
              Track a new job application. Required fields are marked.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {/* Row: Company + Position */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="create-company">Company *</Label>
                <Input
                  id="create-company"
                  placeholder="e.g., Google"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, company: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="create-position">Position *</Label>
                <Input
                  id="create-position"
                  placeholder="e.g., Senior SWE"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, position: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* URL */}
            <div>
              <Label htmlFor="create-url">Job URL</Label>
              <Input
                id="create-url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, url: e.target.value }))
                }
              />
            </div>

            {/* Row: Status + Applied Date */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="create-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((f) => ({
                      ...f,
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
                <Label htmlFor="create-applied-date">Applied Date</Label>
                <Input
                  id="create-applied-date"
                  type="date"
                  value={formData.applied_date}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      applied_date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Row: Salary Min + Max + Currency */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="create-salary-min">Salary Min</Label>
                <Input
                  id="create-salary-min"
                  type="number"
                  placeholder="e.g., 150000"
                  value={formData.salary_min}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      salary_min: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="create-salary-max">Salary Max</Label>
                <Input
                  id="create-salary-max"
                  type="number"
                  placeholder="e.g., 200000"
                  value={formData.salary_max}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      salary_max: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="create-currency">Currency</Label>
                <Select
                  value={formData.salary_currency}
                  onValueChange={(v) =>
                    setFormData((f) => ({ ...f, salary_currency: v }))
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

            {/* Row: Location + Remote Type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="create-location">Location</Label>
                <Input
                  id="create-location"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, location: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="create-remote">Remote Type</Label>
                <Select
                  value={formData.remote_type}
                  onValueChange={(v) =>
                    setFormData((f) => ({ ...f, remote_type: v }))
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

            {/* Row: Contact Name + Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="create-contact-name">Contact Name</Label>
                <Input
                  id="create-contact-name"
                  placeholder="Recruiter name"
                  value={formData.contact_name}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      contact_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="create-contact-email">Contact Email</Label>
                <Input
                  id="create-contact-email"
                  type="email"
                  placeholder="recruiter@company.com"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      contact_email: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Resume */}
            <div>
              <Label htmlFor="create-resume">Linked Resume</Label>
              <Select
                value={formData.resume_id}
                onValueChange={(v) =>
                  setFormData((f) => ({ ...f, resume_id: v }))
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

            {/* Notes */}
            <div>
              <Label htmlFor="create-notes">Notes</Label>
              <Textarea
                id="create-notes"
                placeholder="Any notes about this application..."
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={
                isPending || !formData.company || !formData.position
              }
              className="w-full"
            >
              {isPending ? 'Creating...' : 'Create Application'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation Dialog ===== */}
      <Dialog
        open={!!showDelete}
        onOpenChange={() => setShowDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This application record will be
              permanently deleted.
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

// ===== Sub-components =====

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

function SortableHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
}: {
  label: string
  field: SortField
  currentField: SortField
  direction: SortDirection
  onSort: (field: SortField) => void
}) {
  const isActive = currentField === field
  return (
    <TableHead>
      <button
        className="flex items-center gap-1 hover:underline"
        onClick={() => onSort(field)}
      >
        {label}
        <ArrowUpDown
          className={cn(
            'h-3.5 w-3.5',
            isActive ? 'text-foreground' : 'text-muted-foreground/50'
          )}
        />
      </button>
    </TableHead>
  )
}

function KanbanCard({
  application,
  isDragging,
  onDragStart,
  onDragEnd,
  onDelete,
}: {
  application: JobApplication
  isDragging: boolean
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  onDelete: (id: string) => void
}) {
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, application.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'group cursor-grab p-3 transition-opacity active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <div className="mb-1.5 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/resume-builder/applications/${application.id}`}
            className="line-clamp-1 text-sm font-semibold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {application.company}
          </Link>
          <p className="text-muted-foreground line-clamp-1 text-xs">
            {application.position}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <GripVertical className="text-muted-foreground/50 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/resume-builder/applications/${application.id}`}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {application.url && (
                <DropdownMenuItem asChild>
                  <a
                    href={application.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Job Post
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(application.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card Meta */}
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {application.applied_date && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(application.applied_date)}
          </span>
        )}
        {(application.salary_min != null ||
          application.salary_max != null) && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {formatSalary(
              application.salary_min,
              application.salary_max,
              application.salary_currency
            )}
          </span>
        )}
        {application.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {application.location}
          </span>
        )}
      </div>

      {/* Closed-column sub-badge */}
      {['accepted', 'rejected', 'withdrawn'].includes(application.status) && (
        <div className="mt-2">
          <StatusBadge status={application.status} />
        </div>
      )}
    </Card>
  )
}
