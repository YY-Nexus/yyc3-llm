/*
  E2E Smoke 检查
  - 默认目标: http://localhost:3570/api/deepstack/generate
  - 检查基本可用性与返回结构
*/

const url = process.env.SMOKE_URL || 'http://localhost:3570/api/deepstack/generate'

async function run() {
  console.log(`[smoke] target=${url}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'console.log(1)', language: 'English', type: 'generate' })
  })

  if (!res.ok) {
    console.error('[smoke] HTTP error', res.status)
    process.exitCode = 1
    return
  }

  const json = await res.json()
  const ok = json && json.success !== false
  console.log('[smoke] response', JSON.stringify(json).slice(0, 200) + '...')
  if (!ok) {
    console.error('[smoke] service returned failure')
    process.exitCode = 1
    return
  }
  console.log('[smoke] OK (prompt)')

  // 统一到3570：使用 content 别名在同一端口验证
  const res2 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'console.log(2)', language: 'English', type: 'generate' })
  })

  if (!res2.ok) {
    console.error('[smoke] HTTP error (content)', res2.status)
    process.exitCode = 1
    return
  }

  const json2 = await res2.json()
  const ok2 = json2 && json2.success !== false
  console.log('[smoke] response(content)', JSON.stringify(json2).slice(0, 200) + '...')
  if (!ok2) {
    console.error('[smoke] service returned failure (content)')
    process.exitCode = 1
    return
  }
  console.log('[smoke] OK (content alias)')
}

run().catch(err => {
  console.error('[smoke] error', err)
  process.exitCode = 1
})