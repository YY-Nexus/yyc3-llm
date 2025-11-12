#!/usr/bin/env node
/*
Workspace Structure Validator (ESM)
- Checks presence of key top-level files and folders
- Warns about duplicate configs and non-standard items
- Audits Next.js app layout presence and common conventions
*/

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function exists(p) {
  return fs.existsSync(path.join(root, p));
}

function listTopLevel() {
  return fs.readdirSync(root, { withFileTypes: true })
    .map((d) => ({ name: d.name, type: d.isDirectory() ? 'dir' : 'file' }));
}

function audit() {
  const expectedDirs = [
    'app', 'components', 'lib', 'public', 'scripts', 'docs'
  ];
  const expectedFiles = [
    'package.json', 'next.config.mjs', 'tsconfig.json'
  ];

  const top = listTopLevel();
  const presentDirs = top.filter(t => t.type === 'dir').map(t => t.name);
  const presentFiles = top.filter(t => t.type === 'file').map(t => t.name);

  const missing = [];
  expectedDirs.forEach(d => { if (!presentDirs.includes(d)) missing.push(d); });
  expectedFiles.forEach(f => { if (!presentFiles.includes(f)) missing.push(f); });

  const warnings = [];

  // Next.js app layout checks
  const hasAppLayout = exists('app/layout.tsx');
  const hasAppPage = exists('app/page.tsx');
  const hasSrcApp = exists('src/app');
  if (!hasAppLayout) warnings.push('Missing app/layout.tsx');
  if (!hasAppPage) warnings.push('Missing app/page.tsx');
  if (hasSrcApp) warnings.push('Both app/ and src/app/ exist; consider consolidating into one convention (prefer src/app or app, not both).');

  // Duplicate config checks
  if (exists('jest.config.js') && exists('jest.config.cjs')) warnings.push('Duplicate Jest config files: jest.config.js and jest.config.cjs');
  if (exists('tsconfig.json') && exists('tsconfig.web.json')) warnings.push('Multiple TypeScript configs: tsconfig.json and tsconfig.web.json (document usage or consolidate).');

  // Coverage directory
  if (exists('coverage')) warnings.push('Coverage directory present in repo; consider excluding from VCS or storing under artifacts/ if large.');

  // Lint/type outputs
  const noisyOutputs = ['lint-output.txt', 'type-errors.txt', 'type-check.txt', 'tsc-output.log', 'tsc-errors.txt'];
  noisyOutputs.forEach(f => { if (exists(f)) warnings.push(`Generated diagnostic file present: ${f} (consider moving under test-results/ or .logs/)`); });

  // app subdirs
  const appChecks = [
    'app/api', 'app/globals.css', 'app/layout.tsx', 'app/page.tsx'
  ];
  appChecks.forEach(p => { if (!exists(p)) warnings.push(`Expected path missing: ${p}`); });

  // components structure
  const uiDir = 'components/ui';
  if (!exists(uiDir)) warnings.push('Missing components/ui directory (common pattern for shared UI primitives).');

  // public assets
  const hasFavicon = exists('public/favicon.ico');
  const hasLogo = exists('public/logo.svg') || exists('public/logo.png');
  if (!hasFavicon) warnings.push('Missing public/favicon.ico');
  if (!hasLogo) warnings.push('Missing public logo.svg/png');

  // Summarize
  const summary = {
    root,
    presentDirs,
    presentFiles,
    missing,
    warnings,
    checks: {
      hasAppLayout,
      hasAppPage,
      hasSrcApp,
    }
  };

  return summary;
}

function printSummary(s) {
  const hr = () => console.log('-'.repeat(60));
  console.log('Workspace Structure Audit');
  hr();
  console.log('Root:', s.root);
  hr();
  console.log('Present directories:', s.presentDirs.sort().join(', '));
  console.log('Present files:', s.presentFiles.sort().join(', '));
  hr();
  if (s.missing.length) {
    console.log('Missing expected items:');
    s.missing.forEach(m => console.log(' -', m));
  } else {
    console.log('No missing expected items');
  }
  hr();
  if (s.warnings.length) {
    console.log('Warnings:');
    s.warnings.forEach(w => console.log(' -', w));
  } else {
    console.log('No warnings');
  }
  hr();
  console.log('Recommendation:');
  console.log(' - Consolidate Next.js app structure (choose app/ or src/app)');
  console.log(' - Keep only one Jest config (prefer cjs)');
  console.log(' - Document multi-tsconfig usage or consolidate');
  console.log(' - Move generated diagnostics under test-results/ or .logs/');
  console.log(' - Ensure components/ui exists for shared primitives');
  console.log(' - Ensure public/favicon.ico and logo are present');
  hr();
  console.log('For detailed guidance, see docs/WORKSPACE_STRUCTURE.md');
}

(function main(){
  try {
    const summary = audit();
    printSummary(summary);
    const outPath = path.join(root, 'test-results', 'structure-audit.json');
    try {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
    } catch {}
    process.exit(0);
  } catch (err) {
    console.error('Structure audit failed:', err?.message || err);
    process.exit(1);
  }
})();
