# Telemetry

WhateverOPS collects anonymous usage data to help the maintainer understand adoption and plan development priorities.

## What is collected

Every 24 hours while the server is running, a heartbeat is sent containing:

| Field                   | Example        | Purpose                                          |
| ----------------------- | -------------- | ------------------------------------------------ |
| Instance ID             | `a1b2c3d4-...` | Random UUID, not tied to any identity            |
| App version             | `0.1.0`        | Version distribution                             |
| Configured integrations | `14`           | Engagement level (count only, not names)         |
| Uptime                  | `86400`        | How long the instance has been running (seconds) |
| Node.js version         | `22.17.1`      | Runtime environment                              |
| Platform                | `linux`        | Operating system                                 |

## What is NOT collected

- IP addresses (not logged by the receiver)
- Integration names or API keys
- Dashboard content or user data
- Hostnames, URLs, or network information
- Any personally identifiable information

## How it works

- On first boot, a random UUID is generated and saved to `.whateverops-instance-id` in the project root
- The UUID has no tie to any user identity. Deleting the file generates a new one on next boot
- A heartbeat is sent 60 seconds after startup, then every 24 hours
- The heartbeat is a POST request to a Supabase edge function
- Failures are silently ignored — telemetry never affects app behavior

## Verification

The heartbeat client code is fully open source: [`backend/src/lib/telemetry.ts`](backend/src/lib/telemetry.ts)
