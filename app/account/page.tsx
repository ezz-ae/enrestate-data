import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AccountIdentity } from "@/components/account-identity"
import Link from "next/link"
import { Building2, ShieldCheck, CreditCard, Users, Boxes, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Account - Entrestate",
  description:
    "Manage your Entrestate account, team access, security preferences, and connected apps in one place.",
}

export default function AccountPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Account</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight">Your workspace identity</h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Update your organization profile, manage access, and control how apps connect to your data.
            </p>
          </div>
          <div className="max-w-3xl mb-10">
            <AccountIdentity />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8">
            <div className="space-y-6">
              <section id="profile" className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="text-lg font-medium text-foreground">Organization profile</h2>
                    <p className="text-sm text-muted-foreground">Name, markets, and contact identity.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Primary market</p>
                    <p className="text-foreground">UAE · Dubai</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Company type</p>
                    <p className="text-foreground">Brokerage / Investment</p>
                  </div>
                </div>
              </section>

              <section id="team" className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="text-lg font-medium text-foreground">Team access</h2>
                    <p className="text-sm text-muted-foreground">Invite team members and control access levels.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1">
                    Owners: 1
                  </span>
                  <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1">
                    Editors: 4
                  </span>
                  <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1">
                    Viewers: 6
                  </span>
                </div>
              </section>

              <section id="apps" className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Boxes className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="text-lg font-medium text-foreground">Connected apps</h2>
                    <p className="text-sm text-muted-foreground">
                      Media Creator, Agent Builder, and data services live under the same account.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  {[
                    "Media Creator",
                    "Agent-First Builder",
                    "Market Intelligence Desk",
                    "Cold Calling",
                  ].map((app) => (
                    <div key={app} className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                      <p className="text-foreground">{app}</p>
                      <p className="text-xs text-muted-foreground mt-1">Active</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section id="billing" className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="text-lg font-medium text-foreground">Billing</h2>
                    <p className="text-sm text-muted-foreground">Manage subscriptions and invoices.</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-secondary/40 p-4 text-sm text-muted-foreground">
                  Plan: Enterprise Workspace
                  <div className="mt-2 text-xs">Renewal: 30 days</div>
                </div>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80"
                >
                  Talk to billing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>

              <section id="security" className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="text-lg font-medium text-foreground">Security</h2>
                    <p className="text-sm text-muted-foreground">Controls for access and compliance.</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                    Session controls and audit trails are enabled.
                  </div>
                  <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                    Data access is restricted by team roles.
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
