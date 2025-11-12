import { ModelItem, makeId } from '../schema';

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return '';
  return await res.text();
}

function parseMarkdownLinks(md: string): Array<{ name: string; url: string }> {
  const links: Array<{ name: string; url: string }> = [];
  const re = /\-\s*\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const name = m[1].trim();
    const url = m[2].trim();
    links.push({ name, url });
  }
  return links;
}

function classifyProvider(url: string): 'HuggingFace' | 'ModelScope' | 'GitHub' | 'Other' {
  if (url.includes('huggingface.co')) return 'HuggingFace';
  if (url.includes('modelscope.cn')) return 'ModelScope';
  if (url.includes('github.com')) return 'GitHub';
  return 'Other';
}

export async function fetchModelsFromGitHubMarkdown(rawUrl: string, repo?: string): Promise<ModelItem[]> {
  const md = await fetchText(rawUrl);
  if (!md) return [];
  const links = parseMarkdownLinks(md);
  const items: ModelItem[] = [];
  for (const { name, url } of links) {
    const provider = classifyProvider(url);
    if (provider === 'Other') continue;
    const id = makeId(provider, name);
    items.push({
      id,
      name,
      provider,
      source: { type: 'GitHub', url: rawUrl, repo },
      link: url,
      tags: [],
      tasks: [],
    });
  }
  return items;
}