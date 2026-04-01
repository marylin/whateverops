import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { AIProviderPanel } from '../AIProviderPanel'
import { AnthropicPanel } from '../AnthropicPanel'
import { CloudflarePanel } from '../CloudflarePanel'
import { GenericPanel } from '../GenericPanel'
import { GitHubPanel } from '../GitHubPanel'
import { LinearPanel } from '../LinearPanel'
import { NeonPanel } from '../NeonPanel'
import { OpenAIPanel } from '../OpenAIPanel'
import { PostHogPanel } from '../PostHogPanel'
import { RailwayPanel } from '../RailwayPanel'
import { ResendPanel } from '../ResendPanel'
import { SelfMonitoringPanel } from '../SelfMonitoringPanel'
import { SentryPanel } from '../SentryPanel'
import { StripePanel } from '../StripePanel'
import { SupabaseAuthPanel } from '../SupabaseAuthPanel'
import { SupabaseMgmtPanel } from '../SupabaseMgmtPanel'
import { VercelPanel } from '../VercelPanel'

// ---------------------------------------------------------------------------
// 1. AIProviderPanel
// ---------------------------------------------------------------------------
describe('AIProviderPanel', () => {
  const mockData = {
    keyValid: true,
    availableModels: ['gpt-4'],
    modelCount: 1,
    rateLimits: {
      tokensRemaining: 5000,
      tokensLimit: 10000,
      tokensUsedPct: 50,
      requestsRemaining: 100,
      requestsLimit: 200,
      requestsUsedPct: 50,
      tokensReset: null,
    },
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<AIProviderPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders invalid key state', () => {
    const { container } = render(<AIProviderPanel data={{ ...mockData, keyValid: false }} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 2. AnthropicPanel
// ---------------------------------------------------------------------------
describe('AnthropicPanel', () => {
  const mockData = {
    keyValid: true,
    availableModels: ['claude-3-opus'],
    modelCount: 1,
    rateLimits: {
      tokensRemaining: 5000,
      tokensLimit: 10000,
      tokensUsedPct: 50,
      requestsRemaining: 100,
      requestsLimit: 200,
      requestsUsedPct: 50,
      tokensReset: null,
    },
    usage: {
      totalCost30d: 42.5,
      dailyCosts: [{ date: '2026-03-31', cost: 1.5 }],
      modelUsage: [
        {
          model: 'claude-3-opus',
          inputTokens: 1000,
          outputTokens: 500,
          cachedInputTokens: 200,
        },
      ],
      hasAdminKey: true,
    },
    projectedMonthlySpend: 50,
    costTrendPct: 5,
    highestCostModel: 'claude-3-opus',
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<AnthropicPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders invalid key state', () => {
    const { container } = render(<AnthropicPanel data={{ ...mockData, keyValid: false }} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 3. CloudflarePanel
// ---------------------------------------------------------------------------
describe('CloudflarePanel', () => {
  const mockData = {
    requests24h: 12000,
    bandwidth24h: '1.2 GB',
    threatsBlocked: 5,
    cacheHitRatio: 85,
    zoneName: 'example.com',
    zoneStatus: 'active',
    sslStatus: 'active',
    sslCertCount: 2,
    responseBreakdown: { status2xx: 9000, status3xx: 500, status4xx: 300, status5xx: 10 },
    firewallEventsCount: 3,
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<CloudflarePanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 4. GenericPanel
// ---------------------------------------------------------------------------
describe('GenericPanel', () => {
  const mockData = {
    status: 'ok',
    count: 42,
    active: true,
    items: ['a', 'b'],
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<GenericPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with empty data', () => {
    const { container } = render(<GenericPanel data={{}} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 5. GitHubPanel
// ---------------------------------------------------------------------------
describe('GitHubPanel', () => {
  const mockData = {
    repos: [
      {
        name: 'my-repo',
        fullName: 'user/my-repo',
        htmlUrl: 'https://github.com/user/my-repo',
        stars: 10,
        openIssues: 2,
        language: 'TypeScript',
        lastPush: '2026-03-31T12:00:00Z',
        visibility: 'public',
        isPrimary: true,
      },
    ],
    stars: 10,
    openIssues: 2,
    openPRs: 1,
    forks: 3,
    watchers: 5,
    language: 'TypeScript',
    lastPush: '2026-03-31T12:00:00Z',
    repoUrl: 'https://github.com/user/my-repo',
    externalPRs: 0,
    staleIssuesCount: 0,
    starsTrend: 1,
    issues: [],
    lastCommit: {
      sha: 'abc1234567890',
      message: 'fix: something',
      date: '2026-03-31T12:00:00Z',
      author: 'user',
      url: 'https://github.com/user/my-repo/commit/abc1234567890',
    },
    cicd: {
      recentRuns: [],
      successRate: 100,
      lastRunConclusion: 'success',
    },
    dependabot: {
      openAlerts: 0,
      criticalCount: 0,
      highCount: 0,
      alerts: [],
    },
    traffic: {
      views: 100,
      uniqueVisitors: 50,
      clones: 10,
      uniqueCloners: 5,
    },
    repoActivities: [],
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<GitHubPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 6. LinearPanel
// ---------------------------------------------------------------------------
describe('LinearPanel', () => {
  const mockData = {
    teamName: 'Engineering',
    teamKey: 'ENG',
    totalIssues: 50,
    openCount: 20,
    inProgressIssues: [
      {
        identifier: 'ENG-1',
        title: 'Fix bug',
        priority: 2,
        priorityLabel: 'High',
        stateName: 'In Progress',
        labels: ['bug'],
        projectName: 'Core',
        url: 'https://linear.app/team/ENG-1',
      },
    ],
    inProgressCount: 1,
    priorityBreakdown: { Urgent: 1, High: 5, Medium: 10, Low: 4 },
    labelBreakdown: { bug: 3, feature: 7 },
    projects: [{ name: 'Core', state: 'started', progress: 0.6 }],
    bugsInProgress: 1,
    featuresInProgress: 0,
    cycleName: 'Sprint 12',
    cycleProgress: 0.4,
    daysLeftInCycle: 5,
    completedThisCycle: 8,
    cycleTotalIssues: 20,
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<LinearPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 7. NeonPanel
// ---------------------------------------------------------------------------
describe('NeonPanel', () => {
  const mockData = {
    projectCount: 1,
    projects: [
      {
        name: 'my-db',
        region: 'us-east-1',
        pgVersion: 15,
        updatedAt: '2026-03-31T12:00:00Z',
        branchCount: 2,
        primaryBranch: 'main',
        endpointCount: 1,
        endpointStatus: 'active',
        activeTimeSec: 3600,
        computeTimeSec: 1800,
        storageMB: 256,
      },
    ],
    totalBranches: 2,
    totalEndpoints: 1,
    allEndpointsActive: true,
    primaryEndpointStatus: 'active',
    storageUsedPct: 25,
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<NeonPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 8. OpenAIPanel
// ---------------------------------------------------------------------------
describe('OpenAIPanel', () => {
  const mockData = {
    keyValid: true,
    availableModels: ['gpt-4'],
    modelCount: 1,
    rateLimits: {
      tokensRemaining: 5000,
      tokensLimit: 10000,
      tokensUsedPct: 50,
      requestsRemaining: 100,
      requestsLimit: 200,
      requestsUsedPct: 50,
    },
    usage: {
      totalCost30d: 30,
      dailyCosts: [{ date: '2026-03-31', cost: 1.0 }],
      modelUsage: [{ model: 'gpt-4', inputTokens: 1000, outputTokens: 500 }],
      hasData: true,
    },
    projectedMonthlySpend: 35,
    costTrendPct: 3,
    highestCostModel: 'gpt-4',
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<OpenAIPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders invalid key state', () => {
    const { container } = render(<OpenAIPanel data={{ ...mockData, keyValid: false }} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 9. PostHogPanel
// ---------------------------------------------------------------------------
describe('PostHogPanel', () => {
  const mockData = {
    dau: 150,
    wau: 800,
    eventsToday: 5000,
    eventsTrend: [
      { date: '2026-03-30', count: 4500 },
      { date: '2026-03-31', count: 5000 },
    ],
    topEvents: [
      { event: 'pageview', count: 3000 },
      { event: 'click', count: 1500 },
    ],
    dauTrend: [
      { date: '2026-03-30', count: 140 },
      { date: '2026-03-31', count: 150 },
    ],
    dauChangePercent: 7,
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<PostHogPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 10. RailwayPanel
// ---------------------------------------------------------------------------
describe('RailwayPanel', () => {
  const mockData = {
    projectCount: 1,
    serviceCount: 2,
    recentDeploys: [
      {
        id: 'deploy-1',
        status: 'SUCCESS',
        createdAt: '2026-03-31T12:00:00Z',
        serviceName: 'api',
      },
    ],
    lastDeployTime: '2026-03-31T12:00:00Z',
    activeServices: 2,
    services: [
      {
        name: 'api',
        project: 'my-project',
        latestDeployStatus: 'SUCCESS',
        healthcheckPath: '/health',
        replicas: 1,
        restartCount: 0,
        upSince: '2026-03-30T00:00:00Z',
        healthy: true,
        restartLooping: false,
      },
    ],
    allServicesHealthy: true,
    unhealthyServiceCount: 0,
    longestUptime: '2026-03-30T00:00:00Z',
    deployInProgress: false,
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<RailwayPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 11. ResendPanel
// ---------------------------------------------------------------------------
describe('ResendPanel', () => {
  const mockData = {
    domainCount: 1,
    domains: [{ name: 'mail.example.com', status: 'verified' }],
    apiKeyCount: 2,
    recentEmails: [
      {
        to: 'user@example.com',
        subject: 'Welcome',
        status: 'delivered',
        sent: '2026-03-31T10:00:00Z',
      },
    ],
    deliveryRate: 98,
    totalSent: 500,
    bouncedCount: 5,
    domainStats: [
      {
        name: 'mail.example.com',
        status: 'verified',
        totalSent: 500,
        deliveredCount: 490,
        bouncedCount: 5,
        deliveryRate: 98,
        recentEmails: [
          {
            id: 'email-1',
            to: 'user@example.com',
            subject: 'Welcome',
            status: 'delivered',
            sent: '2026-03-31T10:00:00Z',
          },
        ],
      },
    ],
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<ResendPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 12. SelfMonitoringPanel
// ---------------------------------------------------------------------------
describe('SelfMonitoringPanel', () => {
  const mockData = {
    status: 'ok' as const,
    uptime: '99.9%',
    lastChecked: '2026-03-31T12:00:00Z',
    responseTime_ms: 120,
    responseTimeStatus: 'fast' as const,
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<SelfMonitoringPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders error state', () => {
    const { container } = render(
      <SelfMonitoringPanel data={{ ...mockData, status: 'error', responseTimeStatus: 'slow' }} />,
    )
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 13. SentryPanel
// ---------------------------------------------------------------------------
describe('SentryPanel', () => {
  const mockData = {
    unresolvedCount: 12,
    events24h: 300,
    newIssues24h: 2,
    usersAffected24h: 50,
    latestIssues: [
      {
        id: 'issue-1',
        title: 'TypeError: Cannot read property',
        culprit: 'app.js',
        count: 15,
        level: 'error',
        lastSeen: '2026-03-31T11:00:00Z',
        userCount: 10,
      },
    ],
    crashFreeRate: 99.7,
    errorTrend: [
      { date: '2026-03-30', count: 280 },
      { date: '2026-03-31', count: 300 },
    ],
    errorTrendDirection: 'stable' as const,
    latestRelease: { version: '1.2.3', date: '2026-03-28T10:00:00Z' },
    issuesSinceRelease: 3,
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<SentryPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 14. StripePanel
// ---------------------------------------------------------------------------
describe('StripePanel', () => {
  const mockData = {
    mrr: 2500,
    mrrDelta30d: 150,
    mrrGrowthPct: 6.4,
    projectedAnnualRevenue: 30000,
    arpu: 25,
    activeSubscriptions: 100,
    newSubscriptions24h: 2,
    daysSinceLastNewSub: 0,
    canceledSubscriptions30d: 3,
    failedPayments24h: 0,
    failedPaymentAmount: 0,
    recentEvents: [],
    churnRate30d: 3,
    currency: 'usd',
    netRevenue30d: 2350,
    disputes: { count: 0, totalAmount: 0 },
    openInvoices: { count: 1, totalAmount: 50 },
    recentPayouts: [{ amount: 2000, arrivalDate: '2026-03-30T00:00:00Z', status: 'paid' }],
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<StripePanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 15. SupabaseAuthPanel
// ---------------------------------------------------------------------------
describe('SupabaseAuthPanel', () => {
  const mockData = {
    totalUsers: 250,
    recentSignups: 12,
    activeRecently: 80,
    providerBreakdown: { email: 180, google: 50, github: 20 },
    signupsTrend: 'up' as const,
    dauPct: 32,
    daysSinceLastSignup: 0,
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<SupabaseAuthPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 16. SupabaseMgmtPanel
// ---------------------------------------------------------------------------
describe('SupabaseMgmtPanel', () => {
  const mockData = {
    projectCount: 1,
    projects: [
      {
        id: 'proj-1',
        projectName: 'my-app',
        projectStatus: 'ACTIVE_HEALTHY',
        region: 'us-east-1',
        dbVersion: '15.1',
        healthChecks: [{ name: 'database', status: 'ok' }],
        healthyCount: 1,
        totalChecks: 1,
        readOnly: false,
        advisorCount: 0,
        advisors: [],
      },
    ],
    projectName: 'my-app',
    projectStatus: 'ACTIVE_HEALTHY',
    region: 'us-east-1',
    dbVersion: '15.1',
    healthChecks: [{ name: 'database', status: 'ok' }],
    healthyCount: 1,
    totalChecks: 1,
    readOnly: false,
    advisorCount: 0,
    advisors: [],
    apiRequestCount: 5000,
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<SupabaseMgmtPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 17. VercelPanel
// ---------------------------------------------------------------------------
describe('VercelPanel', () => {
  const mockData = {
    projectCount: 2,
    projects: [
      {
        id: 'proj-1',
        name: 'my-app',
        framework: 'nextjs',
        url: 'https://my-app.vercel.app',
        latestDeploy: {
          status: 'READY',
          created: '2026-03-31T12:00:00Z',
          commitMessage: 'feat: add dashboard',
          buildDurationSec: 45,
          errorMessage: null,
        },
      },
    ],
    recentDeploys: [
      {
        id: 'deploy-1',
        project: 'my-app',
        status: 'READY',
        created: '2026-03-31T12:00:00Z',
        url: 'https://my-app-abc123.vercel.app',
        commitMessage: 'feat: add dashboard',
        target: 'production',
        buildDurationSec: 45,
        errorMessage: null,
        checksStatus: null,
        source: 'github',
      },
    ],
    lastDeployTime: '2026-03-31T12:00:00Z',
    successRate: 95,
    domains: [
      {
        name: 'my-app.com',
        project: 'my-app',
        healthy: true,
        sslReady: true,
        misconfigured: false,
      },
    ],
    domainHealthy: true,
    lastProductionDeploy: {
      id: 'deploy-1',
      project: 'my-app',
      status: 'READY',
      created: '2026-03-31T12:00:00Z',
      url: 'https://my-app.vercel.app',
      commitMessage: 'feat: add dashboard',
      buildDurationSec: 45,
      errorMessage: null,
    },
    timeSinceLastDeploy: '2 hours ago',
  }

  it('renders without crashing with valid data', () => {
    const { container } = render(<VercelPanel data={mockData} />)
    expect(container.firstChild).toBeTruthy()
  })
})
