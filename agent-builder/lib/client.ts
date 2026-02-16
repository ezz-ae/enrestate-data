import type { AgentDefinition, AgentTemplate, AgentRun } from "./agent-types"

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return res.json() as Promise<T>
}

export async function fetchTemplates() {
  return getJson<{ templates: AgentTemplate[] }>("/api/agent-builder/templates")
}

export async function fetchAgents() {
  return getJson<{ agents: AgentDefinition[] }>("/api/agent-builder/agents")
}

export async function createAgent(payload: Omit<AgentDefinition, "id" | "teamId" | "createdAt" | "updatedAt" | "version">) {
  return getJson<{ agent: AgentDefinition }>("/api/agent-builder/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function updateAgent(id: string, payload: Partial<AgentDefinition>) {
  return getJson<{ agent: AgentDefinition }>(`/api/agent-builder/agents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function cloneAgent(id: string) {
  return getJson<{ agent: AgentDefinition }>(`/api/agent-builder/agents/${id}/clone`, { method: "POST" })
}

export async function shareAgent(id: string) {
  return getJson<{ shareId: string }>(`/api/agent-builder/agents/${id}/share`, { method: "POST" })
}

export async function publishAgent(id: string) {
  return getJson<{ agent: AgentDefinition }>(`/api/agent-builder/agents/${id}/publish`, { method: "POST" })
}

export async function createVersion(id: string) {
  return getJson<{ version: { id: string } }>(`/api/agent-builder/agents/${id}/versions`, { method: "POST" })
}

export async function createRun(agentId: string, input: Record<string, string>) {
  return getJson<{ run: AgentRun }>("/api/agent-builder/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, input }),
  })
}
