import { ModelItem, makeId } from '../schema';

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return '';
  return await res.text();
}

function parseAnchors(html: string): Array<{ name: string; url: string }> {
  const out: Array<{ name: string; url: string }> = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const url = m[1];
    const name = m[2].trim();
    out.push({ name, url });
  }
  return out;
}

function isModelLink(url: string): boolean {
  return /huggingface\.co|modelscope\.cn/.test(url);
}

export async function fetchModelsFromCSDNPage(pageUrl: string): Promise<ModelItem[]> {
  const html = await fetchText(pageUrl);
  if (!html) return [];
  const anchors = parseAnchors(html);
  const items: ModelItem[] = [];
  for (const { name, url } of anchors) {
    if (!isModelLink(url)) continue;
    const provider = url.includes('huggingface.co') ? 'HuggingFace' : (url.includes('modelscope.cn') ? 'ModelScope' : 'Other');
    if (provider === 'Other') continue;
    const id = makeId(provider, name);
    items.push({
      id,
      name,
      provider,
      source: { type: 'CSDN', url: pageUrl },
      link: url,
      tags: [],
      tasks: [],
    });
  }
  return items;
}