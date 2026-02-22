'use client'

import { useState, useTransition } from 'react'
import {
  Sparkles,
  Plus,
  Trash2,
  Play,
  Save,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  createPrompt,
  updatePrompt,
  deletePrompt,
  testPrompt,
} from './actions'
import type { AIPrompt } from '@/types/ai-prompts'

const categories = ['bullet', 'summary', 'description', 'general'] as const
const categoryLabels: Record<string, string> = {
  bullet: 'Bullet Points',
  summary: 'Summary',
  description: 'Descriptions',
  general: 'General',
}

interface Props {
  initialPrompts: AIPrompt[]
}

export function PromptEngineerClient({ initialPrompts }: Props) {
  const [prompts, setPrompts] = useState<AIPrompt[]>(initialPrompts)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPrompts[0]?.id ?? null
  )
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const selected = prompts.find((p) => p.id === selectedId) ?? null

  const grouped = prompts.reduce<Record<string, AIPrompt[]>>((acc, p) => {
    const cat = p.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const filteredGroups =
    filterCategory === 'all'
      ? grouped
      : { [filterCategory]: grouped[filterCategory] ?? [] }

  function handleCreated(prompt: AIPrompt) {
    setPrompts((prev) => [...prev, prompt])
    setSelectedId(prompt.id)
  }

  function handleUpdated(id: string, updates: Partial<AIPrompt>) {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  function handleDeleted(id: string) {
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    if (selectedId === id) {
      setSelectedId(prompts.find((p) => p.id !== id)?.id ?? null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Left: Prompt List */}
      <div className="w-72 shrink-0 border-r">
        <div className="flex items-center gap-2 border-b p-3">
          <Select
            value={filterCategory}
            onValueChange={setFilterCategory}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {categoryLabels[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <NewPromptButton onCreated={handleCreated} />
        </div>
        <ScrollArea className="h-[calc(100vh-7.5rem)]">
          <div className="p-2">
            {Object.entries(filteredGroups).map(([cat, items]) => (
              <div key={cat} className="mb-3">
                <p className="text-muted-foreground mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider">
                  {categoryLabels[cat] ?? cat}
                </p>
                {items.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                      selectedId === p.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.name}</span>
                    {p.is_default && (
                      <Badge
                        variant="secondary"
                        className="ml-auto text-[9px]"
                      >
                        Default
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Editor */}
      <div className="flex-1 overflow-auto">
        {selected ? (
          <PromptEditor
            key={selected.id}
            prompt={selected}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Select a prompt to edit
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function NewPromptButton({
  onCreated,
}: {
  onCreated: (p: AIPrompt) => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      try {
        const prompt = await createPrompt({
          slug: `custom_${Date.now()}`,
          name: 'New Prompt',
          category: 'general',
          description: '',
          system_prompt: 'You are a resume writing expert.',
          user_prompt_template: '{{text}}',
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
        })
        onCreated(prompt)
        toast.success('Prompt created')
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to create'
        )
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={handleCreate}
      disabled={isPending}
    >
      <Plus className="h-4 w-4" />
    </Button>
  )
}

function PromptEditor({
  prompt,
  onUpdated,
  onDeleted,
}: {
  prompt: AIPrompt
  onUpdated: (id: string, updates: Partial<AIPrompt>) => void
  onDeleted: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: prompt.name,
    slug: prompt.slug,
    category: prompt.category,
    description: prompt.description ?? '',
    system_prompt: prompt.system_prompt,
    user_prompt_template: prompt.user_prompt_template,
    model: prompt.model,
    max_tokens: prompt.max_tokens,
  })

  // Test panel state
  const [testVars, setTestVars] = useState('')
  const [testOutput, setTestOutput] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  function handleChange(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updatePrompt(prompt.id, form)
        onUpdated(prompt.id, form)
        toast.success('Prompt saved')
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to save'
        )
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deletePrompt(prompt.id)
        onDeleted(prompt.id)
        toast.success('Prompt deleted')
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to delete'
        )
      }
    })
  }

  function handleTest() {
    setIsTesting(true)
    setTestOutput('')
    // Parse test variables from "key=value" lines
    const vars: Record<string, string> = {}
    testVars.split('\n').forEach((line) => {
      const eq = line.indexOf('=')
      if (eq > 0) {
        vars[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
      }
    })

    testPrompt(
      form.system_prompt,
      form.user_prompt_template,
      vars,
      form.model,
      form.max_tokens
    )
      .then((result) => setTestOutput(result))
      .catch((err) => {
        setTestOutput(
          `Error: ${err instanceof Error ? err.message : String(err)}`
        )
      })
      .finally(() => setIsTesting(false))
  }

  // Extract variables from user_prompt_template
  const templateVars = Array.from(
    form.user_prompt_template.matchAll(/\{\{(\w+)\}\}/g)
  ).map((m) => m[1])

  return (
    <div className="space-y-6 p-6">
      {/* Header fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Name</Label>
          <Input
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Slug</Label>
          <Input
            value={form.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            className="font-mono text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => handleChange('category', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {categoryLabels[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Input
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="What this prompt does..."
          />
        </div>
      </div>

      <Separator />

      {/* Prompts */}
      <div className="space-y-2">
        <Label className="text-xs">System Prompt</Label>
        <Textarea
          value={form.system_prompt}
          onChange={(e) => handleChange('system_prompt', e.target.value)}
          rows={8}
          className="font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">User Prompt Template</Label>
          {templateVars.length > 0 && (
            <div className="flex gap-1">
              {templateVars.map((v) => (
                <Badge key={v} variant="secondary" className="text-[10px]">
                  {`{{${v}}}`}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Textarea
          value={form.user_prompt_template}
          onChange={(e) =>
            handleChange('user_prompt_template', e.target.value)
          }
          rows={6}
          className="font-mono text-xs"
        />
      </div>

      {/* Model & tokens */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Model</Label>
          <Select
            value={form.model}
            onValueChange={(v) => handleChange('model', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-sonnet-4-6">
                claude-sonnet-4-6
              </SelectItem>
              <SelectItem value="claude-haiku-4-5">
                claude-haiku-4-5
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">
            Max Tokens: {form.max_tokens}
          </Label>
          <input
            type="range"
            min={512}
            max={8192}
            step={256}
            value={form.max_tokens}
            onChange={(e) =>
              handleChange('max_tokens', parseInt(e.target.value))
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Save / Delete */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {isPending ? 'Saving...' : 'Save'}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              className="text-destructive"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this prompt?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;{prompt.name}&rdquo;.
                Resumes using this prompt will fall back to defaults.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Separator />

      {/* Test Panel */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Play className="h-4 w-4" />
          Test Panel
        </h3>
        <div className="space-y-2">
          <Label className="text-xs">
            Test Variables (one per line: key=value)
          </Label>
          <Textarea
            value={testVars}
            onChange={(e) => setTestVars(e.target.value)}
            rows={4}
            className="font-mono text-xs"
            placeholder={templateVars
              .map((v) => `${v}=sample value`)
              .join('\n')}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={isTesting}
        >
          {isTesting ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="mr-1.5 h-3.5 w-3.5" />
          )}
          Run Test
        </Button>
        {testOutput && (
          <div className="rounded-md border bg-muted p-3">
            <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
              Output
            </p>
            <p className="whitespace-pre-wrap text-xs">{testOutput}</p>
          </div>
        )}
      </div>
    </div>
  )
}
