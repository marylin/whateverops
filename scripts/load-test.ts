#!/usr/bin/env bun
/**
 * Load test for WhateverOPS dashboard API.
 *
 * Usage:
 *   bun run scripts/load-test.ts                           # 100 concurrent, default
 *   bun run scripts/load-test.ts --concurrency 1000        # 1000 concurrent
 *   bun run scripts/load-test.ts --url http://prod:3000    # custom URL
 *   bun run scripts/load-test.ts --save                    # save report to tests/reports/
 */

import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)

function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 && args[idx + 1] ? args[idx + 1]! : fallback
}

const BASE_URL = getArg('url', 'http://localhost:3000')
const CONCURRENCY = parseInt(getArg('concurrency', '100'), 10)
const SAVE_REPORT = args.includes('--save')

interface RequestResult {
  status: number
  duration: number
  error?: string
}

async function makeRequest(url: string): Promise<RequestResult> {
  const start = performance.now()
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
    })
    return {
      status: res.status,
      duration: performance.now() - start,
    }
  } catch (err) {
    return {
      status: 0,
      duration: performance.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]!
}

function formatMs(ms: number): string {
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`
}

async function runLoadTest(): Promise<void> {
  console.log(`Load test: ${CONCURRENCY} concurrent requests to ${BASE_URL}`)
  console.log('---')

  // 1. Health check first
  console.log('Checking health...')
  const health = await makeRequest(`${BASE_URL}/health`)
  if (health.status !== 200) {
    console.error(`Health check failed (status ${health.status}). Is the server running?`)
    process.exit(1)
  }
  console.log(`Health OK (${formatMs(health.duration)})`)

  // 2. Warm up with a single dashboard request
  console.log('Warming up...')
  const warmup = await makeRequest(`${BASE_URL}/api/dashboard`)
  console.log(`Warmup: ${warmup.status} (${formatMs(warmup.duration)})`)

  // 3. Run concurrent requests
  console.log(`\nFiring ${CONCURRENCY} concurrent requests to /api/dashboard...`)
  const totalStart = performance.now()

  const promises: Promise<RequestResult>[] = []
  for (let i = 0; i < CONCURRENCY; i++) {
    promises.push(makeRequest(`${BASE_URL}/api/dashboard`))
  }
  const results = await Promise.all(promises)

  const totalDuration = performance.now() - totalStart

  // 4. Analyze
  const durations = results.map((r) => r.duration).sort((a, b) => a - b)
  const successes = results.filter((r) => r.status === 200).length
  const failures = results.filter((r) => r.status !== 200)
  const errors = results.filter((r) => r.error)

  const stats = {
    total: results.length,
    successes,
    failures: failures.length,
    errors: errors.length,
    totalDuration: formatMs(totalDuration),
    rps: ((results.length / totalDuration) * 1000).toFixed(1),
    min: formatMs(durations[0]!),
    max: formatMs(durations[durations.length - 1]!),
    mean: formatMs(durations.reduce((a, b) => a + b, 0) / durations.length),
    p50: formatMs(percentile(durations, 50)),
    p90: formatMs(percentile(durations, 90)),
    p95: formatMs(percentile(durations, 95)),
    p99: formatMs(percentile(durations, 99)),
  }

  // 5. Report
  console.log('\n--- Results ---')
  console.log(`Requests:     ${stats.total} (${stats.successes} ok, ${stats.failures} failed)`)
  console.log(`Total time:   ${stats.totalDuration}`)
  console.log(`Throughput:   ${stats.rps} req/s`)
  console.log(`Min:          ${stats.min}`)
  console.log(`Mean:         ${stats.mean}`)
  console.log(`P50:          ${stats.p50}`)
  console.log(`P90:          ${stats.p90}`)
  console.log(`P95:          ${stats.p95}`)
  console.log(`P99:          ${stats.p99}`)
  console.log(`Max:          ${stats.max}`)

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`)
    const errorGroups = new Map<string, number>()
    for (const e of errors) {
      const key = e.error ?? 'unknown'
      errorGroups.set(key, (errorGroups.get(key) ?? 0) + 1)
    }
    for (const [msg, count] of errorGroups) {
      console.log(`  ${count}x ${msg}`)
    }
  }

  // 6. Pass/fail
  const p99ms = percentile(durations, 99)
  const passed = p99ms < 5000
  console.log(
    `\n${passed ? 'PASS' : 'FAIL'}: P99 ${formatMs(p99ms)} ${passed ? '<' : '>='} 5s target`,
  )

  // 7. Save report
  if (SAVE_REPORT) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const reportDir = join(__dirname, '..', 'tests', 'reports')
    mkdirSync(reportDir, { recursive: true })
    const reportPath = join(reportDir, `load-test-${timestamp}.md`)

    const report = [
      `# Load Test Report`,
      ``,
      `Date: ${new Date().toISOString()}`,
      `URL: ${BASE_URL}/api/dashboard`,
      `Concurrency: ${CONCURRENCY}`,
      ``,
      `## Results`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total requests | ${stats.total} |`,
      `| Successes | ${stats.successes} |`,
      `| Failures | ${stats.failures} |`,
      `| Total time | ${stats.totalDuration} |`,
      `| Throughput | ${stats.rps} req/s |`,
      `| Min | ${stats.min} |`,
      `| Mean | ${stats.mean} |`,
      `| P50 | ${stats.p50} |`,
      `| P90 | ${stats.p90} |`,
      `| P95 | ${stats.p95} |`,
      `| P99 | ${stats.p99} |`,
      `| Max | ${stats.max} |`,
      ``,
      `## Verdict`,
      ``,
      `${passed ? 'PASS' : 'FAIL'}: P99 ${formatMs(p99ms)} ${passed ? '<' : '>='} 5s target`,
      ``,
    ].join('\n')

    writeFileSync(reportPath, report)
    console.log(`\nReport saved: ${reportPath}`)
  }

  process.exit(passed ? 0 : 1)
}

runLoadTest()
