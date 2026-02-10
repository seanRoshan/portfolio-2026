"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface EducationOption {
  id: string
  school: string
  degree: string
}

interface EducationSelectorProps {
  education: EducationOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function EducationSelector({ education, selectedIds, onChange }: EducationSelectorProps) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  if (education.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border p-4 text-sm">
        No education entries available. Add education entries first.
      </p>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      {education.map((edu) => (
        <div key={edu.id} className="flex items-center gap-2">
          <Checkbox
            id={`edu-${edu.id}`}
            checked={selectedIds.includes(edu.id)}
            onCheckedChange={() => toggle(edu.id)}
          />
          <Label htmlFor={`edu-${edu.id}`} className="cursor-pointer text-sm">
            {edu.school} — {edu.degree}
          </Label>
        </div>
      ))}
    </div>
  )
}
