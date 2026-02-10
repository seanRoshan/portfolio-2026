"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface CertificationOption {
  id: string
  name: string
  issuer: string
}

interface CertificationSelectorProps {
  certifications: CertificationOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function CertificationSelector({
  certifications,
  selectedIds,
  onChange,
}: CertificationSelectorProps) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  if (certifications.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border p-4 text-sm">
        No certifications available. Add certifications first.
      </p>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      {certifications.map((cert) => (
        <div key={cert.id} className="flex items-center gap-2">
          <Checkbox
            id={`cert-${cert.id}`}
            checked={selectedIds.includes(cert.id)}
            onCheckedChange={() => toggle(cert.id)}
          />
          <Label htmlFor={`cert-${cert.id}`} className="cursor-pointer text-sm">
            {cert.name} — {cert.issuer}
          </Label>
        </div>
      ))}
    </div>
  )
}
