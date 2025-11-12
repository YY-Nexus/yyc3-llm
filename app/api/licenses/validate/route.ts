import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

// GET /api/licenses/validate?modelId=xxx
// - when modelId provided: returns single license status
// - otherwise: returns all licenses
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const modelId = url.searchParams.get('modelId') || ''
    const file = path.join(process.cwd(), 'docs', 'licenses', 'licenses.json')
    const text = await fs.readFile(file, 'utf-8')
    const data = JSON.parse(text || '{}') || {}
    const licenses = Array.isArray(data.licenses) ? data.licenses : []

    const normalize = (s: string) => (s || '').trim()

    const mapStatus = (s: string) => {
      const v = (s || '').toLowerCase()
      if (v === 'authorized') return { code: 'authorized', label: '✅ 已授权' }
      if (v === 'pending') return { code: 'pending', label: '⏳ 待申请' }
      if (v === 'expired') return { code: 'expired', label: '❌ 已过期' }
      return { code: 'invalid', label: '⚠️ 无效' }
    }

    const resultAll = licenses.map((item: any) => ({
      modelId: normalize(item.modelId || item.modelName),
      licenseNumber: item.licenseNumber,
      expiryType: item.expiryType,
      status: mapStatus(item.status).code,
      statusLabel: mapStatus(item.status).label,
      issuer: item.issuer,
      issuedAt: item.issuedAt,
      company: item.company,
    }))

    if (!modelId) {
      return NextResponse.json({ updatedAt: data.updatedAt, licenses: resultAll })
    }

    const id = normalize(modelId)
    const hit = resultAll.find((x: any) => normalize(x.modelId) === id)
    if (!hit) {
      return NextResponse.json({ found: false, status: 'unknown', statusLabel: '未记录' }, { status: 200 })
    }
    return NextResponse.json({ found: true, ...hit }, { status: 200 })
  } catch (err) {
    console.error('License validate API error:', err)
    return NextResponse.json({ error: 'LICENSE_READ_ERROR' }, { status: 500 })
  }
}