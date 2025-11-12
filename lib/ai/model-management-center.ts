import { useState, useEffect } from "react"

// 类型定义
export type ModelType = 'chat' | 'code' | 'multimodal'
export type ModelProvider = "ollama" | "openai" | "anthropic" | "google"




export interface ModelManagementConfig {
  ollamaUrl: string
  modelCacheDir: string
  defaultModels: Array<{
    id: string
    name: string
    type: ModelType
    provider: string
  }>
  autoDownload: boolean
  maxConcurrentDownloads: number
  connectionTimeout: number
  retryAttempts: number
}

export interface AIModel {
  id: string
  name: string
  type: ModelType
  provider: ModelProvider
  status: 'ready' | 'downloading' | 'not_downloaded' | 'download_failed' | 'unavailable' | 'unknown'
  size: number
  lastUsed: string | Date | null
  parameters: string
  quantization: string
  createdAt: Date
  updatedAt?: Date
  error?: string
  usageCount?: number
  downloadProgress?: number
}

export interface ModelTask {
  id: string;
  modelId: string;
  type: 'download' | 'delete' | 'update';
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// AI模型管理中心 - 统一管理本地和云端AI模型
export class ModelManagementCenter {
  private static instance: ModelManagementCenter
  private models = new Map<string, AIModel>()
  private modelTasks = new Map<string, ModelTask>()
  private config: ModelManagementConfig
  private _connectionStatus: 'connected' | 'error' | 'unknown' = 'unknown';
  private _errorMessage: string | null = null;
  
  // Getters for connection status
  public get connectionStatus(): 'connected' | 'error' | 'unknown' {
    return this._connectionStatus;
  }
  
  public get errorMessage(): string | null {
    return this._errorMessage;
  }
  
  // 初始化模型列表
  private async initializeModels(): Promise<void> {
    try {
      // 获取本地已安装的Ollama模型
      await this.fetchOllamaModels();

      // 添加默认模型（如果不存在）
      for (const defaultModel of this.config.defaultModels) {
        if (!this.models.has(defaultModel.id)) {
          // 确保provider是有效的ModelProvider类型
          const provider = defaultModel.provider as ModelProvider;
          this.models.set(defaultModel.id, {
            ...defaultModel,
            status: "not_downloaded",
            size: 0,
            lastUsed: null,
            parameters: defaultModel.id.includes("7b") ? "7B" : defaultModel.id.includes("8b") ? "8B" : "Unknown",
            quantization: defaultModel.id.includes("q4_0") ? "Q4_0" : "None",
            createdAt: new Date(),
            provider // 使用类型断言后的provider
          })
        }
      }

      console.log(`✅ 已初始化${this.models.size}个AI模型`)
    } catch (error) {
      console.error("初始化模型失败:", error)
    }
  }
  
  private constructor() {
    // 安全地获取环境变量并添加默认值
    const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL 
      ? process.env.NEXT_PUBLIC_OLLAMA_URL.trim() 
      : "http://localhost:11434";
      
    this.config = {
      ollamaUrl,
      modelCacheDir: "/tmp/yanyu-models",
      defaultModels: [
        { id: "codellama:7b", name: "CodeLlama 7B", type: "code", provider: "ollama" },
        { id: "llama3:8b", name: "Llama 3 8B", type: "chat", provider: "ollama" },
        { id: "phi3:mini", name: "Phi-3 Mini", type: "chat", provider: "ollama" },
      ],
      autoDownload: false,
      maxConcurrentDownloads: 1,
      // 添加连接配置
      connectionTimeout: 5000, // 5秒超时
      retryAttempts: 2,
    }
    
    // 异步初始化，不阻塞构造函数
    this.initializeModels().catch(err => {
      console.error("模型初始化失败:", err);
    })
  }

  // 刷新模型列表
  public async refreshModels(): Promise<void> {
    this._connectionStatus = 'unknown';
    this._errorMessage = null;
    await this.fetchOllamaModels();
  }

