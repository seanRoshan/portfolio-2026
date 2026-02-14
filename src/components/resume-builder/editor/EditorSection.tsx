'use client'

import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface EditorSectionProps {
  title: string
  icon: LucideIcon
  id: string
  badge?: string
  action?: React.ReactNode
  children: React.ReactNode
}

export function EditorSection({
  title,
  icon: Icon,
  id,
  badge,
  action,
  children,
}: EditorSectionProps) {
  return (
    <section id={id} className="scroll-mt-16">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold">{title}</h2>
          {badge && (
            <Badge variant="outline" className="text-[10px]">
              {badge}
            </Badge>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
