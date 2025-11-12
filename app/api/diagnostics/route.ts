import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface DiagnosticIssue {
  file: string;
  line: number;
  column: number;
  severity: 'Error' | 'Warning';
  message: string;
  rule?: string;
}

interface DiagnosticsSummary {
  errorCount: number;
  warningCount: number;
  files: { path: string; errorCount: number; warningCount: number }[];
}

function parseLint(text: string) {
  const issues: DiagnosticIssue[] = [];
  let currentFile: string | null = null;
  const filePathRegex = /^(\.\/.+|\/.+|.+\.(ts|tsx|js|jsx))$/;
  const issueRegex = /^(\d+):(\d+)\s+(Warning|Error):\s+(.*?)\s+([@\w\-/]+)$/;

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (filePathRegex.test(trimmed)) {
      currentFile = trimmed.replace(/^\.\//, '');
      continue;
    }
    const m = trimmed.match(issueRegex);
    if (m && currentFile) {
      const [, lineStr, colStr, sev, msg, rule] = m;
      issues.push({
        file: currentFile,
        line: parseInt(lineStr, 10),
        column: parseInt(colStr, 10),
        severity: sev as 'Error' | 'Warning',
        message: msg,
        rule,
      });
    }
  }

  const fileMap = new Map<string, { errorCount: number; warningCount: number }>();
  for (const issue of issues) {
    const entry = fileMap.get(issue.file) || { errorCount: 0, warningCount: 0 };
    if (issue.severity === 'Error') entry.errorCount += 1; else entry.warningCount += 1;
    fileMap.set(issue.file, entry);
  }
  const files = Array.from(fileMap.entries()).map(([path, counts]) => ({ path, ...counts }));

  const summary: DiagnosticsSummary = {
    errorCount: issues.filter(i => i.severity === 'Error').length,
    warningCount: issues.filter(i => i.severity === 'Warning').length,
    files,
  };

  return { issues, summary };
}

async function readFileSafe(p: string) {
  try {
    return await fs.readFile(p, 'utf-8');
  } catch {
    return '';
  }
}

function parseESLintJSON(text: string) {
  try {
    const data = JSON.parse(text);
    const results = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
    const issues: DiagnosticIssue[] = [];
    const fileMap = new Map<string, { errorCount: number; warningCount: number }>();

    for (const res of results) {
      const filePath = res.filePath || res.file || '';
      const messages = Array.isArray(res.messages) ? res.messages : [];
      const errorCount = Number(res.errorCount || 0);
      const warningCount = Number(res.warningCount || 0);

      for (const m of messages) {
        const sevNum = Number(m.severity || 0);
        const severity: 'Error' | 'Warning' = sevNum === 2 ? 'Error' : 'Warning';
        issues.push({
          file: filePath,
          line: Number(m.line || 0),
          column: Number(m.column || 0),
          severity,
          message: String(m.message || ''),
          rule: m.ruleId ? String(m.ruleId) : undefined,
        });
      }

      fileMap.set(filePath, { errorCount, warningCount });
    }

    const files = Array.from(fileMap.entries()).map(([path, counts]) => ({ path, ...counts }));
    const summary: DiagnosticsSummary = {
      errorCount: issues.filter(i => i.severity === 'Error').length,
      warningCount: issues.filter(i => i.severity === 'Warning').length,
      files,
    };

    return { issues, summary };
  } catch {
    return { issues: [], summary: { errorCount: 0, warningCount: 0, files: [] } };
  }
}

interface TypeIssue {
  file: string;
  abs?: string;
  line: number;
  column: number;
  code?: string;
  severity: 'Error' | 'Warning';
  message: string;
}

interface TypeSummary {
  errorCount: number;
  warningCount: number;
  files: { path: string; errorCount: number; warningCount: number }[];
}

function parseTSC(text: string, cwd: string) {
  const issues: TypeIssue[] = [];
  const fileMap = new Map<string, { errorCount: number; warningCount: number }>();

  const lines = text.split(/\r?\n/);
  const re = /^(.*)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.*)$/;

  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    const [, filePath, lineStr, colStr, sev, tsCode, msg] = m;
    const severity: 'Error' | 'Warning' = sev.toLowerCase() === 'error' ? 'Error' : 'Warning';
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);

    issues.push({
      file: filePath,
      abs: absPath,
      line: parseInt(lineStr, 10),
      column: parseInt(colStr, 10),
      code: `TS${tsCode}`,
      severity,
      message: msg,
    });

    const entry = fileMap.get(filePath) || { errorCount: 0, warningCount: 0 };
    if (severity === 'Error') entry.errorCount += 1; else entry.warningCount += 1;
    fileMap.set(filePath, entry);
  }

  const files = Array.from(fileMap.entries()).map(([p, c]) => ({ path: p, ...c }));
  const summary: TypeSummary = {
    errorCount: issues.filter(i => i.severity === 'Error').length,
    warningCount: issues.filter(i => i.severity === 'Warning').length,
    files,
  };

  return { issues, summary };
}

export async function GET() {
  const cwd = process.cwd();
  const lintPath = path.join(cwd, 'lint-after-fix2.txt');
  const tscPath = path.join(cwd, 'tsc-errors.txt');
  const jsonPath = path.join(cwd, 'diagnostics.json');

  const [jsonText, lintText, tscText] = await Promise.all([
    readFileSafe(jsonPath),
    readFileSafe(lintPath),
    readFileSafe(tscPath),
  ]);

  const lintData = jsonText
    ? parseESLintJSON(jsonText)
    : (lintText ? parseLint(lintText) : { issues: [], summary: { errorCount: 0, warningCount: 0, files: [] } });

  const tsData = tscText ? parseTSC(tscText, cwd) : { issues: [], summary: { errorCount: 0, warningCount: 0, files: [] } };

  const diagnostics = {
    sources: {
      lint: {
        path: jsonText ? jsonPath : lintPath,
        ...lintData,
      },
      typescript: {
        path: tscPath,
        ...tsData,
      },
    },
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(diagnostics);
}