# 📝 YanYu-LLM 版本变更记录

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://github.com/YY-Nexus/YanYu-DeepStack/actions)

**版本**：1.2.0  
**最后更新**：2024年10月15日
**作者**：YYC 团队

本文件记录 YanYu-LLM 项目的所有重要变更。

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- 🔒 **CRITICAL**: Fixed Next.js Remote Code Execution (RCE) vulnerability (GHSA-9qr9-h5gf-34mp, CVSS 10.0)
  - Upgraded Next.js from 15.5.5 to 15.5.7
  - Eliminated critical security threat with perfect severity score
  - See SECURITY_FIX_SUMMARY.md for detailed information

### Changed
- 🔧 Pinned axios version to ^1.12.2 (was "latest") for build stability
- 🔧 Pinned nanoid version to ^5.1.6 (was "latest") for build stability

### Notes
- 4 low-severity vulnerabilities remain in dev dependency @lhci/cli (acceptable risk)
- All critical, high, and moderate vulnerabilities resolved
- Production dependencies are secure and up-to-date

## [1.0.0] - 2025-10-24

- Initial public baseline of the project.