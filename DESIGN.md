# Design System — WhateverOPS

## Product Context

- **What this is:** Unified ops dashboard for solo developer-founders. 15 integrations, one real-time view.
- **Who it's for:** Solo dev-founders running SaaS products on Vercel/Railway/Neon/Supabase stack.
- **Space/industry:** Developer tools, ops monitoring. Peers: Datadog, Grafana, Better Stack, Linear, Vercel dashboard.
- **Project type:** Web app / dashboard (dark-first, data-dense)

## Aesthetic Direction

- **Direction:** Industrial/Utilitarian — control room, not marketing page
- **Decoration level:** Minimal — typography and color do all the work. No gradients, no decorative blobs, no shadows except dropdowns.
- **Mood:** Confident, precise, developer-native. Like a well-organized terminal with modern typography. The dashboard should feel like it was built by someone who cares about craft but not about impressing designers.
- **Reference sites:** Linear (warm neutrals, minimal color), Vercel (Geist, stark contrast, developer-centric), Datadog (data density)

## Typography

- **Font:** JetBrains Mono (Variable) — every role. Display, body, UI labels, data, code. One font, zero ambiguity.
- **Why mono-first:** Most ops tools use mono only for code. WhateverOPS uses it everywhere — the entire dashboard reads like a control room. Unmistakable identity. Data feels more authoritative in mono.
- **Loading:** Google Fonts `https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap`
- **Scale:**
  - Display: 48px / 700 / -1.5px tracking
  - H1: 32px / 700 / -1px tracking
  - H2: 24px / 600 / -0.5px tracking
  - H3: 16px / 600
  - Body: 14px / 400 / 1.6 line-height
  - UI Label: 11px / 500 / uppercase / 0.5px tracking
  - Small: 10px / 400
- **Rules:**
  - `font-variant-numeric: tabular-nums` on ALL number displays
  - Never use a second font. JetBrains Mono is the identity.

## Color

- **Approach:** Restrained — one bold accent, semantic colors for health, everything else is warm slate
- **Primary accent:** `#0EA5E9` (sky-500) — reads as monitoring/infrastructure, distinct from the indigo everyone uses
- **Primary hover:** `#38BDF8` (sky-400)
- **Primary muted:** `rgba(14, 165, 233, 0.15)`
- **Neutrals (dark mode):**
  - Background: `#0C0C14`
  - Card: `#161622`
  - Elevated: `#1E1E2E`
  - Border: `#252535`
  - Text primary: `#E2E2E8`
  - Text secondary: `#9090A0`
  - Text muted: `#606070`
- **Neutrals (light mode):**
  - Background: `#F8F8FA`
  - Card: `#FFFFFF`
  - Elevated: `#F0F0F4`
  - Border: `#E2E2E8`
  - Text primary: `#1A1A2E`
  - Text secondary: `#606070`
  - Text muted: `#9090A0`
  - Accent (light): `#0284C7` (sky-700, darker for contrast)
- **Semantic:**
  - Success: `#10B981` (emerald-500)
  - Warning: `#F59E0B` (amber-500)
  - Error: `#EF4444` (red-500)
  - Info: `#0EA5E9` (same as primary)
- **Dark mode strategy:** Default theme. Warm slate grays (not pure gray). Text off-white (#E2E2E8), not pure white. Primary accent desaturated slightly in light mode for contrast.

## Spacing

- **Base unit:** 4px
- **Density:** Comfortable — data-dense but not cramped
- **Scale:** 2xs(2) xs(4) sm(8) md(12) lg(16) xl(24) 2xl(32) 3xl(48) 4xl(64)
- **Card padding:** 24px (default), 16px (compact/card-sm)
- **Grid gap:** 16px between cards, 12px within cards

## Layout

- **Approach:** Grid-disciplined — strict columns, predictable alignment
- **Grid:** 1 column (mobile) → 2 columns (md/768px) → 3 columns (xl/1280px)
- **Max content width:** 1200px (7xl)
- **Wide cards:** Stripe, GitHub, Sentry, Supabase span 2 columns on xl
- **Border radius:**
  - sm: 4px (badges, small elements)
  - md: 8px (buttons, inputs, alerts)
  - lg: 12px (cards, modals)
  - full: 9999px (dots, pills)

## Motion

- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150ms) medium(250ms)
- **Rules:**
  - State transitions (hover, focus): 150ms ease-out
  - Panel load: no animation (data appears immediately)
  - Dropdowns/modals: 150ms ease-out on enter, 100ms ease-in on exit
  - No entrance animations, no scroll effects, no decorative motion
  - `prefers-reduced-motion`: respect always

## Scrollbar

- Width: 6px
- Track: transparent
- Thumb: `#252535` (border color), hover `#353545`
- Both `scrollbar-width: thin` (Firefox) and `::-webkit-scrollbar` (Chrome/Safari)

## AI Slop Blacklist

Never introduce:

- Purple/violet gradients or accents
- Icons in colored circles
- Centered-everything layouts
- Uniform bubbly border-radius
- Decorative blobs, waves, or SVG dividers
- Emoji as design elements
- Colored left-border on cards
- Generic hero copy ("Unlock the power of...")

## Decisions Log

| Date       | Decision                  | Rationale                                                                                                       |
| ---------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 2026-03-19 | Initial design system     | Created by /design-consultation based on competitive research of Datadog, Grafana, Better Stack, Linear, Vercel |
| 2026-03-19 | JetBrains Mono everywhere | Mono-first typography gives WhateverOPS a distinctive 'control room' identity. Nobody in SaaS does this.        |
| 2026-03-19 | Sky blue (#0EA5E9) accent | Replaces AI-slop purple (#7C3AED). Reads as monitoring/infrastructure. Unique in the ops space.                 |
| 2026-03-19 | Warm slate neutrals       | Following Linear's direction. Less cold/sterile than pure gray. Better for long monitoring sessions.            |
