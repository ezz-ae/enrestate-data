"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Checkbox } from "@/components/ui/checkbox"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useIsAdmin } from "@/lib/auth/client"
import type { AgentRuntimeCandidate } from "@/lib/agent-runtime/types"
import type { SystemHealthcheckRow } from "@/lib/market-score/types"
import {
  CheckCircle2,
  ClipboardCopy,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const RISK_PROFILES = ["Conservative", "Balanced", "Aggressive"]
const HORIZON_BANDS = ["Ready", "6-12mo", "1-2yr", "2-4yr", "4yr+"]
const INTENT_OPTIONS = [
  { value: "invest", label: "Invest" },
  { value: "live", label: "Live" },
  { value: "rent", label: "Rent" },
]

const safetyStyles: Record<string, string> = {
  "Institutional Safe": "border-emerald-500/40 text-emerald-200 bg-emerald-500/10",
  "Capital Safe": "border-blue-500/40 text-blue-200 bg-blue-500/10",
  Opportunistic: "border-amber-500/40 text-amber-200 bg-amber-500/10",
  Speculative: "border-rose-500/40 text-rose-200 bg-rose-500/10",
}

const classificationStyles: Record<string, string> = {
  Conservative: "border-emerald-500/40 text-emerald-200 bg-emerald-500/10",
  Balanced: "border-sky-500/40 text-sky-200 bg-sky-500/10",
  Aggressive: "border-rose-500/40 text-rose-200 bg-rose-500/10",
}

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)
}

function buildWhatsAppSummary(row: AgentRuntimeCandidate) {
  const area = row.area || row.city || "UAE"
  const price = row.price_aed ? `AED ${formatNumber(row.price_aed)}` : "Price on request"
  const reasons = (row.reason_codes || []).slice(0, 3).join(", ") || "Core fit"
  const risks = (row.risk_flags || []).slice(0, 2).join(", ") || "No major risks flagged"

  return `Project summary for ${row.name || "this asset"} in ${area}: Safety band ${
    row.safety_band || "Unclassified"
  }, status ${row.status_band || "Status pending"}, price ${price}. Reasons: ${reasons}. Risks: ${risks}.`
}

function buildCrmSummary(
  profile: {
    riskProfile: string
    horizon: string
    budgetAed?: string
    preferredArea?: string
    bedsPref?: string
    intent?: string
  },
  rows: AgentRuntimeCandidate[],
  selectedIds: string[],
) {
  const selectedRows = rows.filter((row) => selectedIds.includes(row.asset_id))
  return JSON.stringify(
    {
      investor_profile: {
        risk_profile: profile.riskProfile,
        horizon: profile.horizon,
        budget_aed: profile.budgetAed ? Number(profile.budgetAed) : null,
        preferred_area: profile.preferredArea || null,
        beds_pref: profile.bedsPref || null,
        intent: profile.intent || null,
      },
      assets: selectedRows.map((row) => ({
        asset_id: row.asset_id,
        safety_band: row.safety_band,
        score_0_100: row.score_0_100,
        reason_codes: row.reason_codes,
        risk_flags: row.risk_flags,
      })),
    },
    null,
    2,
  )
}

