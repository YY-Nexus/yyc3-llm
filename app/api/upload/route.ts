import { NextResponse } from 'next/server';
import { AWSProvider } from '@/src/core/cloud/providers/AWSProvider';
import { SecurityUtils } from '@/lib/utils/security';

export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set<string>([
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/pdf',
  'text/plain',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
]);

function sanitizeFolder(folder: string) {
  return folder.replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 128) || 'uploads';
}

export async function POST(req: Request) {
  try {
    // 鉴权：校验Bearer JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    try {
      SecurityUtils.verifyJWT(token, process.env.JWT_SECRET || 'default-secret');
    } catch {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folderRaw = (formData.get('folder') as string) || 'uploads';
    const folder = sanitizeFolder(folderRaw);

    if (!file) {
      return NextResponse.json({ error: '缺少文件' }, { status: 400 });
    }

    const maxMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 20);
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: `文件过大，最大${maxMb}MB` }, { status: 413 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: `不支持的文件类型: ${file.type}` }, { status: 415 });
    }

    const provider = new AWSProvider({
      region: process.env.AWS_REGION || 'us-east-1',
      bucketName: process.env.AWS_BUCKET || 'demo-bucket',
      apiKey: process.env.AWS_API_KEY,
      secretKey: process.env.AWS_SECRET_KEY,
    });
    await provider.initialize({});

    const url = await provider.uploadFile(file as any, { folder });

    const meta = {
      url,
      name: (file as any).name,
      size: file.size,
      type: file.type,
      folder,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json(meta);
  } catch (err) {
    console.error('upload proxy error', err);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}