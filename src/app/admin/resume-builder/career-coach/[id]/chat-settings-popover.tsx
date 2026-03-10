"use client"

import { useState, useTransition } from "react"
import { Settings2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID, type ModelId } from "@/lib/ai/models"
import { updateAgentConfig } from "../actions"

interface ChatSettingsPopoverProps {
  slug: string
  initialConfig: {
    model_id: string | null
    max_tokens: number | null
    system_prompt: string | null
  }
}

export function ChatSettingsPopover({ slug, initialConfig }: ChatSettingsPopoverProps) {
  const [modelId, setModelId] = useState(initialConfig.model_id ?? DEFAULT_MODEL_ID)
  const [maxTokens, setMaxTokens] = useState(initialConfig.max_tokens ?? 4096)
  const [systemPrompt, setSystemPrompt] = useState(initialConfig.system_prompt ?? "")
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      try {
        await updateAgentConfig(slug, {
          model_id: modelId,
          max_tokens: maxTokens,
          system_prompt: systemPrompt,
        })
        toast.success("Agent settings saved")
        setOpen(false)
      } catch {
        toast.error("Failed to save settings")
      }
    })
  }

  const modelEntries = Object.entries(AVAILABLE_MODELS) as [
    string,
    (typeof AVAILABLE_MODELS)[ModelId],
  ][]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="mb-1 text-sm font-medium">Agent Settings</h4>
            <p className="text-muted-foreground text-xs">
              Changes apply to all future messages in this agent.
            </p>
          </div>

          {/* Model Selector */}
          <div className="space-y-2">
            <Label className="text-xs">Model</Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelEntries.map(([id, info]) => (
                  <SelectItem key={id} value={id}>
                    <div className="flex items-center gap-2">
                      <span>{info.label}</span>
                      <Badge variant="outline" className="px-1 py-0 text-[10px]">
                        {info.tier}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max Tokens Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Max Tokens</Label>
              <span className="text-muted-foreground font-mono text-xs">{maxTokens}</span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={([v]) => setMaxTokens(v)}
              min={512}
              max={8192}
              step={256}
            />
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label className="text-xs">System Prompt</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              className="resize-y font-mono text-xs"
            />
          </div>

          {/* Save */}
          <Button onClick={handleSave} disabled={isPending} className="w-full" size="sm">
            {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
