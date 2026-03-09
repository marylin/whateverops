# Phase 6 — Growth

Timeline: Months 4–6+
Gate required: Gate 4 + $500+ MRR
Branch: `feature/phase-6-growth`
Target: $2,000+ MRR

## Infrastructure Upgrades
- Cloudflare Pro (CDN, WAF 20 rules, APO for Vercel)
- Neon Scale (50GB) + read replica when write latency degrades
- Upstash Redis Pro (>10K daily requests)
- Axiom log drain from Railway (30-day retention)

## Product Features
- Slack/Discord alerts (user-configurable thresholds per panel)
- "Share ops snapshot" — public read-only URL for build-in-public
- Referral program (give 1 month free / get 1 month free, Stripe credits)
- Public metrics page (whateverops.io/metrics — MRR, users, uptime)
- Community-voted next integration (GitHub Discussions poll)

## Distribution
- 15 SEO articles (one per integration: "How to monitor your Stripe MRR")
- 3 comparison pages (vs Better Stack, vs Datadog, vs Grafana)
- Railway marketplace listing
- Vercel marketplace listing

## New Automations
- AUTO-11: Monthly public metrics auto-post
- Annual winback: 30-day + 90-day post-cancel email sequences

## Target Metrics
- $2,000+ MRR
- Infra < 10% of revenue
- NPS > 40
