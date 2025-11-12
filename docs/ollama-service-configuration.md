# Ollama 服务配置指南

## 📋 概述

本文档详细介绍了在言語云³深度堆栈智创引擎中配置和使用Ollama本地大模型服务的方法，包括安装步骤、配置要求、故障排除和常见问题解答。

## 🔍 Ollama简介

Ollama是一个用于在本地运行大型语言模型的工具，它允许您在自己的计算机上部署、管理和使用各种开源AI模型，而无需依赖云服务。

## 📥 安装指南

### 1.  macOS安装

```bash
# 使用Homebrew安装
brew install ollama

# 安装完成后启动服务
ollama serve
```

### 2. Linux安装

```bash
# 使用官方脚本安装
curl -fsSL https://ollama.com/install.sh | sh

# 启动服务
systemctl start ollama

# 设置为开机自启动
systemctl enable ollama
```

### 3. Windows安装

- 访问[Ollama官网](https://ollama.com/)下载Windows安装程序
- 运行安装程序并按照提示完成安装
- Ollama服务会自动启动

## ⚙️ 配置要求

### 系统要求

- **操作系统**：macOS、Linux或Windows
- **内存**：建议至少16GB RAM（对于大型模型）
- **磁盘空间**：至少10GB可用空间（取决于要下载的模型大小）
- **CPU/GPU**：支持Intel/AMD CPU，推荐NVIDIA GPU以获得更好的性能

### 环境变量配置

在项目的`.env.local`文件中配置Ollama服务地址：

```
# Ollama服务地址（默认值）
NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434
```

如果Ollama服务运行在不同的主机或端口上，请相应地修改此值。

## 🔧 服务启动与管理

### 启动服务

#### macOS/Linux

```bash
# 前台运行服务
ollama serve

# 或在后台运行
ollama serve &
```

#### Windows

- 服务通常会在安装后自动启动
- 可以通过服务管理器检查和管理Ollama服务

### 下载模型

启动服务后，可以下载各种模型：

```bash
# 下载基础模型
ollama pull llama3
ollama pull codellama
ollama pull phi3

# 下载特定版本或量化版本
ollama pull llama3:8b-instruct-q4_0
```

### 验证安装

要验证Ollama服务是否正常运行，请在浏览器中访问：

```
http://localhost:11434/api/tags
```

或者使用curl命令：

```bash
curl http://localhost:11434/api/tags
```

如果服务正常运行，您将看到已安装的模型列表。

## 🚨 故障排除

### 常见错误与解决方案

#### 1. 无法连接到Ollama服务

**错误信息**："无法连接到Ollama服务，请确保Ollama已安装并正在运行"

**解决方案**：
- 确认Ollama服务正在运行：`ollama serve`
- 检查服务地址是否正确配置
- 验证端口11434是否未被其他程序占用

#### 2. 服务超时

**错误信息**："连接Ollama服务超时，请检查服务是否运行"

**解决方案**：
- 确认Ollama服务进程正在运行
- 检查防火墙设置，确保端口11434允许访问
- 如果运行在远程服务器上，确认网络连接正常

#### 3. 模型下载失败

**解决方案**：
- 检查网络连接
- 确保有足够的磁盘空间
- 尝试使用较小的模型或量化版本

### 日志查看

- **macOS/Linux**：检查系统日志或运行Ollama服务的终端输出
- **Windows**：查看事件查看器中的Ollama服务日志

## 🔄 与应用集成

### 配置验证

应用启动时会自动检查Ollama服务连接。您也可以手动运行验证脚本：

```bash
npm run validate:environment
```

## 📊 推荐模型

根据不同用途，推荐以下模型：

- **通用对话**：llama3:8b, phi3:mini
- **代码生成**：codellama:7b-code
- **多模态**：llava:latest

## 🔒 安全注意事项

- Ollama服务默认只监听本地地址（localhost/127.0.0.1）
- 如果需要远程访问，请确保配置适当的网络安全措施
- 不要在公共网络上暴露Ollama API端口，除非已配置适当的访问控制

## 📝 最佳实践

1. 对于开发环境，使用较小的模型以加快迭代速度
2. 为生产环境预留足够的系统资源
3. 定期更新Ollama和模型以获取最新功能和安全修复
4. 监控系统资源使用情况，特别是在处理大型模型时

## 🆘 支持

如果您在配置或使用Ollama服务时遇到问题，请参考以下资源：

- [Ollama官方文档](https://github.com/ollama/ollama)
- 项目GitHub仓库的Issues页面
- 联系技术支持团队

---

**文档更新日期**：2024年11月
**版本**：1.0.0
