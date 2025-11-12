"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BrandCard,
  BrandButton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { Code, Download, Play, FileText, Terminal } from "lucide-react";
import MonacoEditor from "@/components/ui/monaco-editor";
import MarkdownPreview from "@/components/ui/markdown-preview";
import { detectLanguage, getFileExtension } from "@/lib/utils";
import { useCodeExecution, useCodeAnalysis } from "@/lib/hooks";

interface IntegratedCodePreviewProps {
  initialCode?: string;
  initialLanguage?: string;
  className?: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
}

export default function IntegratedCodePreview({
  initialCode = "",
  initialLanguage = "javascript",
  className = "",
  onCodeChange,
  readOnly = false,
}: IntegratedCodePreviewProps) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [activeTab, setActiveTab] = useState("code");
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 执行代码相关状态
  const { executeCode, isExecuting, executionResult } = useCodeExecution();

  // 代码分析相关状态
  const { analyzeCode, analysisResult, isAnalyzing } = useCodeAnalysis();

  // 初始化语言检测
  useEffect(() => {
    if (initialCode && !initialLanguage) {
      setLanguage(detectLanguage(initialCode));
    }
  }, [initialCode, initialLanguage]);

  // 同步代码变化到父组件
  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(code);
    }
  }, [code, onCodeChange]);

  // 处理代码执行结果
  useEffect(() => {
    if (executionResult) {
      setIsRunning(false);
      if (executionResult.success) {
        setConsoleOutput([...consoleOutput, executionResult.output]);
      } else {
        setError(executionResult.error);
      }
    }
  }, [executionResult, consoleOutput]);

  // 处理代码分析结果
  useEffect(() => {
    if (analysisResult) {
      setConsoleOutput([analysisResult]);
      setActiveTab("console");
    }
  }, [analysisResult]);

  // 执行代码
  const handleRunCode = useCallback(async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    setError(null);
    setConsoleOutput([]);

    try {
      await executeCode(code, language);
    } catch (err) {
      setError(err instanceof Error ? err.message : "执行代码时出错");
      setIsRunning(false);
    }
  }, [code, language, executeCode]);

  // 分析代码
  const handleAnalyzeCode = useCallback(async () => {
    if (!code.trim()) return;

    try {
      await analyzeCode(code, language);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析代码时出错");
    }
  }, [code, language, analyzeCode]);

  // 下载代码
  const handleDownloadCode = useCallback(() => {
    const extension = getFileExtension(language);
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `code${extension}`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }, [code, language]);

  // 渲染预览内容
  const renderPreview = useCallback(() => {
    if (language === "markdown") {
      return <MarkdownPreview content={code} />;
    }

    if (language === "html") {
      return (
        <iframe
          srcDoc={code}
          className="w-full h-full border border-gray-200 rounded-lg"
          title="HTML Preview"
          sandbox="allow-scripts"
        />
      );
    }

    if (language === "javascript" || language === "typescript") {
      return (
        <div className="p-4 text-center text-gray-500">
          <p>点击"运行"按钮执行代码</p>
        </div>
      );
    }

    return (
      <div className="p-4 text-center text-gray-500">
        <p>当前语言不支持实时预览</p>
      </div>
    );
  }, [code, language]);

  return (
    <div className={`h-full ${className}`}>
      <BrandCard variant="glass" className="h-full overflow-hidden">
        {/* 顶部工具栏 */}
        <div className="p-4 border-b border-gray-200/50 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="text-cloud-blue-500" />
              <h3 className="font-semibold text-gray-800">代码预览</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                {language.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <BrandButton
                variant="outline"
                size="sm"
                onClick={handleDownloadCode}
                icon={<Download className="h-4 w-4" />}
              >
                下载
              </BrandButton>

              <BrandButton
                variant="outline"
                size="sm"
                onClick={handleAnalyzeCode}
                loading={isAnalyzing}
                disabled={!code.trim() || isExecuting}
                icon={<FileText className="h-4 w-4" />}
              >
                分析
              </BrandButton>

              {["javascript", "typescript"].includes(language) && (
                <BrandButton
                  variant="gradient"
                  size="sm"
                  onClick={handleRunCode}
                  loading={isRunning || isExecuting}
                  disabled={!code.trim() || isExecuting}
                  icon={<Play className="h-4 w-4" />}
                >
                  运行
                </BrandButton>
              )}
            </div>
          </div>
        </div>

        {/* 主要内容区 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 代码编辑器 */}
          <div className="w-1/2 h-full border-r border-gray-200/50">
            <MonacoEditor
              value={code}
              language={language}
              onChange={setCode}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: "on",
                wordWrap: "on",
                readOnly,
                theme: "vs-dark",
              }}
            />
          </div>

          {/* 预览区域 */}
          <div className="w-1/2 h-full flex flex-col">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <div className="border-b border-gray-200/50 px-4">
                <TabsList className="h-12">
                  <TabsTrigger
                    value="preview"
                    className="flex items-center gap-1"
                  >
                    <Code className="h-4 w-4" />
                    预览
                  </TabsTrigger>
                  <TabsTrigger
                    value="console"
                    className="flex items-center gap-1"
                  >
                    <Terminal className="h-4 w-4" />
                    控制台
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="preview" className="flex-1 p-4 overflow-auto">
                {renderPreview()}
              </TabsContent>

              <TabsContent
                value="console"
                className="flex-1 bg-gray-900 text-gray-100 p-4 font-mono text-sm overflow-auto"
              >
                {consoleOutput.length > 0 ? (
                  consoleOutput.map((output, index) => (
                    <div key={index} className="mb-2">
                      {output.startsWith("```") ? (
                        <MarkdownPreview content={output} />
                      ) : (
                        <pre className="whitespace-pre-wrap">{output}</pre>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">
                    {isRunning ? "执行中..." : "运行代码后输出将显示在这里"}
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-2 bg-red-500/10 text-red-400 rounded">
                    {error}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </BrandCard>
    </div>
  );
}
