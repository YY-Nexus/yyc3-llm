/**
 * @file 通用代码执行与分析 Hooks
 * @description 提供代码执行与代码分析的基础 Hook 实现，保障构建稳定
 * @module lib/hooks
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-31
 * @updated 2025-10-31
 */

import { useState, useCallback } from "react";

// === 类型定义 ===
interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
}

// === 代码执行 Hook ===
export function useCodeExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  /**
   * @description 执行代码（安全占位实现）
   * @param code - 代码字符串
   * @param language - 语言标识，例如 javascript/typescript/markdown
   */
  const executeCode = useCallback(async (code: string, language: string) => {
    setIsExecuting(true);
    try {
      // 为保障构建与运行稳定，这里提供安全的占位执行逻辑，不进行真实 eval。
      // 后续可按需替换为沙箱执行器或服务端执行。
      const summary = `已接收 ${language} 代码，长度 ${code.length} 字符`;
      setExecutionResult({ success: true, output: summary });
    } catch (err) {
      const message = err instanceof Error ? err.message : "执行过程出现未知错误";
      setExecutionResult({ success: false, error: message });
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return { executeCode, isExecuting, executionResult };
}

// === 代码分析 Hook ===
export function useCodeAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  /**
   * @description 分析代码（安全占位实现）
   * @param code - 代码字符串
   * @param language - 语言标识
   */
  const analyzeCode = useCallback(async (code: string, language: string) => {
    setIsAnalyzing(true);
    try {
      // 基础占位分析：返回 Markdown 结构，便于既有 UI 直接渲染
      const result = [
        "## 代码分析结果",
        `- 语言: ${language.toUpperCase()}`,
        `- 字符数: ${code.length}`,
        "- 复杂度评估: 基础 (占位)",
        "\n### 建议",
        "- 可添加更严格的输入校验与错误处理",
        "- 如需真实分析，请接入分析服务或引擎",
      ].join("\n");
      setAnalysisResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "分析过程出现未知错误";
      setAnalysisResult(`**分析失败**: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analyzeCode, isAnalyzing, analysisResult };
}
