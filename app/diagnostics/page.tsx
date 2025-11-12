"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from '@/components/ui/';

const DiagnosticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{ file: string; line: number; column: number; severity: 'Error' | 'Warning'; message: string; rule?: string }>>([]);
  const [summary, setSummary] = useState<{ errorCount: number; warningCount: number; files: { path: string; errorCount: number; warningCount: number }[] }>({ errorCount: 0, warningCount: 0, files: [] });
  // TypeScript diagnostics state
  const [tsIssues, setTsIssues] = useState<Array<{ file: string; abs?: string; line: number; column: number; code?: string; severity: 'Error' | 'Warning'; message: string }>>([]);
  const [tsSummary, setTsSummary] = useState<{ errorCount: number; warningCount: number; files: { path: string; errorCount: number; warningCount: number }[] }>({ errorCount: 0, warningCount: 0, files: [] });
  const [tsFilter, setTsFilter] = useState<{ query: string; severity: 'All' | 'Error' | 'Warning' }>({ query: '', severity: 'All' });

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/diagnostics');
        if (!res.ok) throw new Error(`诊断接口返回错误: ${res.status}`);
        const data = await res.json();
        setIssues(data.sources?.lint?.issues || []);
        setSummary(data.sources?.lint?.summary || { errorCount: 0, warningCount: 0, files: [] });
        // set TS diagnostics
        setTsIssues(data.sources?.typescript?.issues || []);
        setTsSummary(data.sources?.typescript?.summary || { errorCount: 0, warningCount: 0, files: [] });
      } catch (e: any) {
        setError(e?.message || '获取诊断信息失败');
      } finally {
        setLoading(false);
      }
    };
    fetchDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">问题与诊断</h1>
            <p className="text-gray-500 dark:text-gray-400">#problems_and_diagnostics</p>
          </div>
          <div>
            <Button size="sm" variant="secondary" onClick={() => location.reload()}>刷新</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">错误数量</CardTitle>
              <CardDescription>ESLint 错误总数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-500">{summary.errorCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">警告数量</CardTitle>
              <CardDescription>ESLint 警告总数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-yellow-500">{summary.warningCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">受影响文件</CardTitle>
              <CardDescription>包含问题的文件数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-emerald-500">{summary.files.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium">问题列表</CardTitle>
            <CardDescription>来自最新的 ESLint 输出</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <div className="text-sm text-gray-500">加载中...</div>}
            {error && <div className="text-sm text-red-500">{error}</div>}
            {!loading && !error && issues.length === 0 && (
              <div className="text-sm text-gray-500">暂无问题，或尚未生成诊断文件。</div>
            )}
            {!loading && !error && issues.length > 0 && (
              <div className="space-y-3">
                {issues.slice(0, 100).map((i, idx) => (
                  <div key={idx} className="flex items-start justify之间 py-2 border-b last:border-b-0">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">{i.file}:{i.line}:{i.column}</div>
                      <div className="text-sm text-gray-900 dark:text-white">{i.message}</div>
                      {i.rule && <div className="text-xs text-gray-400">{i.rule}</div>}
                    </div>
                    <Badge variant={i.severity === 'Error' ? 'destructive' : 'secondary'}>{i.severity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* TypeScript 错误可视化 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium">TypeScript 错误</CardTitle>
            <CardDescription>来自 tsc 的编译诊断</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <input
                value={tsFilter.query}
                onChange={e => setTsFilter({ ...tsFilter, query: e.target.value })}
                placeholder="按文件路径/消息过滤"
                className="px-2 py-1 text-sm rounded border bg-white dark:bg-gray-800"
              />
              <div className="flex items-center gap-2">
                {(['All','Error','Warning'] as const).map(s => (
                  <Button key={s} size="sm" variant={tsFilter.severity === s ? 'default' : 'secondary'} onClick={() => setTsFilter({ ...tsFilter, severity: s })}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">错误数量</CardTitle>
                  <CardDescription>TS 编译错误总数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-red-500">{tsSummary.errorCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">警告数量</CardTitle>
                  <CardDescription>TS 编译警告总数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-yellow-500">{tsSummary.warningCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">受影响文件</CardTitle>
                  <CardDescription>包含 TS 问题的文件数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-emerald-500">{tsSummary.files.length}</div>
                </CardContent>
              </Card>
            </div>

            {loading && <div className="text-sm text-gray-500">加载中...</div>}
            {error && <div className="text-sm text-red-500">{error}</div>}
            {!loading && !error && tsIssues.length === 0 && (
              <div className="text-sm text-gray-500">暂无 TS 编译问题，或尚未生成报告。</div>
            )}
            {!loading && !error && tsIssues.length > 0 && (
              <div className="space-y-3">
                {tsIssues
                  .filter(i => tsFilter.severity === 'All' || i.severity === tsFilter.severity)
                  .filter(i => {
                    const q = tsFilter.query.trim().toLowerCase();
                    if (!q) return true;
                    return (i.file.toLowerCase().includes(q) || i.message.toLowerCase().includes(q) || (i.code || '').toLowerCase().includes(q));
                  })
                  .slice(0, 150)
                  .map((i, idx) => (
                    <div key={idx} className="flex items-start justify-between py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">
                          {i.file}:{i.line}:{i.column} {i.code ? `(${i.code})` : ''}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white">{i.message}</div>
                        {i.abs && (
                          <a href={`vscode://file/${encodeURI(i.abs)}:${i.line}:${i.column}`} className="text-xs text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                            在编辑器中打开
                          </a>
                        )}
                      </div>
                      <Badge variant={i.severity === 'Error' ? 'destructive' : 'secondary'}>{i.severity}</Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">按文件统计</CardTitle>
            <CardDescription>错误/警告分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.files.slice(0, 50).map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="truncate max-w-[70%]">{f.path}</div>
                  <div className="flex items-center space-x-3">
                    <span className="text-red-500">E: {f.errorCount}</span>
                    <span className="text-yellow-500">W: {f.warningCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiagnosticsPage;