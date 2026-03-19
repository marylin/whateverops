# OSS Launch Review Prompts (Phase 3 / 3.1)

Ready-to-use gstack skill prompts for improving launch readiness.

---

## 1. CEO/Founder Review — Launch Strategy

```
/plan-ceo-review Review the WhateverOPS OSS launch plan (Phase 3 + 3.1). The code gaps are closed but marketing/ops gaps remain: no demo GIF, repo still private, no auto-scaling, blog/PH/HN posts not drafted, launch email not sent. Challenge what's truly blocking launch vs. nice-to-have. Should we ship now or close more gaps first?
```

**Purpose:** Challenge assumptions, prioritize what actually matters for launch day, avoid over-preparing.

---

## 2. Engineering Manager Review — Technical Readiness

```
/plan-eng-review Audit the Phase 3 + 3.1 implementation for launch readiness. Focus on: self-monitoring integration reliability, status page edge cases (what if all integrations are down?), Railway single-replica risk under traffic spikes, E2E test coverage gaps, and security posture for a newly public repo. What breaks on day one?
```

**Purpose:** Catch technical landmines before real users hit them. Lock down architecture and edge cases.

---

## 3. QA — Systematic Testing Before Public

```
/qa Run standard QA against WhateverOPS before OSS launch. Test: dashboard loads with all 15 integration panels, status page at /status renders correctly, self-monitoring panel shows health data, error states display properly when APIs are unreachable, and the launch email template renders. Fix any bugs found.
```

**Purpose:** Find and fix bugs before the repo goes public and strangers start cloning it.
