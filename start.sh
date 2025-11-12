#!/bin/bash

# 言語云³深度堆栈启动脚本
# 自动检查环境并启动服务

echo "🚀 启动言語云³深度堆栈..."

# 检查Node.js版本
NODE_VERSION=$(node --version)
echo "📦 Node.js版本: $NODE_VERSION"

# 检查环境变量文件
if [ ! -f ".env.local" ]; then
    echo "❌ 未找到环境变量文件 .env.local"
    echo "   请运行: npm run setup:env"
    exit 1
fi

# 检查Ollama服务
echo "🔍 检查Ollama服务..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama服务正常"
else
    echo "❌ Ollama服务未运行"
    echo "   请启动Ollama: ollama serve"
    exit 1
fi

# 安装依赖
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "   安装依赖中..."
    npm install
fi

# 启动开发服务器
echo "🌟 启动开发服务器..."
npm run dev
