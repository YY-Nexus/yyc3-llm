import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  const dataDir = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, 'models.json');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(content);
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ models: [], sourceCount: 0, updatedAt: null });
  }
}