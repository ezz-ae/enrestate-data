import type { AgentDefinition, AgentTemplate } from "./agent-types"

export type AgentDraft = Omit<
  AgentDefinition,
  "id" | "teamId" | "createdAt" | "updatedAt" | "version" | "status" | "shareId"
> & { status?: AgentDefinition["status"] }

export function buildDraftFromTemplate(template: AgentTemplate): AgentDraft {
  return {
    name: template.name,
    role: template.role,
    market: template.defaultDefinition.market,
    companyType: template.defaultDefinition.companyType,
    inputs: template.defaultDefinition.inputs,
    rules: template.defaultDefinition.rules,
    outputs: template.defaultDefinition.outputs,
    connectors: template.defaultDefinition.connectors,
    status: "draft",
  }
}
