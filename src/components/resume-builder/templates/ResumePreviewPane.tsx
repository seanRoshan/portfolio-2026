'use client'

import { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PragmaticTemplate } from './PragmaticTemplate'
import { MonoTemplate } from './MonoTemplate'
import { SmarkdownTemplate } from './SmarkdownTemplate'
import { CareerCupTemplate } from './CareerCupTemplate'
import { ParkerTemplate } from './ParkerTemplate'
import { ExperiencedTemplate } from './ExperiencedTemplate'
import { googleFontUrl } from '@/lib/resume-builder/fonts'
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

const ZOOM_LEVELS = [0.4, 0.5, 0.6, 0.75, 0.85, 1.0]
const DEFAULT_ZOOM_INDEX = 2 // 0.6 = 60%
const PAGE_HEIGHT_IN = 11 // US Letter height in inches
const PAGE_GAP_PX = 16

export function ResumePreviewPane({ resume }: Props) {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const zoom = ZOOM_LEVELS[zoomIndex]
  const paperRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)

  const TemplateComponent =
    templateMap[resume.template_id ?? ''] ?? PragmaticTemplate

  const fontFamily = resume.settings?.font_family ?? 'Inter'
  const fontUrl = googleFontUrl(fontFamily)

  // Measure content height and calculate page count
  useEffect(() => {
    if (!paperRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const heightPx = entry.contentRect.height
        // 1in = 96px in CSS
        const pages = Math.max(1, Math.ceil(heightPx / (PAGE_HEIGHT_IN * 96)))
        setPageCount(pages)
      }
    })
    observer.observe(paperRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative h-full">
      <link rel="stylesheet" href={fontUrl} />
      <ScrollArea className="h-full">
        <div className="flex justify-center p-6">
          <div
            style={{
              width: `${8.5 * zoom}in`,
              position: 'relative',
            }}
          >
            {/* Scaled paper */}
            <div
              ref={paperRef}
              className="origin-top bg-white shadow-lg"
              style={{
                width: '8.5in',
                minHeight: `${PAGE_HEIGHT_IN}in`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              <TemplateComponent resume={resume} />
            </div>

            {/* Page break indicators (overlaid) */}
            {Array.from({ length: pageCount - 1 }, (_, i) => {
              const topPx = (i + 1) * PAGE_HEIGHT_IN * 96 * zoom
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: `${topPx}px`,
                    left: 0,
                    right: 0,
                    height: `${PAGE_GAP_PX}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      right: 0,
                      borderTop: '1.5px dashed #d1d5db',
                    }}
                  />
                  <span className="relative rounded bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    Page {i + 2}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Page count indicator */}
      {pageCount > 1 && (
        <div className="bg-background/90 absolute top-3 right-3 rounded-md border px-2 py-1 text-xs font-medium shadow-sm backdrop-blur-sm">
          {pageCount} pages
        </div>
      )}

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
