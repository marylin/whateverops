import { chromium } from 'playwright'

const BASE_URL = 'http://localhost:5174'
const OUT_DIR = 'docs/screenshots'

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  })
  const page = await context.newPage()

  console.log('Loading dashboard...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  // Full dashboard screenshot (scrollable)
  console.log('Taking full dashboard screenshot...')
  await page.screenshot({ path: `${OUT_DIR}/dashboard-full.png`, fullPage: true })

  // Viewport screenshot (above the fold)
  console.log('Taking viewport screenshot...')
  await page.screenshot({ path: `${OUT_DIR}/dashboard-viewport.png`, fullPage: false })

  // Section screenshots — each group is a <section role="region" aria-label="X group">
  const sectionLabels = ['Revenue', 'Health', 'Users', 'Costs', 'Attention']
  for (const label of sectionLabels) {
    const slug = label.toLowerCase()
    const section = page.locator(`section[aria-label="${label} group"]`).first()
    if ((await section.count()) > 0) {
      console.log(`Taking section screenshot: ${slug}...`)
      await section.screenshot({ path: `${OUT_DIR}/section-${slug}.png` })
    } else {
      console.log(`Section not found: ${label}`)
    }
  }

  // Individual card screenshots
  // Cards have an h3 with the panel name
  const panelNames = [
    'GitHub',
    'Linear',
    'Vercel',
    'Railway',
    'Resend',
    'Anthropic',
    'OpenAI',
    'Supabase',
    'Supabase Auth',
    'Supabase Storage',
    'Neon',
    'Stripe',
    'Blotato',
    'WhateverOPS',
  ]

  for (const name of panelNames) {
    const slug = name.toLowerCase().replace(/\s+/g, '-')

    // Find h3 with exact or containing text
    const heading = page.locator('h3').filter({ hasText: name }).first()
    if ((await heading.count()) === 0) {
      console.log(`Card heading not found: ${name}`)
      continue
    }

    // Card wrapper: PanelCard uses rounded-xl + border
    const card = heading
      .locator('xpath=ancestor::div[contains(@class, "rounded-xl") and contains(@class, "border")]')
      .last()
    if ((await card.count()) === 0) {
      console.log(`Card container not found: ${name}`)
      continue
    }

    // Default state screenshot
    console.log(`Taking card screenshot: ${name}...`)
    await card.screenshot({ path: `${OUT_DIR}/card-${slug}.png` })

    // Check for expandable content — look for chevron buttons inside the card
    try {
      const expandButtons = card.locator('button svg.transition-transform, button:has-text("▶")')
      const count = await expandButtons.count()
      if (count > 0) {
        const btn = expandButtons.first()
        await btn.click({ timeout: 2000 })
        await page.waitForTimeout(500)
        console.log(`Taking expanded card screenshot: ${name}...`)
        await card.screenshot({ path: `${OUT_DIR}/card-${slug}-expanded.png` })
        await btn.click({ timeout: 2000 }).catch(() => {})
        await page.waitForTimeout(300)
      }
    } catch {
      // Expand failed — skip, we already have the default screenshot
    }
  }

  // Admin telemetry page
  console.log('Taking telemetry admin screenshot...')
  await page.goto(`${BASE_URL}/admin/telemetry`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${OUT_DIR}/admin-telemetry.png`, fullPage: true })

  await browser.close()
  console.log(`Done! ${await countFiles()} screenshots saved to ${OUT_DIR}`)
}

async function countFiles(): Promise<number> {
  const { readdirSync } = await import('fs')
  return readdirSync(OUT_DIR).filter((f) => f.endsWith('.png')).length
}

main().catch(console.error)
