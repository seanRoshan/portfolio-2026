"use client"

import { LINK_ANIMATIONS } from "@/components/AnimatedLink"
import { cn } from "@/lib/utils"

interface AnimationPickerProps {
  value: string
  onChange: (animation: string) => void
  label: string
}

export function AnimationPicker({ value, onChange, label }: AnimationPickerProps) {
  // Group animations by category
  const categories = LINK_ANIMATIONS.reduce(
    (acc, anim) => {
      if (!acc[anim.category]) acc[anim.category] = []
      acc[anim.category].push(anim)
      return acc
    },
    {} as Record<string, typeof LINK_ANIMATIONS[number][]>,
  )

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      {Object.entries(categories).map(([category, anims]) => (
        <div key={category}>
          <p className="text-muted-foreground/60 mb-2 text-xs font-semibold tracking-widest uppercase">
            {category}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {anims.map((anim) => (
              <button
                key={anim.id}
                type="button"
                onClick={() => onChange(anim.id)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all",
                  value === anim.id
                    ? "border-primary bg-primary/5 ring-primary ring-2"
                    : "hover:border-primary/30 hover:bg-accent/50",
                )}
              >
                <span className="text-xs font-medium">{anim.label}</span>
                <span
                  className={`link-hover-${anim.id} text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors`}
                >
                  Sample Link
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
