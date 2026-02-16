"use client"

import { useEffect, useMemo, useState } from "react"
import { AgentWizard } from "@/agent-builder/components/agent-wizard"
import { AgentLibrary } from "@/agent-builder/components/agent-library"
import { AgentPreview } from "@/agent-builder/components/agent-preview"
import { AgentTestPanel } from "@/agent-builder/components/agent-test-panel"
import { ProCanvas } from "@/agent-builder/components/pro-canvas"
import { Button } from "@/agent-builder/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/agent-builder/components/ui/tabs"
import { Separator } from "@/agent-builder/components/ui/separator"
import { ShieldCheck, Wand2 } from "lucide-react"
import type { AgentDefinition, AgentTemplate } from "@/agent-builder/lib/agent-types"
import type { AgentDraft } from "@/agent-builder/lib/draft"
import { buildDraftFromTemplate } from "@/agent-builder/lib/draft"
import {
  fetchTemplates,
  fetchAgents,
  createAgent,
  updateAgent,
  cloneAgent,
  shareAgent,
  publishAgent,
  createVersion,
} from "@/agent-builder/lib/client"

const emptyDraft: AgentDraft = {
  name: "New agent",
  role: "lead_qualifier",
  market: "UAE",
  companyType: "broker",
  inputs: { fields: [] },
  rules: { strictMode: true, toggles: [] },
  outputs: { channels: ["whatsapp"], tone: "friendly", summaryStyle: "balanced" },
  connectors: { listings: true, projects: true, marketIntel: true, crm: false },
}

export default function AgentBuilderApp() {
  const [mode, setMode] = useState<"easy" | "pro">("easy")
  const [editablePro, setEditablePro] = useState(false)
  const [step, setStep] = useState(1)
  const [templates, setTemplates] = useState<AgentTemplate[]>([])
  const [agents, setAgents] = useState<AgentDefinition[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [draft, setDraft] = useState<AgentDraft>(emptyDraft)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const templateResponse = await fetchTemplates()
      setTemplates(templateResponse.templates)

      const agentResponse = await fetchAgents()
      setAgents(agentResponse.agents)

      if (templateResponse.templates[0]) {
        const template = templateResponse.templates[0]
        setSelectedTemplateId(template.id)
        setDraft(buildDraftFromTemplate(template))
      }
    }
    load()
  }, [])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [templates, selectedTemplateId],
  )

  const handleSelectTemplate = (template: AgentTemplate) => {
    setSelectedTemplateId(template.id)
    setDraft(buildDraftFromTemplate(template))
    setStep(2)
    setActiveAgentId(null)
  }

  const handleSelectAgent = (agent: AgentDefinition) => {
    setActiveAgentId(agent.id)
    setDraft({
      name: agent.name,
      role: agent.role,
      market: agent.market,
      companyType: agent.companyType,
      inputs: agent.inputs,
      rules: agent.rules,
      outputs: agent.outputs,
      connectors: agent.connectors,
      status: agent.status,
    })
  }

  const refreshAgents = async () => {
    const agentResponse = await fetchAgents()
    setAgents(agentResponse.agents)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (activeAgentId) {
        const response = await updateAgent(activeAgentId, draft)
        setActiveAgentId(response.agent.id)
        await createVersion(response.agent.id)
      } else {
        const response = await createAgent({
          ...draft,
          status: "draft",
        })
        setActiveAgentId(response.agent.id)
      }
      await refreshAgents()
    } finally {
      setIsSaving(false)
    }
  }

  const handleEnsureAgent = async () => {
    if (activeAgentId) return activeAgentId
    const response = await createAgent({
      ...draft,
      status: "draft",
    })
    setActiveAgentId(response.agent.id)
    await refreshAgents()
    return response.agent.id
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground md:text-xl">Agent-First Builder</h1>
              <p className="text-xs text-muted-foreground md:text-sm">
                Build real estate agents without technical setup.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={mode} onValueChange={(value) => setMode(value as "easy" | "pro")}>
              <TabsList>
                <TabsTrigger value="easy">Easy mode</TabsTrigger>
                <TabsTrigger value="pro">Pro mode</TabsTrigger>
              </TabsList>
            </Tabs>
            {mode === "easy" && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save agent"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {mode === "easy" ? (
        <main className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
            <div className="space-y-6">
              <AgentWizard
                step={step}
                onStepChange={setStep}
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                draft={draft}
                onDraftChange={setDraft}
                onSelectTemplate={handleSelectTemplate}
              />
              <Separator />
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-5">
                <Wand2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Agent ready in minutes</p>
                  <p className="text-xs text-muted-foreground">
                    Save the agent, then test it with a sample conversation.
                  </p>
                </div>
                <Button className="ml-auto" variant="outline" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save & version"}
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <AgentLibrary
                agents={agents}
                selectedAgentId={activeAgentId}
                onSelect={handleSelectAgent}
                onCreate={() => {
                  if (templates[0]) {
                    handleSelectTemplate(templates[0])
                  } else {
                    setDraft(emptyDraft)
                  }
                  setActiveAgentId(null)
                }}
                onClone={async (id) => {
                  await cloneAgent(id)
                  await refreshAgents()
                }}
                onShare={async (id) => {
                  await shareAgent(id)
                  await refreshAgents()
                }}
                onPublish={async (id) => {
                  await publishAgent(id)
                  await refreshAgents()
                }}
              />
              <AgentPreview draft={draft} />
              <AgentTestPanel
                draft={draft}
                activeAgentId={activeAgentId}
                template={selectedTemplate}
                onEnsureAgent={handleEnsureAgent}
              />
            </div>
          </div>
        </main>
      ) : (
        <main className="container mx-auto px-6 py-8">
          <ProCanvas editable={editablePro} onToggleEdit={() => setEditablePro((prev) => !prev)} />
        </main>
      )}
    </div>
  )
}
