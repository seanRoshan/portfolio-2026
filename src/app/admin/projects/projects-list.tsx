"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
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
import { deleteProject, updateProjectOrder } from "./actions"
import type { Project } from "@/types/database"

function SortableRow({ project }: { project: Project }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project.id })
  const [showDelete, setShowDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProject(project.id)
      if (result?.error) toast.error(result.error)
      else toast.success("Project deleted")
      setShowDelete(false)
    })
  }

  return (
    <>
      <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-lg border p-3">
        <button type="button" className="cursor-grab text-muted-foreground" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        {project.thumbnail_url && (
          <Image
            src={project.thumbnail_url}
            alt={project.title}
            width={48}
            height={48}
            className="rounded object-cover"
            unoptimized
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{project.title}</p>
          <p className="text-xs text-muted-foreground truncate">{project.short_description}</p>
        </div>
        <div className="flex items-center gap-2">
          {project.featured && <Badge variant="secondary">Featured</Badge>}
          <Badge variant={project.published ? "default" : "outline"}>
            {project.published ? "Published" : "Draft"}
          </Badge>
          <Link href={`/admin/projects/${project.id}`}>
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
            <DialogTitle>Delete &quot;{project.title}&quot;?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
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

export function ProjectsList({ projects: initial }: { projects: Project[] }) {
  const [projects, setProjects] = useState(initial)
  const [, startTransition] = useTransition()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id)
      const newIndex = projects.findIndex((p) => p.id === over.id)
      const reordered = arrayMove(projects, oldIndex, newIndex)
      setProjects(reordered)
      startTransition(async () => {
        const result = await updateProjectOrder(reordered.map((p) => p.id))
        if (result?.error) toast.error(result.error)
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{projects.length} projects</p>
        <Link href="/admin/projects/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {projects.map((project) => (
              <SortableRow key={project.id} project={project} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {projects.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No projects yet. Create your first one!</p>
      )}
    </div>
  )
}
