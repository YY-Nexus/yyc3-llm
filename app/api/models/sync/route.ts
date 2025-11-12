import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { dedupe, ModelItem, makeId } from '@/lib/model-engine/schema';
import { fetchModelsFromGitHubMarkdown } from '@/lib/model-engine/sources/github';
import { fetchModelsFromCSDNPage } from '@/lib/model-engine/sources/csdn';

export const runtime = 'nodejs';

interface SyncRequest {
  githubRawUrls?: Array<{ url: string; repo?: string }>;
  csdnPages?: string[];
}

async function ensureDir(dir: string) {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

export async function POST(req: Request) {
  const dataDir = path.join(process.cwd(), 'data');
  const outPath = path.join(dataDir, 'models.json');
  await ensureDir(dataDir);

  let body: SyncRequest | null = null;
  try { body = await req.json(); } catch {}

  const githubRawUrls = body?.githubRawUrls ?? [
    // 默认示例：可以替换为 awesome-LLMs 的 raw README 链接
    { url: 'https://raw.githubusercontent.com/huggingface/awesome-huggingface/main/README.md', repo: 'huggingface/awesome-huggingface' },
  ];
  const csdnPages = body?.csdnPages ?? [];

  const results: ModelItem[] = [];

  // GitHub markdown sources
  for (const g of githubRawUrls) {
    try {
      const items = await fetchModelsFromGitHubMarkdown(g.url, g.repo);
      results.push(...items);
    } catch {}
  }

  // CSDN pages
  for (const u of csdnPages) {
    try {
      const items = await fetchModelsFromCSDNPage(u);
      results.push(...items);
    } catch {}
  }

  let models = dedupe(results);

  // 离线回退：当网络不可用或源为空时，提供少量示例数据，便于前端验证
  if (!models.length) {
    const fallback: ModelItem[] = [
      {
        id: makeId('HuggingFace', 'Qwen2.5-7B-Instruct'),
        name: 'Qwen2.5-7B-Instruct',
        provider: 'HuggingFace',
        source: { type: 'Manual', url: 'offline' },
        link: 'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct',
        tags: ['chat', 'instruct'],
        tasks: ['text-generation']
      },
      {
        id: makeId('ModelScope', 'Yi-34B-Chat'),
        name: 'Yi-34B-Chat',
        provider: 'ModelScope',
        source: { type: 'Manual', url: 'offline' },
        link: 'https://modelscope.cn/models/01ai/Yi-34B-Chat',
        tags: ['chat'],
        tasks: ['text-generation']
      },
      {
        id: makeId('GitHub', 'awesome-LLMs'),
        name: 'awesome-LLMs',
        provider: 'GitHub',
        source: { type: 'Manual', url: 'offline' },
        link: 'https://github.com/Hannibal046/Awesome-LLM',
        tags: ['collection'],
        tasks: ['reference']
      }
    ];
    models = dedupe(fallback);
  }

  const payload = { models, sourceCount: (githubRawUrls.length + csdnPages.length), updatedAt: new Date().toISOString() };

  try {
    await fs.writeFile(outPath, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {}

  return NextResponse.json(payload);
}