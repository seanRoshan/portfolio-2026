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

interface KeyValueItem {
  label: string
  value: string
}

interface DynamicKeyValueListProps {
  items: KeyValueItem[]
  onChange: (items: KeyValueItem[]) => void
  keyLabel?: string
  valueLabel?: string
}

function SortableRow({
  id,
  item,
  keyLabel,
  valueLabel,
  onRemove,
  onEdit,
}: {
  id: string
  item: KeyValueItem
  keyLabel: string
  valueLabel: string
  onRemove: () => void
  onEdit: (item: KeyValueItem) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button type="button" className="cursor-grab text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        value={item.label}
        onChange={(e) => onEdit({ ...item, label: e.target.value })}
        placeholder={keyLabel}
        className="flex-1"
      />
      <Input
        value={item.value}
        onChange={(e) => onEdit({ ...item, value: e.target.value })}
        placeholder={valueLabel}
        className="flex-1"
      />
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function DynamicKeyValueList({
  items,
  onChange,
  keyLabel = "Label",
  valueLabel = "Value",
}: DynamicKeyValueListProps) {
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const itemIds = items.map((_, i) => `kv-${i}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = itemIds.indexOf(active.id as string)
      const newIndex = itemIds.indexOf(over.id as string)
      onChange(arrayMove(items, oldIndex, newIndex))
    }
  }

  function addItem() {
    if (!newKey.trim() || !newValue.trim()) return
    onChange([...items, { label: newKey.trim(), value: newValue.trim() }])
    setNewKey("")
    setNewValue("")
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function editItem(index: number, item: KeyValueItem) {
    const updated = [...items]
    updated[index] = item
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item, i) => (
              <SortableRow
                key={itemIds[i]}
                id={itemIds[i]}
                item={item}
                keyLabel={keyLabel}
                valueLabel={valueLabel}
                onRemove={() => removeItem(i)}
                onEdit={(v) => editItem(i, v)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex items-center gap-2">
        <Input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder={keyLabel}
          className="flex-1"
        />
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={valueLabel}
          className="flex-1"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem() } }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addItem}
          disabled={!newKey.trim() || !newValue.trim()}
          className="h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
