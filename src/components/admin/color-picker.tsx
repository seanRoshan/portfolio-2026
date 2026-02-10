"use client"

import { Input } from "@/components/ui/input"

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const displayValue = value || "#6366f1"

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 cursor-pointer rounded border p-1"
      />
      <Input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#6366f1"
        className="flex-1"
      />
      {value && (
        <div className="h-10 w-10 shrink-0 rounded border" style={{ backgroundColor: value }} />
      )}
    </div>
  )
}