  // 获取推荐模型
  public getRecommendedModels(type: ModelType, limit: number = 3): AIModel[] {
    return this.getModelsByType(type)
      .filter(model => model.status === 'ready')
      .sort((a, b) => {
        // 优先排序有lastUsed的模型
        if (a.lastUsed && b.lastUsed) {
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        }
        return a.lastUsed ? -1 : 1;
      })
      .slice(0, limit);
  }

  // 删除模型


  // 获取所有任务
  public getAllTasks(): ModelTask[] {
    return Array.from(this.modelTasks.values());
  }

  


  // 模拟加载模型（用于测试）
  private simulateModelDownload(modelId: string, task: ModelTask): void {
    // 仅用于开发测试
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        task.status = 'completed';
        task.progress = 100;
        task.completedAt = new Date();
        
        // 更新模型状态
        const model = this.models.get(modelId);
        if (model) {
          this.models.set(modelId, {
            ...model,
            status: 'ready',
            size: Math.floor(Math.random() * 1000000000), // 随机大小
            updatedAt: new Date()
          });
        }
      }
      
      task.progress = Math.min(progress, 100);
      task.updatedAt = new Date();
      this.modelTasks.set(modelId, { ...task });
    }, 500);
  }
  
  public static getInstance(): ModelManagementCenter {
    if (!ModelManagementCenter.instance) {
      ModelManagementCenter.instance = new ModelManagementCenter();
    }
    return ModelManagementCenter.instance;
  }

  



  // 获取Ollama模型列表
  private async fetchOllamaModels(): Promise<void> {
    const maxRetries = 3; // 最大重试次数
    const retryDelay = 1000; // 重试间隔（毫秒）
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // 添加连接超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        console.log(`[尝试 ${attempt + 1}/${maxRetries}] 连接到Ollama服务: ${this.config.ollamaUrl}`);
        
        const response = await fetch(`${this.config.ollamaUrl}/api/tags`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          method: 'GET',
        })
        
        clearTimeout(timeoutId); // 清除超时定时器

        if (!response.ok) {
          const errorMessage = `获取Ollama模型失败: ${response.status} ${response.statusText}`;
          console.error(`[尝试 ${attempt + 1}] ${errorMessage}`);
          
          // 如果是服务端错误且不是最后一次尝试，进行重试
          if (response.status >= 500 && attempt < maxRetries - 1) {
            console.log(`[尝试 ${attempt + 1}] 服务端错误，${retryDelay}ms后重试...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          
          throw new Error(errorMessage);
        }

        try {
          const data = await response.json();
          
          if (data.models && Array.isArray(data.models)) {
            console.log(`[成功] 获取到 ${data.models.length} 个Ollama模型`);
            
            for (const model of data.models) {
              const modelId = model.name;
              const existingModel = this.models.get(modelId);

              this.models.set(modelId, {
                id: modelId,
                name: this.formatModelName(modelId),
                type: this.inferModelType(modelId),
                provider: "ollama",
                status: "ready",
                size: model.size || 0,
                lastUsed: existingModel?.lastUsed || null,
                parameters: this.inferModelParameters(modelId),
                quantization: this.inferModelQuantization(modelId),
                createdAt: existingModel?.createdAt || new Date(),
                updatedAt: new Date(),
                error: undefined, // 清除之前的错误信息
              });
            }
          } else {
            console.warn("Ollama API 返回了无效的模型数据结构");
          }
          
          // 设置连接状态为已连接
          this.setConnectionStatus('connected');
          return; // 成功获取，直接返回
        } catch (jsonError) {
          console.error(`[尝试 ${attempt + 1}] 解析Ollama API响应失败:`, jsonError);
          throw new Error('解析Ollama模型数据失败');
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`[尝试 ${attempt + 1}] 获取Ollama模型失败:`, error);
        
        // 如果是最后一次尝试或不是网络相关错误，不再重试
        if (attempt >= maxRetries - 1 || 
            (lastError && !(lastError.name === 'AbortError' || 
                           lastError.message.includes('Network') ||
                           lastError.message.includes('fetch')))) {
          break;
        }
        
        console.log(`[尝试 ${attempt + 1}] 连接失败，${retryDelay}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // 所有重试都失败，设置错误状态
      if (lastError) {
        // 设置连接状态为错误
        this.setConnectionStatus('error', lastError.name === 'AbortError' ? 
          '连接Ollama服务超时，请检查服务是否运行' : 
          '无法连接到Ollama服务，请确保Ollama已安装并正在运行');
        
        // 根据错误类型提供更具体的错误信息
        let errorMessage: string;
      
      if (lastError.name === 'AbortError') {
        errorMessage = '连接Ollama服务超时，请检查服务是否运行';
      } else if (lastError.message.includes('Network') || lastError.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查Ollama服务是否可用';
      } else {
        errorMessage = `Ollama服务错误: ${lastError.message}`;
      }
      
      console.error(`[最终] ${errorMessage}`);
      
      // 更新所有Ollama模型状态
      for (const [id, model] of this.models.entries()) {
        if (model.provider === "ollama") {
          this.models.set(id, { 
            ...model, 
            status: "unavailable",
            error: errorMessage,
            updatedAt: new Date()
          });
        }
      }
      
      // 同时检查是否有已安装但未在模型列表中的模型
      this.scanForOllamaModels();
    }
  }
  
  // 扫描Ollama已安装但未在模型列表中的模型
  private scanForOllamaModels(): void {
    // 这里可以添加逻辑，从其他来源（如本地配置）获取已知的Ollama模型
    // 目前仅作为占位方法
    console.log('扫描可能的Ollama模型...');
  }

  // 格式化模型名称
  private formatModelName(modelId: string): string {
    // 将模型ID转换为更友好的显示名称
    const parts = modelId.split(':');
    const baseName = parts[0];
    const version = parts[1] || '';

    const nameMap: Record<string, string> = {
      codellama: 'CodeLlama',
      llama3: 'Llama 3',
      llama2: 'Llama 2',
      phi3: 'Phi-3',
      mistral: 'Mistral',
      qwen: 'Qwen',
      gemma: 'Gemma'
    };

    const formattedName = nameMap[baseName] || baseName.charAt(0).toUpperCase() + baseName.slice(1);

    if (version) {
      return `${formattedName} ${version}`;
    }

    return formattedName;
  }

  // 推断模型类型
  private inferModelType(modelId: string): ModelType {
    const id = modelId.toLowerCase()

    if (id.includes("code") || id.includes("starcoder") || id.includes("deepseek-coder")) {
      return "code"
    } else if (id.includes("vision") || id.includes("clip") || id.includes("image")) {
      return "multimodal"
    } else {
      return "chat"
    }
  }

  // 推断模型参数量
  private inferModelParameters(modelId: string): string {
    const id = modelId.toLowerCase()

    if (id.includes("70b")) return "70B"
    if (id.includes("34b")) return "34B"
    if (id.includes("13b")) return "13B"
    if (id.includes("8b")) return "8B"
    if (id.includes("7b")) return "7B"
    if (id.includes("3b")) return "3B"
    if (id.includes("1b")) return "1B"

    return "未知"
  }

  // 推断模型量化方式
  private inferModelQuantization(modelId: string): string {
    const id = modelId.toLowerCase()

    if (id.includes("q4_0")) return "Q4_0"
    if (id.includes("q4_1")) return "Q4_1"
    if (id.includes("q5_0")) return "Q5_0"
    if (id.includes("q5_1")) return "Q5_1"
    if (id.includes("q8_0")) return "Q8_0"

    return "无量化"
  }

  // 获取所有模型
  public getAllModels(): AIModel[] {
    return Array.from(this.models.values())
  }

  // 设置连接状态
  private setConnectionStatus(status: 'connected' | 'error' | 'unknown', errorMessage?: string): void {
    this._connectionStatus = status;
    if (status === 'error' && errorMessage) {
      this._errorMessage = errorMessage;
    } else if (status === 'connected') {
      this._errorMessage = null;
    }
  }
  
  // 下载模型


  // 获取特定类型的模型
  public getModelsByType(type: ModelType): AIModel[] {
    return Array.from(this.models.values()).filter((model) => model.type === type)
  }

  // 获取可用的模型
  public getAvailableModels(): AIModel[] {
    return Array.from(this.models.values()).filter((model) => model.status === "ready")
  }

  // 获取模型详情
  public getModel(modelId: string): AIModel | undefined {
    return this.models.get(modelId)
  }

  // 下载模型
  public async downloadModel(modelId: string): Promise<ModelTask> {
    // 检查是否已存在下载任务
    let task = this.modelTasks.get(modelId)
    if (task && ["pending", "downloading"].includes(task.status)) {
      return task
    }

    // 创建新的下载任务
    task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modelId,
      type: "download",
      status: "pending",
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.modelTasks.set(modelId, task)

    // 更新模型状态
    const model = this.models.get(modelId)
    if (model) {
      this.models.set(modelId, { ...model, status: "downloading" })
    }

    // 开始下载
    this.startModelDownload(modelId, task)

    return task
  }

  // 开始模型下载
  private async startModelDownload(modelId: string, task: ModelTask): Promise<void> {
    try {
      // 更新任务状态
      task.status = "downloading"
      task.startedAt = new Date()
      this.modelTasks.set(modelId, { ...task })

      console.log(`🔄 开始下载模型: ${modelId}`)

      // 调用Ollama API下载模型
      const response = await fetch(`${this.config.ollamaUrl}/api/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: modelId }),
      })

      if (!response.ok) {
        throw new Error(`下载模型失败: ${response.status}`)
      }

      // Ollama API返回的是流式响应，需要逐行读取
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("无法读取响应流")
      }

      let receivedLength = 0
      let totalLength = 0

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        // 解析进度信息
        const text = new TextDecoder().decode(value)
        const lines = text.split("\n").filter((line) => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)

            if (data.total && data.completed) {
              totalLength = data.total
              receivedLength = data.completed

              const progress = Math.round((receivedLength / totalLength) * 100)

              // 更新任务进度
              task.progress = progress
              task.updatedAt = new Date()
              this.modelTasks.set(modelId, { ...task })

              // 更新模型状态
              const model = this.models.get(modelId)
              if (model) {
                this.models.set(modelId, {
                  ...model,
                  status: "downloading",
                  downloadProgress: progress,
                })
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      // 下载完成，更新状态
      task.status = "completed"
      task.progress = 100
      task.completedAt = new Date()
      this.modelTasks.set(modelId, { ...task })

      // 更新模型状态
      await this.fetchOllamaModels() // 重新获取模型列表以更新状态

      console.log(`✅ 模型下载完成: ${modelId}`)
    } catch (error) {
      console.error(`❌ 模型下载失败: ${modelId}`, error)

      // 更新任务状态
      task.status = "failed"
      task.error = error instanceof Error ? error.message : "下载失败"
      task.updatedAt = new Date()
      this.modelTasks.set(modelId, { ...task })

      // 更新模型状态
      const model = this.models.get(modelId)
      if (model) {
        this.models.set(modelId, { ...model, status: "download_failed" })
      }
    }
  }

  // 删除模型
  public async deleteModel(modelId: string): Promise<boolean> {
    try {
      // 检查模型是否存在
      const model = this.models.get(modelId)
      if (!model) {
        throw new Error(`模型不存在: ${modelId}`)
      }

      // 只能删除Ollama模型
      if (model.provider !== "ollama") {
        throw new Error(`不支持删除非Ollama模型: ${modelId}`)
      }

      console.log(`🗑️ 开始删除模型: ${modelId}`)

      // 调用Ollama API删除模型
      const response = await fetch(`${this.config.ollamaUrl}/api/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: modelId }),
      })

      if (!response.ok) {
        throw new Error(`删除模型失败: ${response.status}`)
      }

      // 更新模型状态
      this.models.set(modelId, { ...model, status: "not_downloaded" })

      console.log(`✅ 模型删除成功: ${modelId}`)
      return true
    } catch (error) {
      console.error(`❌ 模型删除失败: ${modelId}`, error)
      return false
    }
  }

  // 获取模型任务
  public getModelTasks(): ModelTask[] {
    return Array.from(this.modelTasks.values())
  }

  // 获取模型任务详情
  public getModelTask(taskId: string): ModelTask | undefined {
    // 通过taskId遍历查找任务
    for (const [id, task] of this.modelTasks.entries()) {
      if (task.id === taskId) {
        return task;
      }
    }
    return undefined;
  }

  // 获取模型统计信息（更新版本，包含provider统计）
  public getModelStats(): ModelStats {
    const models = Array.from(this.models.values());
    return {
      total: models.length,
      ready: models.filter(m => m.status === 'ready').length,
      downloading: models.filter(m => m.status === 'downloading').length,
      notDownloaded: models.filter(m => m.status === 'not_downloaded').length,
      byType: {
        chat: models.filter(m => m.type === 'chat').length,
        code: models.filter(m => m.type === 'code').length,
        multimodal: models.filter(m => m.type === 'multimodal').length
      },
      byProvider: {
        ollama: models.filter(m => m.provider === 'ollama').length,
        openai: models.filter(m => m.provider === 'openai').length,
        anthropic: models.filter(m => m.provider === 'anthropic').length,
        google: models.filter(m => m.provider === 'google').length
      },
      totalSize: models.reduce((sum, model) => sum + model.size, 0)
    };
  }

  // 使用模型（记录使用时间）
  public useModel(modelId: string): void {
    const model = this.models.get(modelId);
    if (model) {
      this.models.set(modelId, {
        ...model,
        lastUsed: new Date(),
        usageCount: (model.usageCount || 0) + 1
      });
    }
  }
}

