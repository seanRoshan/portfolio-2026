import { listPrompts } from './actions'
import { PromptEngineerClient } from './prompt-engineer-client'

export default async function PromptEngineerPage() {
  const prompts = await listPrompts()

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-6">
        <h1 className="text-lg font-semibold">Prompt Engineer</h1>
        <span className="text-muted-foreground text-sm">
          Manage AI prompts for resume generation
        </span>
      </header>
      <PromptEngineerClient initialPrompts={prompts} />
    </div>
  )
}
