"use client"
import React, { useState, useEffect } from "react"
import { BrainCircuit, RefreshCw, Download, Trash2, Search, Code, MessageSquare, ImageIcon, AlertCircle } from "lucide-react"
import { useModelManagement, AIModel, ModelTask, ModelType } from "@/lib/ai/model-management-center"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

export default function ModelEnginePage() {
  // 模型状态样式映射
  const statusStyles: Record<AIModel['status'], { text: string; bg: string; border: string }> = {
    ready: { text: '已就绪', bg: 'bg-green-100', border: 'border-green-300' },
    downloading: { text: '下载中', bg: 'bg-blue-100', border: 'border-blue-300' },
    not_downloaded: { text: '未下载', bg: 'bg-gray-100', border: 'border-gray-300' },
    download_failed: { text: '下载失败', bg: 'bg-red-100', border: 'border-red-300' },
    unavailable: { text: '不可用', bg: 'bg-red-100', border: 'border-red-300' },
    unknown: { text: '未知状态', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  };

  // 模型类型图标映射
  const typeIcons: Record<ModelType, React.ReactNode> = {
    chat: <MessageSquare className="h-4 w-4" />,
    code: <Code className="h-4 w-4" />,
    multimodal: <ImageIcon className="h-4 w-4" />,
  };

  const modelManagement = useModelManagement();
  
  // 添加空值检查和默认值
  const {
    models = [],
    tasks = [],
    stats,
    connectionStatus = 'unknown',
    errorMessage = null,
    loading = false,
    refreshModels,
    downloadModel,
    deleteModel,
    getRecommendedModels
  } = modelManagement || {};
  
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("discovery");
  const [selectedType, setSelectedType] = useState<ModelType | "">("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [action, setAction] = useState<'download' | 'delete' | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null); // 添加连接错误状态

  // 添加类型断言
  const typedModels = models as AIModel[];
  const typedTasks = tasks as ModelTask[];
  const typedStats = stats as { 
    total: number; 
    ready: number; 
    downloading: number; 
    notDownloaded: number; 
    byType: { chat: number; code: number; multimodal: number }; 
    byProvider: Record<string, number>; 
    totalSize: number 
  } | undefined;

  // 处理刷新
  const handleRefresh = async (): Promise<void> => {
    if (refreshModels) {
      setIsRefreshing(true);
      setConnectionError(null); // 清除之前的连接错误
      try {
        await refreshModels();
      } catch (error) {
        setConnectionError('刷新模型失败，请检查Ollama服务是否正常运行');
        console.error('刷新模型失败:', error);
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  // 从模型管理中获取连接状态
  useEffect(() => {
    if (connectionStatus === 'error' && errorMessage) {
      setConnectionError(errorMessage);
    }
  }, [connectionStatus, errorMessage]);

  // 筛选模型
  const filteredModels = typedModels.filter(model => {
    const matchesType = !selectedType || model.type === selectedType;
    const matchesSearch = !searchQuery || 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      model.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // 获取推荐模型
  const recommendedModels = getRecommendedModels ? getRecommendedModels("chat", 3) as AIModel[] : [];

  // 获取模型任务
  const getModelTask = (modelId: string): ModelTask | undefined => {
    return typedTasks.find((task) => task.modelId === modelId);
  };

  // 处理模型操作
  const handleModelAction = async (modelId: string, actionType: 'download' | 'delete'): Promise<void> => {
    setSelectedModelId(modelId);
    setAction(actionType);
    
    try {
      if (actionType === 'download' && downloadModel) {
        await downloadModel(modelId);
      } else if (actionType === 'delete' && deleteModel) {
        await deleteModel(modelId);
      }
    } catch (error) {
      console.error('执行模型操作失败:', error);
    } finally {
      setSelectedModelId(null);
      setAction(null);
    }
  };

  // 格式化模型大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-blue-500" />
            本地模型引擎
          </h1>
          <p className="text-gray-500">发现、调用和优化本地AI模型</p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing || !refreshModels}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新模型列表
        </Button>
      </div>

      {/* 连接错误提示 */}
      {connectionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription className="flex-1">
            {connectionError}
          </AlertDescription>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            重试
          </Button>
        </Alert>
      )}

      {/* Ollama服务状态指示器 */}
      {!connectionError && (
        <div className="mb-4">
          <Badge variant="outline" className={`
            ${connectionStatus === 'connected' ? 'text-green-600 border-green-300' : 
              connectionStatus === 'error' ? 'text-red-600 border-red-300' : 
              'text-gray-600 border-gray-300'}
          `}>
            {connectionStatus === 'connected' ? 'Ollama服务已连接' : 
              connectionStatus === 'error' ? 'Ollama服务连接失败' : 
              'Ollama服务状态未知'}
          </Badge>
        </div>
      )}

      {/* 模型统计信息卡片 */}
      {typedStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">总模型数</p>
                  <h3 className="text-2xl font-bold mt-1">{typedStats.total}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <BrainCircuit className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-green-600">就绪: {typedStats.ready}</span>
                <span className="text-blue-600">下载中: {typedStats.downloading}</span>
                <span className="text-gray-600">未下载: {typedStats.notDownloaded}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">模型类型分布</p>
                  <div className="mt-1 flex gap-2">
                    <Badge>对话: {(typedStats.byType || {}).chat || 0}</Badge>
                    <Badge>代码: {(typedStats.byType || {}).code || 0}</Badge>
                    <Badge>多模态: {(typedStats.byType || {}).multimodal || 0}</Badge>
                  </div>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">总占用空间</p>
                  <h3 className="text-2xl font-bold mt-1">{formatSize(typedStats.totalSize)}</h3>
                </div>
                <div className="bg-amber-100 p-3 rounded-full">
                  <Download className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">提供者: Ollama</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="discovery">模型发现</TabsTrigger>
          <TabsTrigger value="recommended">推荐模型</TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="space-y-4">
          {/* 搜索和筛选 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="text" 
                placeholder="搜索模型名称或ID..." 
                className="pl-10" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setSelectedType("")}>
                全部
              </Button>
              <Button onClick={() => setSelectedType("chat")} className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                对话
              </Button>
              <Button onClick={() => setSelectedType("code")} className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                代码
              </Button>
              <Button onClick={() => setSelectedType("multimodal")} className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                多模态
              </Button>
            </div>
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex justify-center py-8">
                <p className="text-gray-500">加载模型中...</p>
              </CardContent>
            </Card>
          ) : filteredModels.length === 0 ? (
            <Card>
              <CardContent className="flex justify-center py-8">
                <p className="text-gray-500">未找到匹配的模型</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredModels.map((model) => {
                const status = statusStyles[model.status] || statusStyles.unknown;
                const task = getModelTask(model.id) as ModelTask | undefined;
                
                return (
                  <Card key={model.id} className={`${status.border} hover:shadow-md transition-shadow`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {typeIcons[model.type] || <MessageSquare className="h-4 w-4" />}
                          {model.name}
                        </CardTitle>
                        <Badge>{status.text}</Badge>
                      </div>
                      <CardDescription>{model.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <div>
                          <span className="text-gray-500">参数量:</span> {model.parameters}
                        </div>
                        <div>
                          <span className="text-gray-500">量化:</span> {model.quantization}
                        </div>
                        <div>
                          <span className="text-gray-500">大小:</span> {model.size > 0 ? formatSize(model.size) : '未知'}
                        </div>
                        {model.lastUsed && (
                          <div>
                            <span className="text-gray-500">最后使用:</span> {new Date(model.lastUsed).toLocaleString()}
                          </div>
                        )}
                      </div>
                       
                      {/* 显示模型错误信息 */}
                      {model.error && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-4">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          {model.error}
                        </div>
                      )}
                       
                      {task && task.status === 'downloading' && (
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">下载进度: {task.progress}%</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <div className="flex gap-2 w-full justify-between">
                        {model.status === 'not_downloaded' && (
                          <Button 
                            onClick={() => handleModelAction(model.id, 'download')}
                  disabled={selectedModelId === model.id && action === 'download'}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            下载模型
                          </Button>
                        )}
                        {model.status === 'ready' && (
                          <Button>
                            使用模型
                          </Button>
                        )}
                        {(model.status === 'ready' || model.status === 'download_failed' || model.status === 'not_downloaded') && (
                          <Button 
                            onClick={() => handleModelAction(model.id, 'delete')}
                  disabled={selectedModelId === model.id && action === 'delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommended">
          <Card>
            <CardHeader>
              <CardTitle>推荐模型</CardTitle>
              <CardDescription>根据您的使用历史推荐的模型</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendedModels.length > 0 ? (
                <div className="space-y-4">
                  {recommendedModels.map((model) => {
                    const status = statusStyles[model.status] || statusStyles.unknown;
                    return (
                      <div 
                        key={model.id} 
                        className={`p-4 rounded-lg border ${status.border} hover:bg-gray-50 transition-colors`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium flex items-center gap-2">
                            {typeIcons[model.type] || <MessageSquare className="h-4 w-4" />}
                            {model.name}
                          </h3>
                          <Badge>{status.text}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{model.id}</p>
                        <div className="flex gap-2">
                          <Button 
                            disabled={model.status !== 'ready'}
                          >
                            使用模型
                          </Button>
                          {model.status === 'not_downloaded' && (
                            <Button 
                              onClick={() => handleModelAction(model.id, 'download')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              下载
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    暂无推荐模型。使用模型后，系统会根据您的使用习惯提供推荐。
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}