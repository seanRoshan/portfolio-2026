"use client"

import { AgentChat } from "@/components/agent-chat"

export function ArchitectClient() {
  return (
    <div style={{ height: "calc(100vh - 56px)" }}>
      <AgentChat
        apiEndpoint="/api/agents/architect"
        placeholder="Describe the system you want to design..."
        emptyMessage="I'm your Enterprise Architect. Describe a system and I'll design a scalable architecture with Mermaid.js diagrams."
      />
    </div>
  )
}
