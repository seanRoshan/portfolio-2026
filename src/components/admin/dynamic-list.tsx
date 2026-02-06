"use client"

import { useState } from "react"
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
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DynamicListProps {
  items: string[]
  onChange: (items: string[]) => void
  label?: string
  placeholder?: string
  maxItems?: number
}

function SortableItem({
  id,
  value,
  onRemove,
  onEdit,
}: {
  id: string
  value: string
  onRemove: () => void
  onEdit: (value: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        className="text-muted-foreground cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input value={value} onChange={(e) => onEdit(e.target.value)} className="flex-1" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive h-8 w-8"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function DynamicList({ items, onChange, label, placeholder, maxItems }: DynamicListProps) {
  const [newValue, setNewValue] = useState("")
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Stable IDs for each item
  const itemIds = items.map((_, i) => `item-${i}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = itemIds.indexOf(active.id as string)
      const newIndex = itemIds.indexOf(over.id as string)
      onChange(arrayMove(items, oldIndex, newIndex))
    }
  }

  function addItem() {
    const trimmed = newValue.trim()
    if (!trimmed) return
    if (maxItems && items.length >= maxItems) return
    onChange([...items, trimmed])
    setNewValue("")
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function editItem(index: number, value: string) {
    const updated = [...items]
    updated[index] = value
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item, i) => (
              <SortableItem
                key={itemIds[i]}
                id={itemIds[i]}
                value={item}
                onRemove={() => removeItem(i)}
                onEdit={(v) => editItem(i, v)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex items-center gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={placeholder ?? "Add item..."}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addItem()
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addItem}
          disabled={!newValue.trim() || (maxItems != null && items.length >= maxItems)}
          className="h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
