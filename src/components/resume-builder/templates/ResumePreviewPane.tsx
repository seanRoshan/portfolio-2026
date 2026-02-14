'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { PragmaticTemplate } from './PragmaticTemplate'
import { MonoTemplate } from './MonoTemplate'
import { SmarkdownTemplate } from './SmarkdownTemplate'
import { CareerCupTemplate } from './CareerCupTemplate'
import { ParkerTemplate } from './ParkerTemplate'
import { ExperiencedTemplate } from './ExperiencedTemplate'
import type { ResumeWithRelations } from '@/types/resume-builder'

interface Props {
  resume: ResumeWithRelations
}

const templateMap: Record<string, React.ComponentType<{ resume: ResumeWithRelations }>> = {
  'a1b2c3d4-0001-4000-8000-000000000001': PragmaticTemplate,
  'a1b2c3d4-0002-4000-8000-000000000002': MonoTemplate,
  'a1b2c3d4-0003-4000-8000-000000000003': SmarkdownTemplate,
  'a1b2c3d4-0004-4000-8000-000000000004': CareerCupTemplate,
  'a1b2c3d4-0005-4000-8000-000000000005': ParkerTemplate,
  'a1b2c3d4-0006-4000-8000-000000000006': ExperiencedTemplate,
}

export function ResumePreviewPane({ resume }: Props) {
  const TemplateComponent =
    templateMap[resume.template_id ?? ''] ?? PragmaticTemplate

  return (
    <ScrollArea className="h-full">
      <div className="flex justify-center p-6">
        <div
          className="origin-top bg-white shadow-lg"
          style={{
            width: '8.5in',
            minHeight: '11in',
            transform: 'scale(0.6)',
            transformOrigin: 'top center',
          }}
        >
          <TemplateComponent resume={resume} />
        </div>
      </div>
    </ScrollArea>
  )
}
