'use client'

import { useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PragmaticTemplate } from './PragmaticTemplate'
import { MonoTemplate } from './MonoTemplate'
import { SmarkdownTemplate } from './SmarkdownTemplate'
import { CareerCupTemplate } from './CareerCupTemplate'
import { ParkerTemplate } from './ParkerTemplate'
import { ExperiencedTemplate } from './ExperiencedTemplate'
import type { ResumeWithRelations } from '@/types/resume-builder'
import { googleFontUrl } from '@/lib/resume-builder/fonts'

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

const ZOOM_LEVELS = [0.4, 0.5, 0.6, 0.75, 0.85, 1.0]
const DEFAULT_ZOOM_INDEX = 2 // 0.6 = 60%

export function ResumePreviewPane({ resume }: Props) {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const zoom = ZOOM_LEVELS[zoomIndex]

  const TemplateComponent =
    templateMap[resume.template_id ?? ''] ?? PragmaticTemplate

  const fontFamily = resume.settings?.font_family ?? 'Inter'
  const fontUrl = googleFontUrl(fontFamily)

  return (
    <div className="relative h-full">
      <link rel="stylesheet" href={fontUrl} />
      <ScrollArea className="h-full">
        <div className="flex justify-center p-6">
          <div
            className="origin-top bg-white shadow-lg"
            style={{
              width: '8.5in',
              minHeight: '11in',
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          >
            <TemplateComponent resume={resume} />
          </div>
        </div>
      </ScrollArea>

      {/* Zoom Controls */}
      <div className="bg-background/90 absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border px-2 py-1 shadow-md backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          disabled={zoomIndex === 0}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>

        <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums">
          {Math.round(zoom * 100)}%
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
          disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>

        <div className="bg-border mx-1 h-4 w-px" />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setZoomIndex(DEFAULT_ZOOM_INDEX)}
          disabled={zoomIndex === DEFAULT_ZOOM_INDEX}
          aria-label="Reset zoom"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
