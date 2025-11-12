import { NextResponse } from 'next/server'

export async function GET() {
  // 简易健康检查：返回进程存活与时间戳
  try {
    const uptime = process.uptime()
    return NextResponse.json({ ok: true, uptime, timestamp: Date.now() })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}