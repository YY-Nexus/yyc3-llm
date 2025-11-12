import React, { useEffect, useState } from "react";
import { Progress, Button, Tooltip } from "antd";
import { ThunderboltOutlined, CodeOutlined, ExperimentOutlined, DatabaseOutlined } from "@ant-design/icons";

// 新设计仪表盘右侧面板
export default function ModelEngineDashboardPanel({
  onQuickAction
}: {
  onQuickAction?: (action: string) => void
}) {
  // 系统状态模拟
  const [cpu, setCpu] = useState(49);
  const [mem, setMem] = useState(92); // 高内存占用，触发红色
  const [nodes, setNodes] = useState(5);
  const [models, setModels] = useState(48);
  const [todayCalls, setTodayCalls] = useState(19);
  const [codeLines, setCodeLines] = useState(95);

  // 定时刷新模拟
  useEffect(() => {
    const timer = setInterval(() => {
      setCpu(Math.floor(40 + Math.random() * 30));
      setMem(Math.floor(80 + Math.random() * 20));
      setNodes(5 + Math.floor(Math.random() * 2));
      setModels(48 + Math.floor(Math.random() * 2));
      setTodayCalls(15 + Math.floor(Math.random() * 10));
      setCodeLines(90 + Math.floor(Math.random() * 10));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-80 flex flex-col gap-4">
      {/* 系统状态 */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-2">
        <div className="font-semibold text-base mb-2">系统状态</div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 text-sm">CPU使用率</span>
          <Progress percent={cpu} size="small" showInfo={false} style={{ width: 120 }} />
          <span className="ml-2 text-gray-700 font-bold text-base">{cpu}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">内存使用率</span>
          <Progress percent={mem} size="small" showInfo={false} strokeColor={mem > 85 ? '#ff4d4f' : undefined} style={{ width: 120 }} />
          <span className={`ml-2 font-bold text-base ${mem > 85 ? 'text-red-500' : 'text-gray-700'}`}>{mem}%</span>
        </div>
      </div>
      {/* 统计区块 */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-blue-500 mb-1">{nodes}</div>
          <div className="text-xs text-gray-500">节点</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-purple-500 mb-1">{models}</div>
          <div className="text-xs text-gray-500">模型</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-orange-500 mb-1">{todayCalls}</div>
          <div className="text-xs text-gray-500">今日调用</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center">
          <div className="text-2xl font-bold text-green-500 mb-1">{codeLines}</div>
          <div className="text-xs text-gray-500">代码量</div>
        </div>
      </div>
      {/* 快捷操作 */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
        <div className="font-semibold text-base mb-2">快捷操作</div>
        <div className="flex gap-2">
          <Button icon={<CodeOutlined />} type="default" className="flex-1" onClick={() => onQuickAction?.('code')}>
            生成代码
          </Button>
          <Button icon={<ExperimentOutlined />} type="default" className="flex-1" onClick={() => onQuickAction?.('experiment')}>
            创建实验
          </Button>
          <Button icon={<DatabaseOutlined />} type="default" className="flex-1" onClick={() => onQuickAction?.('data')}>
            数据分析
          </Button>
        </div>
      </div>
    </div>
  );
}
