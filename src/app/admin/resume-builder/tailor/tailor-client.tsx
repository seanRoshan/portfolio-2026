"use client"

import { useState, useCallback } from "react"
import { FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { AgentChat } from "@/components/agent-chat"
import type { Resume } from "@/types/resume-builder"

interface TailorClientProps {
  resumes: Resume[]
}

export function TailorClient({ resumes }: TailorClientProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id ?? "")

  const selectedResume = resumes.find((r) => r.id === selectedResumeId)

  const handleToolResult = useCallback((toolName: string, result: unknown) => {
    const r = result as { success?: boolean; message?: string }
    if (r?.success && r?.message) {
      toast.success(r.message)
    }
  }, [])

  if (resumes.length === 0) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div className="text-center">
          <FileText className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
          <p className="text-muted-foreground text-sm">Create a resume first to use the Tailor.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: "calc(100vh - 56px)" }} className="flex flex-col">
      {/* Resume selector bar */}
      <div className="flex items-center gap-3 border-b px-4 py-2.5">
        <span className="text-muted-foreground text-xs font-medium">Resume:</span>
        <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
          <SelectTrigger className="h-8 w-60 text-xs">
            <SelectValue placeholder="Select resume" />
          </SelectTrigger>
          <SelectContent>
            {resumes.map((resume) => (
              <SelectItem key={resume.id} value={resume.id}>
                {resume.title}
                {resume.is_master && (
                  <Badge variant="secondary" className="ml-2 text-[9px]">
                    Master
                  </Badge>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedResume && (
          <Badge variant="outline" className="text-[10px]">
            {selectedResume.target_role ?? "No target role"}
          </Badge>
        )}
      </div>

      {/* Agent chat */}
      <div className="flex-1">
        <AgentChat
          key={selectedResumeId}
          apiEndpoint="/api/agents/tailor"
          body={{ resumeId: selectedResumeId }}
          onToolResult={handleToolResult}
          placeholder="Paste a job description or ask me to tailor your resume..."
          emptyMessage="I'm your Resume Tailor. Paste a job description and I'll analyze it, match it against your resume, and generate tailored bullet points."
        />
      </div>
    </div>
  )
}
