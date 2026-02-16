import { describe, expect, it } from "vitest"
import { agentTemplates } from "@/agent-builder/lib/templates"
import { buildDraftFromTemplate } from "@/agent-builder/lib/draft"
import { AgentDefinitionSchema } from "@/agent-builder/lib/agent-types"
import { executeAgentRun } from "@/agent-builder/lib/execution/engine"

const hasNeonConnection = Boolean(
  process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_DATABASE_URL_UNPOOLED,
)
const itWithNeon = hasNeonConnection ? it : it.skip

describe("Agent builder scaffolding", () => {
  it("validates agent definitions against schema", () => {
    const template = agentTemplates[0]
    const draft = buildDraftFromTemplate(template)
    const definition = {
      ...draft,
      id: "agent_test",
      teamId: "team_test",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }

    const parsed = AgentDefinitionSchema.safeParse(definition)
    expect(parsed.success).toBe(true)
  })

  it("instantiates templates with input fields", () => {
    const draft = buildDraftFromTemplate(agentTemplates[1])
    expect(draft.inputs.fields.length).toBeGreaterThan(0)
    expect(draft.outputs.channels.length).toBeGreaterThan(0)
  })

  itWithNeon("runs execution with required inputs", async () => {
    const draft = buildDraftFromTemplate(agentTemplates[0])
    const definition = {
      ...draft,
      id: "agent_test_run",
      teamId: "team_test",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      connectors: {
        listings: false,
        projects: false,
        marketIntel: false,
        crm: false,
      },
    }

    const run = await executeAgentRun(definition, {
      inputs: {
        full_name: "Sara",
        phone: "+971555000111",
        budget_range: "2000000",
        preferred_area: "Dubai Hills",
        timeline: "0-3 months",
      },
    })

    expect(run.outputs.whatsapp).toBeTruthy()
    expect(run.summary).toContain("Budget")
  })
})
