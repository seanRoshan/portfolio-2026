"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ExperienceOption {
  id: string
  company: string
  role: string
}

interface ExperienceSelectorProps {
  experiences: ExperienceOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function ExperienceSelector({
  experiences,
  selectedIds,
  onChange,
}: ExperienceSelectorProps) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  if (experiences.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border p-4 text-sm">
        No experiences available. Add experience entries first.
      </p>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      {experiences.map((exp) => (
        <div key={exp.id} className="flex items-center gap-2">
          <Checkbox
            id={`exp-${exp.id}`}
            checked={selectedIds.includes(exp.id)}
            onCheckedChange={() => toggle(exp.id)}
          />
          <Label htmlFor={`exp-${exp.id}`} className="cursor-pointer text-sm">
            {exp.company} — {exp.role}
          </Label>
        </div>
      ))}
    </div>
  )
}
