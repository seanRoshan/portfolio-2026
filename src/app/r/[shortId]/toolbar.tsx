"use client"

import { useState } from "react"
import { Share2, Download, Printer, Check } from "lucide-react"

interface Props {
  resumeId: string
}

export function ResumeToolbar({ resumeId }: Props) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select a temporary input
      const input = document.createElement("input")
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/resume-builder/pdf?resumeId=${resumeId}`)
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download =
        res.headers.get("content-disposition")?.match(/filename="?(.+?)"?$/)?.[1] ?? "resume.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Failed to download PDF. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-0.5 rounded-full border border-gray-200/80 bg-white/90 px-1.5 py-1 shadow-sm backdrop-blur-sm print:hidden">
      <ToolbarButton onClick={handleShare} label={copied ? "Copied!" : "Copy link"}>
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Share2 className="h-3.5 w-3.5" />
        )}
      </ToolbarButton>

      <div className="mx-0.5 h-4 w-px bg-gray-200" />

      <ToolbarButton onClick={handleDownload} label="Download PDF" disabled={downloading}>
        <Download className={`h-3.5 w-3.5 ${downloading ? "animate-pulse" : ""}`} />
      </ToolbarButton>

      <div className="mx-0.5 h-4 w-px bg-gray-200" />

      <ToolbarButton onClick={handlePrint} label="Print">
        <Printer className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
    >
      {children}
    </button>
  )
}
