/**
 * @file EmojiPopover 表情选择弹窗组件
 * @description 轻量级常用表情选择器，支持外部点击关闭与锚点定位
 * @module ui/emoji-popover
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-30
 * @updated 2025-10-30
 */

"use client";

import React, { useEffect, useRef } from "react";

/**
 * 常用表情常量（可根据项目偏好扩展）
 */
export const COMMON_EMOJIS = [
  "😊",
  "👍",
  "🎉",
  "❤️",
  "😂",
  "🤔",
  "🚀",
  "🙌",
  "😎",
  "💡",
];

export interface EmojiPopoverProps {
  /** 是否打开弹窗 */
  open: boolean;
  /** 选择表情回调 */
  onPick: (emoji: string) => void;
  /** 请求关闭弹窗 */
  onRequestClose: () => void;
  /** 锚点容器（relative），用于外部点击判断与定位 */
  anchorRef?: React.RefObject<HTMLElement>;
  /** 可自定义表情列表，默认 COMMON_EMOJIS */
  emojis?: string[];
  /** 自定义类名 */
  className?: string;
}

/**
 * @description 表情选择弹窗组件
 */
export const EmojiPopover: React.FC<EmojiPopoverProps> = ({
  open,
  onPick,
  onRequestClose,
  anchorRef,
  emojis = COMMON_EMOJIS,
  className = "",
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // 外部点击关闭（忽略锚点与弹窗内部）
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      const inPopover = popoverRef.current?.contains(target);
      const inAnchor = anchorRef?.current && (anchorRef.current as any).contains?.(target);
      if (!inPopover && !inAnchor) {
        onRequestClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, anchorRef, onRequestClose]);

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      className={
        `absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-md p-2 w-[180px] grid grid-cols-5 gap-2 z-50 select-none ${className}`
      }
      role="menu"
      aria-label="常用表情选择"
    >
      {emojis.map((emo) => (
        <button
          key={emo}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-xl leading-none"
          onClick={() => onPick(emo)}
          aria-label={`插入表情 ${emo}`}
          title={`插入表情 ${emo}`}
        >
          {emo}
        </button>
      ))}
    </div>
  );
};

export default EmojiPopover;
