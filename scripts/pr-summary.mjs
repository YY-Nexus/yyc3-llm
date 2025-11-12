#!/usr/bin/env node
/**
 * @file PR 变更摘要脚本
 * @description 输出简明的文件变更、潜在风险提示与依赖修改提醒
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
}

// 基于当前分支与 base_ref 生成 diff（由 workflow 提供环境变量）
const baseRef = process.env.BASE_REF || ''
let diffList = ''
try {
  if (baseRef) {
    run(`git fetch origin ${baseRef}`)
    diffList = run(`git diff --name-status origin/${baseRef}...HEAD`)
  } else {
    diffList = run(`git diff --name-status HEAD~1`)
  }
} catch {}

const lines = diffList.split('\n').filter(Boolean)
const summary = {
  added: [],
  modified: [],
  deleted: [],
}
for (const l of lines) {
  const [status, file] = l.split(/\s+/)
  if (status === 'A') summary.added.push(file)
  else if (status === 'M') summary.modified.push(file)
  else if (status === 'D') summary.deleted.push(file)
}

// 依赖差异分析（package.json）
let depDiffMd = ''
try {
  const basePkgStr = baseRef ? run(`git show origin/${baseRef}:package.json`) : ''
  const curPkgStr = existsSync('package.json') ? readFileSync('package.json', 'utf-8') : ''
  if (basePkgStr && curPkgStr) {
    const basePkg = JSON.parse(basePkgStr)
    const curPkg = JSON.parse(curPkgStr)
    const baseDeps = { ...(basePkg.dependencies || {}), ...(basePkg.devDependencies || {}) }
    const curDeps = { ...(curPkg.dependencies || {}), ...(curPkg.devDependencies || {}) }
    const added = []
    const removed = []
    const updated = []
    const heavy = ['framer-motion','three','recharts','monaco-editor','codemirror','chart.js','echarts','mapbox-gl','leaflet','pdfjs-dist']

    const allNames = new Set([...Object.keys(baseDeps), ...Object.keys(curDeps)])
    for (const name of allNames) {
      const b = baseDeps[name]
      const c = curDeps[name]
      if (b && !c) removed.push(name)
      else if (!b && c) added.push(name)
      else if (b && c && b !== c) updated.push(`${name} ${b} → ${c}`)
    }

    const heavyAdded = added.filter(a => heavy.includes(a))
    const heavyUpdated = updated.filter(u => heavy.some(h => u.startsWith(h)))

    depDiffMd = [
      added.length ? `- 新增依赖: ${added.join(', ')}` : '',
      removed.length ? `- 移除依赖: ${removed.join(', ')}` : '',
      updated.length ? `- 版本更新: ${updated.join('; ')}` : '',
      heavyAdded.length ? `- ⚠️ 重型依赖新增: ${heavyAdded.join(', ')}` : '',
      heavyUpdated.length ? `- ⚠️ 重型依赖版本更新: ${heavyUpdated.join('; ')}` : '',
    ].filter(Boolean).join('\n')
  }
} catch {}

// 风险提示（启发式）
const riskHints = []
const changedPaths = [...summary.added, ...summary.modified]
if (changedPaths.some(p => p.startsWith('app/') || p.startsWith('components/'))) {
  riskHints.push('可能影响首屏与交互性能：请关注动态导入与按需加载。')
}
if (changedPaths.some(p => /three|recharts|framer-motion|monaco|codemirror|chart|echarts|mapbox|leaflet|pdfjs/.test(p))) {
  riskHints.push('重型依赖或可视化库变更：请检查 bundle 体积与按需引入。')
}
if (changedPaths.some(p => p.endsWith('.ts') || p.endsWith('.tsx'))) {
  riskHints.push('类型风险：请确保类型检查通过，避免 any 与隐式 any。')
}

// size-limit 阈值提示
let sizeLimitInfo = ''
try {
  const conf = JSON.parse(readFileSync('.size-limit.json','utf-8'))
  const info = conf.map(c => `${c.name}: ≤ ${c.limit} (${c.gzip ? 'gzip' : 'raw'})`).join(' / ')
  sizeLimitInfo = `当前体积门禁: ${info}`
} catch {}

const md = `### 🔎 PR 变更摘要\n\n- 新增: ${summary.added.length} 个文件\n- 修改: ${summary.modified.length} 个文件\n- 删除: ${summary.deleted.length} 个文件\n\n${depDiffMd ? depDiffMd + '\n' : ''}${riskHints.length ? riskHints.map(h => `- ${h}`).join('\n') + '\n' : ''}${sizeLimitInfo ? `- ${sizeLimitInfo}\n` : ''}\n#### 变更文件示例\n\n${lines.slice(0, 20).map(l => `- ${l}`).join('\n')}\n\n> 提示：如触发体积/性能门禁，请按建议进行动态导入、拆分 vendor、按需加载。`

writeFileSync('pr-summary.md', md)
console.log('PR summary generated: pr-summary.md')
