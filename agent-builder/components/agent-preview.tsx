"use client"

import type { AgentDraft } from "@/agent-builder/lib/draft"
import { Card } from "@/agent-builder/components/ui/card"
import { Badge } from "@/agent-builder/components/ui/badge"

type AgentPreviewProps = {
  draft: AgentDraft
}

const outputLabels: Record<string, string> = {
  whatsapp: "WhatsApp reply",
  call_script: "Call script",
  investor_memo: "Investor memo",
  crm_summary: "CRM summary",
}

export function AgentPreview({ draft }: AgentPreviewProps) {
  return (
    <Card className="border border-border bg-card/60 p-5 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Agent preview</p>
        <h3 className="text-lg font-semibold text-foreground mt-1">{draft.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {draft.role.split("_").join(" ")} · {draft.market} · {draft.companyType}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Inputs</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {draft.inputs.fields.slice(0, 6).map((field) => (
            <Badge key={field.id} variant={field.required ? "default" : "secondary"}>
              {field.label}
            </Badge>
          ))}
          {draft.inputs.fields.length > 6 && (
            <Badge variant="outline">+{draft.inputs.fields.length - 6} more</Badge>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Rules</p>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {draft.rules.toggles.filter((rule) => rule.enabled).length === 0 && (
            <p>No active safeguards yet.</p>
          )}
          {draft.rules.toggles
            .filter((rule) => rule.enabled)
            .slice(0, 4)
            .map((rule) => (
              <p key={rule.id}>• {rule.label}</p>
            ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Outputs</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {draft.outputs.channels.map((channel) => (
            <Badge key={channel} variant="outline">
              {outputLabels[channel] || channel}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Tone: {draft.outputs.tone} · Summary: {draft.outputs.summaryStyle}
        </p>
      </div>
    </Card>
  )
}
