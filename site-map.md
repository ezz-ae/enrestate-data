# Entrestate Site Map

This is the operational map for the platform, including content intent and implementation status.

## Legend
- **Live**: Connected to Neon or active APIs.
- **Hybrid**: Live data + curated content.
- **UI Only**: Layout/UX complete, no live backend dependency.
- **Preview**: Feature is in demo mode or uses fixed placeholder output.

## Public Marketing
| Route | Purpose | Status |
| --- | --- | --- |
| `/` | Main platform overview | UI Only |
| `/about` | Company narrative + values | UI Only |
| `/contact` | Contact flow | UI Only |
| `/support` | Support hub | UI Only |
| `/status` | Ops status | UI Only |
| `/roadmap` | Product roadmap | UI Only |
| `/changelog` | Release log | UI Only |
| `/privacy` | Policy | UI Only |
| `/terms` | Terms | UI Only |

## Media Creator (Marketing Studio)
| Route | Purpose | Status |
| --- | --- | --- |
| `/agents` | Media Creator landing | Hybrid (live project library) |
| `/storyboard` | Storyboard builder | Hybrid (live project library) |
| `/image-playground` | Visual asset builder | Hybrid (live project library) |
| `/timeline` | Video timeline builder | Hybrid (live project library) |

## Workspace (Data + Decisions)
| Route | Purpose | Status |
| --- | --- | --- |
| `/workspace` | Workspace entry | UI Only |
| `/workspace/data-scientist` | Market Intelligence Desk (activate / explore / briefs) | Live (Neon data) |
| `/workspace/data-scientist/explore` | Market explorer | Live (Neon data) |
| `/workspace/data-scientist/notebook` | Market notebook | UI Only |
| `/workspace/daas` | Market Data Integration | Live (Neon data) |
| `/workspace/dashboards` | Dashboard launcher | UI Only |
| `/workspace/search` | Search hub | UI Only |
| `/workspace/saved-searches` | Saved search list | UI Only |
| `/workspace/comparisons` | Scenario comparisons | UI Only |
| `/workspace/imports` | Data source management | UI Only |
| `/workspace/math-tools` | Calculators | UI Only |
| `/market-score` | Deterministic scoring + matching validation | Live (Neon) |
| `/agent-runtime` | Investor Match Desk | Live (Neon) |

## Apps
| Route | Purpose | Status |
| --- | --- | --- |
| `/apps` | App catalog | UI Only |
| `/apps/agent-builder` | Agent‑First Builder | Hybrid (preview execution) |
| `/apps/lead-agent` | Insta DM lead agent kit | UI Only |
| `/apps/coldcalling` | Cold calling scripts + ops | UI Only |
| `/apps/docs/*` | App documentation | UI Only |

## Data‑Driven Intelligence
| Route | Purpose | Status |
| --- | --- | --- |
| `/markets` | Explorer search + ready questions | Live (Neon) |
| `/top-data` | Live market signals + matched answers | Live (Neon + chat) |
| `/library` | Research library | UI Only |
| `/library/reports` | Reports index | UI Only |
| `/library/insights` | Insights index | UI Only |
| `/library/contracts-explained` | Contracts explained | UI Only |

## Account
| Route | Purpose | Status |
| --- | --- | --- |
| `/account` | Account overview | Hybrid (Neon Auth session) |
| `/login` | Login | Live (Neon Auth) |
| `/signup` | Signup | Live (Neon Auth) |
| `/forgot-password` | Password reset | Live (Neon Auth) |

## Data Feeds (Neon)
| Route | Purpose | Status |
| --- | --- | --- |
| `/api/markets` | Live inventory search | Live |
| `/api/markets/search` | Quick search | Live |
| `/api/chat` | Market chat (rule-based) | Live |
| `/api/market-score/*` | Market score KPIs, inventory, overrides | Live |
| `/api/agent-runtime/*` | Investor matching + overrides | Live |
| `/api/daas` | Data export | Live |
| `/api/data-scientist/dataset/entrestate` | Market snapshot export | Live |
| `/api/seq/project-library` | Media library | Live |

## Notes
- Admin overrides are gated by `NEXT_PUBLIC_ADMIN_MODE=true`.
- The Agent‑First Builder execution endpoints are in **preview** mode for audio/embedding/structured output.
