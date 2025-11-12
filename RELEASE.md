# Release Process

## Versioning

- Semantic Versioning: `MAJOR.MINOR.PATCH`.
- Tag releases with `vX.Y.Z` and create GitHub Releases with changelog notes.

## Branching

- `main`: stable, production-ready.
- `feature/*`: short-lived branches merged via PR.

## Pre-Release Checklist

- Pass CI: lint, type-check, tests, build.
- Update `CHANGELOG.md` for notable changes.
- Verify environment variables and secrets for production.

## Steps

1. Merge approved PRs into `main`.
2. Bump version in `package.json` (optional, if you prefer tagging-only, skip).
3. Create tag: `git tag vX.Y.Z && git push --tags`.
4. Publish Release notes in GitHub with highlights and upgrade notes.
5. Deploy using `npm run start:production` (or your platform pipeline).

## Post-Release

- Monitor logs and metrics.
- If incidents occur, open a `hotfix/*` branch and release a patch.