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
import { deleteEducation, updateEducationOrder } from "./actions"
import type { Education } from "@/types/database"

function SortableRow({ entry }: { entry: Education }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entry.id })
  const [showDelete, setShowDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteEducation(entry.id)
      if (result?.error) toast.error(result.error)
      else toast.success("Education deleted")
      setShowDelete(false)
    })
  }

  return (
    <>
      <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-lg border p-3">
        <button
          type="button"
          className="text-muted-foreground cursor-grab"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{entry.school}</p>
          <p className="text-muted-foreground truncate text-sm">
            {[entry.degree, entry.field].filter(Boolean).join(" in ")}
            {entry.year && ` · ${entry.year}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={entry.published ? "default" : "outline"}>
            {entry.published ? "Published" : "Draft"}
          </Badge>
          <Link href={`/admin/education/${entry.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive h-8 w-8"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this education entry?</DialogTitle>
            <DialogDescription>
              {entry.degree} at {entry.school}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
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

export function EducationList({ entries: initial }: { entries: Education[] }) {
  const [entries, setEntries] = useState(initial)
  const [, startTransition] = useTransition()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = entries.findIndex((e) => e.id === active.id)
      const newIndex = entries.findIndex((e) => e.id === over.id)
      const reordered = arrayMove(entries, oldIndex, newIndex)
      setEntries(reordered)
      startTransition(async () => {
        const result = await updateEducationOrder(reordered.map((e) => e.id))
        if (result?.error) toast.error(result.error)
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{entries.length} entries</p>
        <Link href="/admin/education/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Education
          </Button>
        </Link>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {entries.map((entry) => (
              <SortableRow key={entry.id} entry={entry} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {entries.length === 0 && (
        <p className="text-muted-foreground py-8 text-center">No education entries yet.</p>
      )}
    </div>
  )
}
