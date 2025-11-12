export type Provider = 'HuggingFace' | 'ModelScope' | 'GitHub' | 'CSDN' | 'Other';

export interface ModelFile {
  path: string;
  size?: number;
  checksum?: string;
}

export interface ModelItem {
  id: string;
  name: string;
  provider: Provider;
  source: { type: 'GitHub' | 'CSDN' | 'Manual'; url: string; repo?: string };
  link: string;
  tags: string[];
  tasks: string[];
  license?: string;
  size?: number;
  updatedAt?: string;
  files?: ModelFile[];
}

export interface DownloadStatus {
  id: string;
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'failed';
  progress?: number;
  speed?: number;
  eta?: number;
  lastChunk?: number;
  checksum?: string;
}

export function validateModelItem(m: any): m is ModelItem {
  return (
    !!m &&
    typeof m.id === 'string' &&
    typeof m.name === 'string' &&
    typeof m.link === 'string' &&
    Array.isArray(m.tags) &&
    Array.isArray(m.tasks) &&
    typeof m.provider === 'string' &&
    !!m.source && typeof m.source.url === 'string'
  );
}

export function makeId(source: string, name: string, version?: string) {
  const base = `${source}:${name}`;
  return version ? `${base}:${version}` : base;
}

export function dedupe(models: ModelItem[]): ModelItem[] {
  const map = new Map<string, ModelItem>();
  for (const m of models) {
    if (!validateModelItem(m)) continue;
    if (!map.has(m.id)) map.set(m.id, m);
  }
  return Array.from(map.values());
}