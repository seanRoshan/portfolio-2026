"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteExperience, updateExperienceOrder } from "./actions"
import type { Experience } from "@/types/database"

function SortableRow({ exp }: { exp: Experience }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exp.id })
  const [showDelete, setShowDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dateRange = `${exp.start_date}${exp.end_date ? ` — ${exp.end_date}` : " — Present"}`

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteExperience(exp.id)
      if (result?.error) toast.error(result.error)
      else toast.success("Experience deleted")
      setShowDelete(false)
    })
  }

  return (
    <>
      <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-lg border p-3">
        <button type="button" className="cursor-grab text-muted-foreground" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{exp.role}</p>
          <p className="text-sm text-muted-foreground truncate">{exp.company} &middot; {dateRange}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={exp.published ? "default" : "outline"}>
            {exp.published ? "Published" : "Draft"}
          </Badge>
          <Link href={`/admin/experience/${exp.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this experience entry?</DialogTitle>
            <DialogDescription>{exp.role} at {exp.company}. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function ExperienceList({ entries: initial }: { entries: Experience[] }) {
  const [entries, setEntries] = useState(initial)
  const [, startTransition] = useTransition()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = entries.findIndex((e) => e.id === active.id)
      const newIndex = entries.findIndex((e) => e.id === over.id)
      const reordered = arrayMove(entries, oldIndex, newIndex)
      setEntries(reordered)
      startTransition(async () => {
        const result = await updateExperienceOrder(reordered.map((e) => e.id))
        if (result?.error) toast.error(result.error)
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{entries.length} entries</p>
        <Link href="/admin/experience/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Experience
          </Button>
        </Link>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {entries.map((exp) => (
              <SortableRow key={exp.id} exp={exp} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {entries.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No experience entries yet.</p>
      )}
    </div>
  )
}
