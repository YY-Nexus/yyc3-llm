# Security Policy

## Supported Versions

- Active development: `main` branch targeting the latest `1.x` series.
- Security fixes: latest released minor/patch versions only.
- End-of-life: versions older than the latest minor release are not maintained.

## Reporting a Vulnerability

- Please email security contacts: `security@your-org.com` (placeholder). Do not open public issues for sensitive reports.
- Include: affected version/commit, environment, reproduction steps, impact, and suggested mitigation if known.
- We commit to acknowledging reports within 72 hours and providing a remediation timeline after triage.

## Handling & Disclosure

- We follow responsible disclosure. A fix is prepared, tested, and released before public details are shared.
- CVE assignment will be requested when severity warrants it.

## Hardening Checklist (Project-level)

- Dependency audits: `npm run security:audit` on each release.
- Static analysis: ESLint + TypeScript checks in CI.
- Secrets: never commit `.env*` files; use environment providers.
- Data: sanitize and validate external inputs with `zod` and server-side checks.

## Cryptography & Secrets

- Store secrets using environment variables and platform secret managers.
- Rotate credentials regularly and after incidents.

## Contact & Scope

- Scope: web app (`next.js`), API routes under `app/api/*`, and supporting scripts.
- Contact: `security@your-org.com` (update to your real mailbox).