// React Hook for Model Management
export const useModelManagement = (): {
  models: AIModel[];
  tasks: ModelTask[];
  stats: ReturnType<ModelManagementCenter['getModelStats']> | undefined;
  connectionStatus: 'connected' | 'error' | 'unknown';
  errorMessage: string | null;
  loading: boolean;
  refreshModels: () => Promise<void>;
  downloadModel: (modelId: string) => Promise<ModelTask>;
  deleteModel: (modelId: string) => Promise<void>;
  getRecommendedModels: (type: ModelType, limit?: number) => AIModel[];
} => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [tasks, setTasks] = useState<ModelTask[]>([]);
  const [stats, setStats] = useState<ReturnType<ModelManagementCenter['getModelStats']> | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const modelManager = ModelManagementCenter.getInstance();
    
    // 初始加载
    const loadModels = (): void => {
      const currentModels = modelManager.getAllModels();
      const currentTasks = modelManager.getAllTasks();
      const currentStats = modelManager.getModelStats();
      
      setModels(currentModels);
      setTasks(currentTasks);
      setStats(currentStats);
      setLoading(false);
    };

    loadModels();

    // 设置定期更新
    const interval = setInterval(loadModels, 1000);
    setUpdateInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const modelManager = ModelManagementCenter.getInstance();

  return {
    models,
    tasks,
    stats,
    connectionStatus: modelManager.connectionStatus,
    errorMessage: modelManager.errorMessage,
    loading,
    refreshModels: modelManager.refreshModels.bind(modelManager),
    downloadModel: modelManager.downloadModel.bind(modelManager),
    deleteModel: modelManager.deleteModel.bind(modelManager),
    getRecommendedModels: modelManager.getRecommendedModels.bind(modelManager)
  };
};

// 添加缺失的类型定义
export type ModelStatus = "ready" | "downloading" | "not_downloaded" | "download_failed" | "unknown" | "unavailable"
export type TaskType = "download" | "update" | "delete"
export type TaskStatus = "pending" | "downloading" | "completed" | "failed"

export interface ModelStats {
  total: number
  ready: number
  downloading: number
  notDownloaded: number
  byType: Record<ModelType, number>
  byProvider: Record<ModelProvider, number>
  totalSize: number
}

// 导出模型管理中心实例
export const modelManagementCenter = ModelManagementCenter.getInstance()

