#!/usr/bin/env bun
/**
 * Generate CHANGELOG.md from git log using conventional commit format.
 *
 * Usage:
 *   bun run scripts/generate-changelog.ts              # full changelog
 *   bun run scripts/generate-changelog.ts --since v0.1  # since tag
 *   bun run scripts/generate-changelog.ts --dry-run     # print to stdout
 */

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const sinceIdx = args.indexOf('--since')
const sinceTag = sinceIdx !== -1 ? args[sinceIdx + 1] : undefined

interface Commit {
  hash: string
  type: string
  scope: string
  subject: string
  date: string
}

interface GroupedCommits {
  [date: string]: {
    [type: string]: Commit[]
  }
}

const TYPE_LABELS: Record<string, string> = {
  feat: 'Features',
  fix: 'Bug Fixes',
  refactor: 'Refactoring',
  test: 'Tests',
  docs: 'Documentation',
  chore: 'Chores',
  perf: 'Performance',
  ci: 'CI/CD',
}

function getGitLog(): string {
  const range = sinceTag ? `${sinceTag}..HEAD` : ''
  const format = '%H|%s|%aI'
  try {
    return execSync(`git log ${range} --pretty=format:"${format}" --no-merges`, {
      encoding: 'utf-8',
    }).trim()
  } catch {
    console.error('Failed to read git log. Are you in a git repository?')
    process.exit(1)
  }
}

function parseCommit(line: string): Commit | null {
  const parts = line.split('|')
  if (parts.length < 3) return null

  const hash = parts[0]!.slice(0, 7)
  const message = parts[1]!
  const date = parts[2]!.slice(0, 10)

  // Match conventional commit: type(scope): subject
  const match = message.match(/^(\w+)(?:\(([^)]*)\))?\s*:\s*(.+)$/)
  if (!match) {
    return { hash, type: 'other', scope: '', subject: message, date }
  }

  return {
    hash,
    type: match[1]!,
    scope: match[2] ?? '',
    subject: match[3]!,
    date,
  }
}

function groupByDateAndType(commits: Commit[]): GroupedCommits {
  const grouped: GroupedCommits = {}

  for (const commit of commits) {
    if (!grouped[commit.date]) {
      grouped[commit.date] = {}
    }
    const typeGroup = grouped[commit.date]!
    if (!typeGroup[commit.type]) {
      typeGroup[commit.type] = []
    }
    typeGroup[commit.type]!.push(commit)
  }

  return grouped
}

function formatChangelog(grouped: GroupedCommits): string {
  const lines: string[] = [
    '# Changelog',
    '',
    'All notable changes to WhateverOPS are documented here.',
    'Generated from git history using conventional commits.',
    '',
  ]

  const dates = Object.keys(grouped).sort().reverse()

  for (const date of dates) {
    lines.push(`## ${date}`)
    lines.push('')

    const types = grouped[date]!
    const typeOrder = Object.keys(TYPE_LABELS)

    // Known types first, then others
    const sortedTypes = [
      ...typeOrder.filter((t) => types[t]),
      ...Object.keys(types).filter((t) => !typeOrder.includes(t)),
    ]

    for (const type of sortedTypes) {
      const label = TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1)
      const commits = types[type]!

      lines.push(`### ${label}`)
      lines.push('')

      for (const commit of commits) {
        const scope = commit.scope ? `**${commit.scope}:** ` : ''
        lines.push(`- ${scope}${commit.subject} (\`${commit.hash}\`)`)
      }

      lines.push('')
    }
  }

  return lines.join('\n')
}

// Main
const log = getGitLog()
if (!log) {
  console.log('No commits found.')
  process.exit(0)
}

const commits = log
  .split('\n')
  .map(parseCommit)
  .filter((c): c is Commit => c !== null)

const grouped = groupByDateAndType(commits)
const changelog = formatChangelog(grouped)

if (dryRun) {
  console.log(changelog)
} else {
  const outPath = join(__dirname, '..', 'CHANGELOG.md')
  writeFileSync(outPath, changelog + '\n')
  console.log(`Wrote CHANGELOG.md (${commits.length} commits)`)
}
