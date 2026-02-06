"use client"

import { useState, useTransition } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { getTechIcon } from "@/lib/tech-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SkillFormDialog } from "./skill-form"
import { deleteSkill } from "./actions"
import type { Skill } from "@/types/database"

const CATEGORIES = [
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "devops", label: "DevOps" },
  { key: "database", label: "Database" },
  { key: "tools", label: "Tools" },
]

export function SkillsList({ skills }: { skills: Skill[] }) {
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createCategory, setCreateCategory] = useState("frontend")
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteSkill(deleteTarget.id)
      if (result?.error) toast.error(result.error)
      else toast.success("Skill deleted")
      setDeleteTarget(null)
    })
  }

  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.key] = skills
        .filter((s) => s.category === cat.key)
        .sort((a, b) => a.sort_order - b.sort_order)
      return acc
    },
    {} as Record<string, Skill[]>,
  )

  return (
    <>
      <Tabs defaultValue="frontend">
        <div className="mb-4 flex items-center justify-between">
          <TabsList>
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.key} value={cat.key}>
                {cat.label} ({grouped[cat.key]?.length ?? 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.key} value={cat.key} className="space-y-2">
            {grouped[cat.key]?.map((skill) => {
              const tech = getTechIcon(skill.icon_name)
              const Icon = tech?.icon
              return (
                <div
                  key={skill.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 shrink-0" style={{ color: tech?.color }} />}
                    <span className="font-medium">{skill.name}</span>
                    {skill.icon_name && (
                      <span className="text-muted-foreground text-xs">{skill.icon_name}</span>
                    )}
                    <Badge variant={skill.published ? "default" : "outline"}>
                      {skill.published ? "Published" : "Draft"}
                    </Badge>
                    {skill.show_on_resume && (
                      <Badge variant="secondary" className="text-[10px]">
                        Resume
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingSkill(skill)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => setDeleteTarget(skill)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setCreateCategory(cat.key)
                setShowCreate(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add {cat.label} Skill
            </Button>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingSkill} onOpenChange={(open) => !open && setEditingSkill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
          </DialogHeader>
          {editingSkill && (
            <SkillFormDialog data={editingSkill} onDone={() => setEditingSkill(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Skill</DialogTitle>
          </DialogHeader>
          <SkillFormDialog
            data={{ category: createCategory } as Skill}
            onDone={() => setShowCreate(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
