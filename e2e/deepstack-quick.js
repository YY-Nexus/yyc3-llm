/*
  DeepStack 快速E2E：optimize/explain/fix
  - 默认目标: http://localhost:3570/api/deepstack/generate
  - 环境变量: DEEPSTACK_URL
*/

const url = process.env.DEEPSTACK_URL || 'http://localhost:3570/api/deepstack/generate'

async function runCase(tag, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    console.error(`[quick] HTTP error (${tag})`, res.status)
    process.exitCode = 1
    return false
  }
  const json = await res.json()
  const ok = json && json.success !== false
  console.log(`[quick] ${tag} response`, JSON.stringify(json).slice(0, 220) + '...')
  if (!ok) {
    console.error(`[quick] service returned failure (${tag})`)
    process.exitCode = 1
    return false
  }
  console.log(`[quick] OK (${tag})`)
  return true
}

async function main() {
  console.log(`[quick] target=${url}`)

  // optimize：代码优化
  await runCase('optimize', {
    type: 'optimize',
    language: 'TypeScript',
    content: `function sum(a:number,b:number){return a + b}`,
    context: 'Improve readability and add type-safe checks if relevant.'
  })

  // explain：代码解释
  await runCase('explain', {
    type: 'explain',
    language: 'TypeScript',
    content: `const nums = [1,2,3]; const doubled = nums.map(n => n*2);`,
    context: 'Explain code behavior step by step and note complexity.'
  })

  // fix：修复常见错误
  await runCase('fix', {
    type: 'fix',
    language: 'TypeScript',
    content: `function divide(a:number,b:number){ return a/b } // should handle b==0`,
    context: 'Fix division by zero and ensure safe result.'
  })
}

main().catch(err => {
  console.error('[quick] error', err)
  process.exitCode = 1
})
