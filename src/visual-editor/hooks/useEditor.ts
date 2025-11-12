// useEditor 自定义Hook - 提供可视化编辑器的核心功能
import { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  updateComponent,
  selectComponent,
  moveComponent
} from '../store/visualEditorSlice';
import type { VisualEditorState } from '../store/visualEditorSlice';
import { DragState, ResizeState } from '../types';

interface UseEditorProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

// 定义局部的RootState类型以移除useSelector中的any
interface RootState {
  visualEditor: VisualEditorState;
}

export const useEditor = ({ canvasRef }: UseEditorProps) => {
  const dispatch = useDispatch();
  
  // 从Redux获取编辑器状态（使用严格类型）
  const { components, selectedComponentId } = useSelector((state: RootState) => state.visualEditor);
  
  // 本地状态管理
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });
  
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    startX: 0,
    startY: 0,
    initialWidth: 0,
    initialHeight: 0,
    initialX: 0,
    initialY: 0
  });
  
  const [zoom, setZoom] = useState(1);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [canvasStartPosition] = useState({ x: 0, y: 0 });
  
  // 拖拽相关的引用
  const canvasDragRef = useRef({ startX: 0, startY: 0 });
  
  // 获取选中的组件
  const selectedComponent = selectedComponentId ? components[selectedComponentId] : null;
  
  // 处理组件点击
  const handleComponentClick = useCallback((componentId: string) => {
    dispatch(selectComponent(componentId));
  }, [dispatch]);
  
  // 处理画布点击
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // 如果点击的是画布背景，清除选中状态
    if (e.target === canvasRef.current) {
      dispatch(selectComponent(null));
    }
  }, [dispatch, canvasRef]);
  
  // 处理组件拖拽开始
  const handleComponentDragStart = useCallback((componentId: string, e: React.MouseEvent) => {
    const component = components[componentId];
    if (!component) return;
    
    setDragState({
      isDragging: true,
      componentId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: component.x,
      initialY: component.y
    });
    
    // 如果组件未被选中，则选中它
    if (selectedComponentId !== componentId) {
      dispatch(selectComponent(componentId));
    }
  }, [components, selectedComponentId, dispatch]);
  
  // 处理组件拖拽移动
  const handleComponentDragMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.componentId) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    dispatch(moveComponent({
      componentId: dragState.componentId,
      deltaX,
      deltaY
    }));
  }, [dragState, dispatch]);
  
  // 处理组件拖拽结束
  const handleComponentDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      initialX: 0,
      initialY: 0
    });
  }, []);
  
  // 处理组件缩放开始（使用严格的handle类型）
  const handleComponentResizeStart = useCallback((
    componentId: string,
    e: React.MouseEvent,
    handle: ResizeState['handle']
  ) => {
    const component = components[componentId];
    if (!component) return;
    
    e.stopPropagation();
    
    setResizeState({
      isResizing: true,
      componentId,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: component.width,
      initialHeight: component.height,
      initialX: component.x,
      initialY: component.y,
      handle
    });
  }, [components]);
  
  // 处理组件缩放移动
  const handleComponentResizeMove = useCallback((e: MouseEvent) => {
    if (!resizeState.isResizing || !resizeState.componentId) return;
    
    const deltaX = e.clientX - resizeState.startX;
    const deltaY = e.clientY - resizeState.startY;
    let newWidth = resizeState.initialWidth;
    let newHeight = resizeState.initialHeight;
    let newX = components[resizeState.componentId]?.x || 0;
    let newY = components[resizeState.componentId]?.y || 0;
    
    // 根据缩放手柄的位置计算新的尺寸和位置
    switch (resizeState.handle) {
      case 'e':
        newWidth = Math.max(32, resizeState.initialWidth + deltaX);
        break;
      case 'w':
        newWidth = Math.max(32, resizeState.initialWidth - deltaX);
        newX = resizeState.initialX + deltaX;
        break;
      case 's':
        newHeight = Math.max(32, resizeState.initialHeight + deltaY);
        break;
      case 'n':
        newHeight = Math.max(32, resizeState.initialHeight - deltaY);
        newY = resizeState.initialY + deltaY;
        break;
      case 'se':
        newWidth = Math.max(32, resizeState.initialWidth + deltaX);
        newHeight = Math.max(32, resizeState.initialHeight + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(32, resizeState.initialWidth - deltaX);
        newHeight = Math.max(32, resizeState.initialHeight + deltaY);
        newX = resizeState.initialX + deltaX;
        break;
      case 'ne':
        newWidth = Math.max(32, resizeState.initialWidth + deltaX);
        newHeight = Math.max(32, resizeState.initialHeight - deltaY);
        newY = resizeState.initialY + deltaY;
        break;
      case 'nw':
        newWidth = Math.max(32, resizeState.initialWidth - deltaX);
        newHeight = Math.max(32, resizeState.initialHeight - deltaY);
        newX = resizeState.initialX + deltaX;
        newY = resizeState.initialY + deltaY;
        break;
    }
    
    // 更新组件尺寸和位置
    dispatch(updateComponent({
      componentId: resizeState.componentId,
      updates: { width: newWidth, height: newHeight, x: newX, y: newY }
    }));
  }, [resizeState, components, dispatch]);
  
  // 处理组件缩放结束
  const handleComponentResizeEnd = useCallback(() => {
    setResizeState({
      isResizing: false,
      startX: 0,
      startY: 0,
      initialWidth: 0,
      initialHeight: 0,
      initialX: 0,
      initialY: 0
    });
  }, []);
  
  // 处理画布拖拽开始
  const handleCanvasDragStart = useCallback((e: React.MouseEvent) => {
    if (selectedComponent || dragState.isDragging || resizeState.isResizing) {
      return;
    }
    
    setIsCanvasDragging(true);
    canvasDragRef.current = {
      startX: e.clientX,
      startY: e.clientY
    };
  }, [selectedComponent, dragState.isDragging, resizeState.isResizing]);
  
  // 处理画布拖拽移动
  const handleCanvasDragMove = useCallback((e: MouseEvent) => {
    if (!isCanvasDragging) return;
    
    const deltaX = e.clientX - canvasDragRef.current.startX;
    const deltaY = e.clientY - canvasDragRef.current.startY;
    
    setCanvasPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    canvasDragRef.current = {
      startX: e.clientX,
      startY: e.clientY
    };
  }, [isCanvasDragging]);
  
  // 处理画布拖拽结束
  const handleCanvasDragEnd = useCallback(() => {
    setIsCanvasDragging(false);
  }, []);
  
  // 处理缩放
  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => {
      const newZoom = prev + delta;
      return Math.max(0.1, Math.min(3, newZoom)); // 限制缩放范围在0.1到3之间
    });
  }, []);
  
  // 放大
  const zoomIn = useCallback(() => {
    handleZoom(0.1);
  }, [handleZoom]);

  // 缩小
  const zoomOut = useCallback(() => {
    handleZoom(-0.1);
  }, [handleZoom]);

  // 监听全局鼠标事件（组件拖拽和缩放）
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging) {
        handleComponentDragMove(e);
      }
      if (resizeState.isResizing) {
        handleComponentResizeMove(e);
      }
      if (isCanvasDragging) {
        handleCanvasDragMove(e);
      }
    };

    const handleMouseUp = () => {
      if (dragState.isDragging) {
        handleComponentDragEnd();
      }
      if (resizeState.isResizing) {
        handleComponentResizeEnd();
      }
      if (isCanvasDragging) {
        handleCanvasDragEnd();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, resizeState.isResizing, isCanvasDragging, handleComponentDragMove, handleComponentResizeMove, handleComponentDragEnd, handleComponentResizeEnd, handleCanvasDragMove, handleCanvasDragEnd]);

  return {
    components,
    selectedComponent,
    selectedComponentId,
    dragState,
    resizeState,
    zoom,
    canvasPosition,
    isCanvasDragging,
    canvasStartPosition,
    handleComponentClick,
    handleCanvasClick,
    handleComponentDragStart,
    handleComponentDragMove,
    handleComponentDragEnd,
    handleComponentResizeStart,
    handleComponentResizeMove,
    handleComponentResizeEnd,
    handleCanvasDragStart,
    handleCanvasDragMove,
    handleCanvasDragEnd,
    zoomIn,
    zoomOut,
    setZoom,
    setCanvasPosition
  };
};