export default function AgentRuntimePage() {
  const { toast } = useToast()
  const [healthcheck, setHealthcheck] = useState<SystemHealthcheckRow | null>(null)
  const [riskProfile, setRiskProfile] = useState("")
  const [horizon, setHorizon] = useState("")
  const [ranked, setRanked] = useState(false)
  const [budgetAed, setBudgetAed] = useState("")
  const [preferredArea, setPreferredArea] = useState("")
  const [bedsPref, setBedsPref] = useState("")
  const [intent, setIntent] = useState("")

  const [rows, setRows] = useState<AgentRuntimeCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [overrideAllow2030, setOverrideAllow2030] = useState(false)
  const [overrideAllowSpeculative, setOverrideAllowSpeculative] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")
  const [overrideAssetId, setOverrideAssetId] = useState("")
  const [overrideDisclosure, setOverrideDisclosure] = useState<unknown | null>(null)
  const [overridePreviewed, setOverridePreviewed] = useState(false)
  const [overrideActive, setOverrideActive] = useState(false)
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  const { isAdmin } = useIsAdmin()

  useEffect(() => {
    const fetchHealthcheck = async () => {
      try {
        const res = await fetch("/api/market-score/healthcheck")
        if (!res.ok) throw new Error("Healthcheck failed")
        const data = await res.json()
        setHealthcheck(data.healthcheck || null)
      } catch (err) {
        console.error("Agent runtime healthcheck error:", err)
      }
    }

    fetchHealthcheck()
  }, [])

  useEffect(() => {
    setOverrideActive(false)
    setOverridePreviewed(false)
    setOverrideDisclosure(null)
  }, [riskProfile, horizon, overrideAllow2030, overrideAllowSpeculative])

  const hasRankedInputs = ranked && budgetAed && preferredArea && bedsPref && intent

  const clientProfile = useMemo(
    () => ({ riskProfile, horizon, budgetAed, preferredArea, bedsPref, intent }),
    [riskProfile, horizon, budgetAed, preferredArea, bedsPref, intent],
  )

  const handleRun = async () => {
    setError(null)

    if (!riskProfile || !horizon) {
      setError("Choose a risk profile and time horizon before running.")
      return
    }

    if (ranked) {
      if (!budgetAed || Number.isNaN(Number(budgetAed))) {
        setError("Add a valid budget for ranked recommendations.")
        return
      }
      if (!preferredArea || !bedsPref || !intent) {
        setError("Complete the client fit details for ranked recommendations.")
        return
      }
    }

    setLoading(true)
    try {
      const body = {
        risk_profile: riskProfile,
        horizon,
        ranked,
        budget_aed: ranked ? Number(budgetAed) : undefined,
        preferred_area: ranked ? preferredArea : undefined,
        beds_pref: ranked ? bedsPref : undefined,
        intent: ranked ? intent : undefined,
        override_active: overrideActive,
        override_flags: overrideActive
          ? { allow_2030_plus: overrideAllow2030, allow_speculative: overrideAllowSpeculative }
          : undefined,
      }

      const res = await fetch("/api/agent-runtime/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.error || "Unable to run matching.")
        return
      }

      setRows(data.rows || [])
      setSelectedIds((data.rows || []).map((row: AgentRuntimeCandidate) => row.asset_id))
    } catch (err) {
      console.error("Agent runtime run error:", err)
      setError("Unable to run matching. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (value: string, success: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast({ title: success })
    } catch (err) {
      console.error("Clipboard error:", err)
      toast({ title: "Copy failed", description: "Please copy manually." })
    }
  }

  const handleDisclosurePreview = async () => {
    if (!overrideAssetId || !riskProfile) {
      setError("Select an asset before previewing the disclosure.")
      return
    }

    if (!overrideAllow2030 && !overrideAllowSpeculative) {
      setError("Select at least one override option.")
      return
    }

    setPreviewLoading(true)
    try {
      const overrideType = overrideAllow2030 && overrideAllowSpeculative
        ? "allow_2030_plus_and_speculative"
        : overrideAllow2030
          ? "allow_2030_plus"
          : "allow_speculative"

      const res = await fetch("/api/agent-runtime/override-disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: overrideAssetId,
          override_type: overrideType,
          profile: riskProfile,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.error || "Unable to load disclosure.")
        return
      }

      setOverrideDisclosure(data.disclosure ?? null)
      setOverridePreviewed(true)
    } catch (err) {
      console.error("Disclosure preview error:", err)
      setError("Unable to load disclosure.")
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleConfirmOverride = async () => {
    if (!riskProfile || !horizon) {
      setError("Select a risk profile and horizon before confirming an override.")
      return
    }

    if (!overrideAssetId) {
      setError("Select an asset before confirming an override.")
      return
    }

    if (!overrideAllow2030 && !overrideAllowSpeculative) {
      setError("Select at least one override option.")
      return
    }

    if (!overridePreviewed) {
      setError("Preview the disclosure before confirming.")
      return
    }

    if (overrideReason.trim().length < 10) {
      setError("Provide a short reason (at least 10 characters).")
      return
    }

    setOverrideLoading(true)
    try {
      const res = await fetch("/api/agent-runtime/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          risk_profile: riskProfile,
          horizon,
          override_flags: {
            allow_2030_plus: overrideAllow2030,
            allow_speculative: overrideAllowSpeculative,
          },
          reason: overrideReason.trim(),
          selected_asset_id: overrideAssetId,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.error || "Unable to log override.")
        return
      }

      setOverrideActive(true)
      toast({ title: "Override logged", description: data.loggedAt })
    } catch (err) {
      console.error("Override error:", err)
      setError("Unable to log override.")
    } finally {
      setOverrideLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="mx-auto w-full max-w-6xl px-6 py-12">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-slate-900/60 p-10 shadow-[0_30px_120px_rgba(15,23,42,0.45)]">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-300">
            <Sparkles className="h-4 w-4 text-blue-200" />
            Investor Match Desk
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">Route client requests with confidence.</h1>
              <p className="mt-3 text-base text-slate-300">
                This desk applies the same scoring rules used across the market. Choose the buyer profile, add the
                client fit, and return a ranked shortlist you can explain clearly.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">Data trust check</div>
                {healthcheck?.status === "ok" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-200">
                    <ShieldCheck className="h-4 w-4" /> {healthcheck.passing_count}/{healthcheck.total_count} passing
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-200">
                    <ShieldAlert className="h-4 w-4" /> Waiting on latest status
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Last updated {healthcheck?.created_at ? new Date(healthcheck.created_at).toLocaleString() : "just now"}.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Client profile</h2>
                {overrideActive && (
                  <Badge className="border-amber-400/40 bg-amber-400/10 text-amber-200">Override active</Badge>
                )}
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-xs text-slate-400">Risk profile</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {RISK_PROFILES.map((profile) => (
                      <Button
                        key={profile}
                        type="button"
                        size="sm"
                        variant={riskProfile === profile ? "default" : "outline"}
                        className={riskProfile === profile ? "bg-white text-slate-900 hover:bg-white" : "border-white/10"}
                        onClick={() => setRiskProfile(profile)}
                      >
                        {profile}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-400">Time horizon</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {HORIZON_BANDS.map((band) => (
                      <Button
                        key={band}
                        type="button"
                        size="sm"
                        variant={horizon === band ? "default" : "outline"}
                        className={horizon === band ? "bg-white text-slate-900 hover:bg-white" : "border-white/10"}
                        onClick={() => setHorizon(band)}
                      >
                        {band}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 p-3">
                  <div>
                    <div className="text-sm text-white">Ranked shortlists</div>
                    <div className="text-xs text-slate-400">Blend client fit with market score.</div>
                  </div>
                  <Switch checked={ranked} onCheckedChange={setRanked} />
                </div>

                {ranked && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-400">Budget (AED)</Label>
                      <Input
                        value={budgetAed}
                        onChange={(event) => setBudgetAed(event.target.value)}
                        placeholder="2,000,000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Preferred area</Label>
                      <Input
                        value={preferredArea}
                        onChange={(event) => setPreferredArea(event.target.value)}
                        placeholder="Dubai Marina"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Bed preference</Label>
                      <Input
                        value={bedsPref}
                        onChange={(event) => setBedsPref(event.target.value)}
                        placeholder="2BR"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Intent</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {INTENT_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            size="sm"
                            variant={intent === option.value ? "default" : "outline"}
                            className={intent === option.value ? "bg-white text-slate-900 hover:bg-white" : "border-white/10"}
                            onClick={() => setIntent(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  className="w-full bg-white text-slate-900 hover:bg-slate-100"
                  onClick={handleRun}
                  disabled={loading || (ranked && !hasRankedInputs)}
                >
                  {loading ? "Running..." : "Run matching"}
                </Button>
                <p className="text-xs text-slate-400">
                  Results are capped to the top 10 matches. Adjust the profile to see other pools.
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-200">Override safety gates</h3>
                    <p className="text-xs text-amber-200/70">Admins only. Requires disclosure and reason.</p>
                  </div>
                  <ShieldAlert className="h-4 w-4 text-amber-200" />
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <label className="flex items-center gap-2">
                    <Checkbox checked={overrideAllow2030} onCheckedChange={(value) => setOverrideAllow2030(Boolean(value))} />
                    Allow 2030+ delivery assets
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={overrideAllowSpeculative}
                      onCheckedChange={(value) => setOverrideAllowSpeculative(Boolean(value))}
                    />
                    Allow speculative safety band
                  </label>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <Label className="text-xs text-amber-200/70">Asset for disclosure</Label>
                    <Input
                      value={overrideAssetId}
                      onChange={(event) => setOverrideAssetId(event.target.value)}
                      placeholder="Select an asset from results"
                      className="mt-1"
                    />
                    {rows.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {rows.slice(0, 3).map((row) => (
                          <Button
                            key={row.asset_id}
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-amber-200/30 text-amber-100"
                            onClick={() => setOverrideAssetId(row.asset_id)}
                          >
                            Use {row.asset_id}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-amber-200/70">Reason</Label>
                    <Textarea
                      value={overrideReason}
                      onChange={(event) => setOverrideReason(event.target.value)}
                      placeholder="Explain why this override is approved."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="border-amber-200/30 text-amber-100"
                      onClick={handleDisclosurePreview}
                      disabled={previewLoading}
                    >
                      {previewLoading ? "Loading disclosure..." : "Preview disclosure"}
                    </Button>
                    <Button
                      className="bg-amber-200 text-slate-900 hover:bg-amber-100"
                      onClick={handleConfirmOverride}
                      disabled={overrideLoading || !overridePreviewed}
                    >
                      {overrideLoading ? "Logging override..." : "Confirm override"}
                    </Button>
                  </div>

                  {overrideDisclosure && (
                    <div className="rounded-xl border border-amber-200/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                      <div className="font-semibold">Disclosure preview</div>
                      <pre className="mt-2 whitespace-pre-wrap break-words">
                        {JSON.stringify(overrideDisclosure, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>

          <section className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Action needed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Routed matches</h3>
                  <p className="text-sm text-slate-400">
                    {rows.length === 0
                      ? "Run matching to see your best-fit inventory."
                      : `Showing ${rows.length} matches for ${riskProfile || ""} ${horizon || ""}.`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-white/10"
                    onClick={() =>
                      handleCopy(
                        buildCrmSummary(clientProfile, rows, selectedIds),
                        "CRM summary copied",
                      )
                    }
                    disabled={rows.length === 0}
                  >
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    Copy CRM summary
                  </Button>
                </div>
              </div>

              {rows.length === 0 && !loading ? (
                <Empty className="mt-6 border-white/10">
                  <EmptyHeader>
                    <EmptyTitle>No matches yet</EmptyTitle>
                    <EmptyDescription>
                      Choose a profile and run matching to see the top 10 matches.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <div className="text-xs text-slate-400">
                      Try Balanced + 1-2yr for the widest pool.
                    </div>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="mt-6 space-y-4">
                  {rows.map((row) => {
                    const safetyClass = row.safety_band ? safetyStyles[row.safety_band] : ""
                    const classificationClass = row.classification
                      ? classificationStyles[row.classification]
                      : ""

                    return (
                      <div
                        key={row.asset_id}
                        className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedIds.includes(row.asset_id)}
                              onCheckedChange={(value) => {
                                setSelectedIds((current) =>
                                  value
                                    ? [...current, row.asset_id]
                                    : current.filter((id) => id !== row.asset_id),
                                )
                              }}
                            />
                            <div>
                              <h4 className="text-base font-semibold text-white">
                                {row.name || "Unnamed asset"}
                              </h4>
                              <p className="text-sm text-slate-400">
                                {row.area || "Area"} · {row.city || "City"} · {row.developer || "Developer"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-300">Price</div>
                            <div className="text-lg font-semibold text-white">
                              {row.price_aed ? `AED ${formatNumber(row.price_aed)}` : "—"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {row.safety_band && (
                            <Badge className={`${safetyClass} border text-xs`}>{row.safety_band}</Badge>
                          )}
                          {row.classification && (
                            <Badge className={`${classificationClass} border text-xs`}>{row.classification}</Badge>
                          )}
                          {row.status_band && (
                            <Badge className="border-white/10 bg-white/5 text-xs text-slate-200">
                              {row.status_band}
                            </Badge>
                          )}
                          {row.score_0_100 !== null && (
                            <Badge className="border-white/10 bg-white/5 text-xs text-slate-200">
                              Score {Math.round(row.score_0_100)}
                            </Badge>
                          )}
                          {ranked && row.match_score !== null && (
                            <Badge className="border-white/10 bg-white/5 text-xs text-slate-200">
                              Match {Math.round(row.match_score * 100)}%
                            </Badge>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                          <span>Liquidity: {row.liquidity_band || "—"}</span>
                          <span>Timeline: {row.timeline_risk_band || "—"}</span>
                          <span>ROI band: {row.roi_band || "—"}</span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10"
                            onClick={() => handleCopy(buildWhatsAppSummary(row), "WhatsApp summary copied")}
                          >
                            <ClipboardCopy className="mr-2 h-4 w-4" />
                            Copy WhatsApp summary
                          </Button>
                        </div>

                        <div className="mt-4">
                          {(row.reason_codes?.length || 0) > 0 && (
                            <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                              {row.reason_codes?.slice(0, 4).map((reason) => (
                                <Badge key={reason} className="border-white/10 bg-white/5 text-xs text-slate-200">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {(row.risk_flags?.length || 0) > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-rose-200">
                              {row.risk_flags?.slice(0, 3).map((risk) => (
                                <Badge key={risk} className="border-rose-500/40 bg-rose-500/10 text-xs text-rose-200">
                                  {risk}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <Collapsible className="mt-4">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-300">
                              View drivers
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 rounded-xl border border-border/60 bg-muted/30 p-3">
                            <pre className="whitespace-pre-wrap text-xs text-slate-200">
                              {JSON.stringify(row.drivers ?? {}, null, 2)}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {rows.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-sm text-slate-300">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Output guardrails
                </div>
                <p className="mt-2">
                  These summaries use fixed fields only. No promised ROI, no unstated assumptions, and every note is
                  tied to a scored signal.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}
