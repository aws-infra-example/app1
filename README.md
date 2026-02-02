# app1

Sample application demonstrating the edge deployment workflow for the multi-app ecosystem.

## Overview

This app is part of a multi-app ecosystem deployed to AWS S3 + CloudFront. It follows the standard deployment pattern: build-time token replacement, versioned artifact storage, and GitOps-driven environment promotion.

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         App Deployment Flow                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Source                    Build                        Deploy               │
│  ──────                    ─────                        ──────               │
│                                                                              │
│  src/main.js ───►  build.mjs  ───►  dist/main.js ───►  S3 Bucket            │
│  src/index.html    (token         (tokens replaced)     │                   │
│  src/styles.css     replacement)                        ▼                   │
│                                                    CloudFront               │
│  Tokens replaced:                                       │                   │
│  • __APP_REF__   → git ref                             ▼                   │
│  • __APP_SHA__   → commit SHA                   /{env}/app1/               │
│  • __BUILD_TIME__ → ISO timestamp               /prod/app1/index.html      │
│  • __APP_ENV__   → environment                  /dev/app1/main.js          │
│  • __APP_CONFIG__ → config JSON                 /sandbox-pr-42/app1/       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Repository Structure

```
app1/
├── src/
│   ├── index.html          # App entry point
│   ├── main.js             # Client-side logic with token placeholders
│   └── styles.css          # Styling
├── config/
│   ├── dev.json            # Dev environment config
│   ├── staging.json        # Staging environment config
│   ├── prod.json           # Production environment config
│   └── sandbox.json        # Sandbox environment config
├── tests/
│   ├── unit/               # Unit tests
│   ├── build.test.mjs      # Build process tests
│   └── e2e/                # End-to-end tests
├── dist/                   # Build output (gitignored)
├── build.mjs               # Build script
├── playwright.config.mjs   # E2E test configuration
└── .github/workflows/      # CI/CD workflows
```

