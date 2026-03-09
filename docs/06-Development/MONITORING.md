# Monitoring Setup — BetterStack

## Monitors (3 required)

| Monitor        | URL                                 | Check interval | Alert threshold        |
| -------------- | ----------------------------------- | -------------- | ---------------------- |
| Backend Health | `https://api.whateverops.io/health` | 60s            | 2 consecutive failures |
| Frontend       | `https://whateverops.io`            | 60s            | 2 consecutive failures |
| n8n Dashboard  | `https://n8n.whateverops.io`        | 300s           | 3 consecutive failures |

## Setup Steps

1. Create account at [betterstack.com](https://betterstack.com)
2. Add monitors above via Dashboard → Monitors → Create Monitor
3. Set alert contacts: email + Slack/Discord webhook
4. Configure status page:
   - Custom domain: `status.whateverops.io`
   - Add CNAME record: `status.whateverops.io` → `statuspage.betterstack.com`
   - Enable all 3 monitors on status page
   - Set page title: "WhateverOPS Status"

## Alert Channels

- Email: admin email (primary)
- Webhook: n8n error-alert endpoint for AUTO-5 transparency posts
  - URL: `https://api.whateverops.io/api/webhooks/n8n/error-alert`
  - Add header: `x-webhook-secret: <your N8N_WEBHOOK_SECRET>`

## Status Page

Public URL: `https://status.whateverops.io`
Used in PanelCard error states as "Status page" link.