## Workflows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Workflow Triggers                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ push to main                                                          │   │
│  │     │                                                                 │   │
│  │     ▼                                                                 │   │
│  │ deploy-dev.yml                                                        │   │
│  │     • Build with APP_ENV=dev, APP_REF={sha}                          │   │
│  │     • Sync to S3 /dev/app1/                                          │   │
│  │     • Invalidate CloudFront /dev/app1/*                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ push to release/*                                                     │   │
│  │     │                                                                 │   │
│  │     ▼                                                                 │   │
│  │ deploy-staging.yml                                                    │   │
│  │     • Build with APP_ENV=staging, APP_REF={branch}                   │   │
│  │     • Sync to S3 /staging/app1/                                      │   │
│  │     • Sync to S3 /artifacts/app1/{branch}/                           │   │
│  │     • Invalidate CloudFront /staging/app1/*                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ GitHub Release published                                              │   │
│  │     │                                                                 │   │
│  │     ▼                                                                 │   │
│  │ deploy-prod.yml                                                       │   │
│  │     • Build with APP_ENV=prod, APP_REF={tag}                         │   │
│  │     • Sync to S3 /prod/app1/                                         │   │
│  │     • Sync to S3 /artifacts/app1/{tag}/                              │   │
│  │     • Invalidate CloudFront /prod/app1/*                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PR opened/synchronized                                                │   │
│  │     │                                                                 │   │
│  │     ▼                                                                 │   │
│  │ pr-sandbox.yml                                                        │   │
│  │     • Run unit tests (npm test)                                      │   │
│  │     • Build with APP_ENV=sandbox-pr-{n}                              │   │
│  │     • Upload to S3 /artifacts/app1/pr-{n}/                           │   │
│  │     • Trigger infra-ecosystem create-sandbox.yml                     │   │
│  │     • Run e2e tests against deployed sandbox                         │   │
│  │     • Comment PR with sandbox URL                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PR closed                                                             │   │
│  │     │                                                                 │   │
│  │     ▼                                                                 │   │
│  │ pr-closed.yml                                                         │   │
│  │     • Trigger infra-ecosystem close-sandbox.yml                      │   │
│  │     • S3 cleanup via 7-day lifecycle rule                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Manual: create-release.yml                                            │   │
│  │     │                                                                 │   │
│  │     ▼                                                                 │   │
│  │ Creates release/v{version} branch                                    │   │
│  │     → Triggers deploy-staging.yml                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Release Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Dev → Staging → Production                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DEVELOPMENT                                                              │
│     Automatic on push to main                                                │
│     ─────────────────────────                                                │
│     commit abc123                                                            │
│         │                                                                    │
│         └──► deploy-dev.yml                                                 │
│                   │                                                          │
│                   └──► S3: /dev/app1/                                       │
│                                                                              │
│  2. STAGING                                                                  │
│     Manual trigger: "Create Release" workflow                               │
│     ────────────────────────────────────────                                 │
│     version: 1.2.0                                                          │
│         │                                                                    │
│         └──► Creates branch: release/v1.2.0                                 │
│                   │                                                          │
│                   └──► deploy-staging.yml                                   │
│                             │                                                │
│                             ├──► S3: /staging/app1/                         │
│                             └──► S3: /artifacts/app1/release-v1.2.0/        │
│                                                                              │
│  3. RELEASE GATE                                                             │
│     Manual trigger: infra-ecosystem release-gate.yml                        │
│     ────────────────────────────────────────────────                         │
│     environment: staging                                                     │
│         │                                                                    │
│         └──► Runs full e2e suite                                            │
│                   │                                                          │
│                   └──► Pass: ready for production                           │
│                                                                              │
│  4. PRODUCTION                                                               │
│     Create GitHub Release with tag v1.2.0                                   │
│     ────────────────────────────────────────                                 │
│     tag: v1.2.0                                                             │
│         │                                                                    │
│         └──► deploy-prod.yml                                                │
│                   │                                                          │
│                   ├──► S3: /prod/app1/                                      │
│                   └──► S3: /artifacts/app1/v1.2.0/                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Build Process

The build script (`build.mjs`) performs token replacement:

| Token | Source | Example Value |
|-------|--------|---------------|
| `__APP_REF__` | `APP_REF` env var | `v1.0.0`, `main`, `pr-42` |
| `__APP_SHA__` | `APP_SHA` env var | `abc1234def5678...` |
| `__BUILD_TIME__` | Current time | `2024-01-15T12:00:00.000Z` |
| `__APP_ENV__` | `APP_ENV` env var | `prod`, `staging`, `sandbox-pr-42` |
| `__APP_CONFIG__` | Config file JSON | `{"feature": true}` |

### Config Selection

- `sandbox-*` environments → `config/sandbox.json`
- All other environments → `config/{env}.json`

## Testing

### Unit Tests

```bash
npm test
```

Runs build process tests and unit tests.

### E2E Tests

```bash
# Against deployed environment
E2E_BASE_URL=https://example.cloudfront.net E2E_ENV=dev npm run test:e2e
```

Uses `@aws-infra-example/e2e-lib` for test helpers and assertions.

## Relationship to Ecosystem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Ecosystem Integration                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  This App (app1)                    infra-ecosystem                         │
│  ───────────────                    ───────────────                          │
│                                                                              │
│  Publishes artifacts ──────────────► Uses artifacts to compose              │
│  to S3 /artifacts/                   environment deployments                 │
│                                                                              │
│  Triggers sandbox ─────────────────► Creates sandbox manifest,               │
│  creation on PR                      deploys all apps                        │
│                                                                              │
│  Triggers sandbox ─────────────────► Closes PR, deletes branch              │
│  cleanup on PR close                 S3 expires after 7 days                 │
│                                                                              │
│  e2e tests run ────────────────────► Orchestrator runs all app              │
│  individually                        e2e tests as release gate              │
│                                                                              │
│  Uses manifest at ─────────────────► Generated by infra-ecosystem           │
│  /{env}/manifest.json                at deploy time                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## S3 Paths

| Path | Purpose | Lifecycle |
|------|---------|-----------|
| `/dev/app1/` | Development deployment | Overwritten on each push to main |
| `/staging/app1/` | Staging deployment | Overwritten on each release branch push |
| `/prod/app1/` | Production deployment | Overwritten on each GitHub Release |
| `/sandbox-pr-{n}/app1/` | PR sandbox | 7-day automatic expiration |
| `/artifacts/app1/{ref}/` | Versioned artifacts | Retained for redeployment |

## Related Repositories

| Repository | Purpose |
|------------|---------|
| `infra-ecosystem/` | CDK infrastructure, ecosystem workflows, manifest generation |
| `e2e-testing/` | Shared e2e library used by this app's tests |
| `app2/` | Sibling app in the ecosystem |
