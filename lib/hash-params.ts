
/**
 * @file 哈希路由参数解析工具
 * @description 统一解析与应用 URL hash 中的 module 与 project 参数
 * @module lib/hash-params
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-31
 * @updated 2025-10-31
 */
"use client";

import type { ModuleType } from "@/types/modules";
import { ensureDefaultProject } from "./default-project";

export type HashParams = Record<string, string>;

/**
 * @description 解析 URL hash 为键值对（支持 + 作为空格）
 * @param hash - 包含前缀的哈希字符串，例如 "#module=deployment-management&project=E2E%20Demo"
 * @returns 键值对象
 */
export function parseHash(hash: string): HashParams {
  const raw = (hash || "").startsWith("#") ? hash.slice(1) : (hash || "");
  const usp = new URLSearchParams(raw);
  const params: HashParams = {};
  usp.forEach((value, key) => {
    // URLSearchParams 已处理 %20 与 + 空格
    params[key] = value;
  });
  return params;
}

/**
 * @description 解析 URL 查询参数为键值对（支持 + 作为空格）
 * @param query - 查询字符串，例如 "?module=deployment-management&project=E2E%20Demo"
 */
export function parseQuery(query: string): HashParams {
  const raw = (query || "").startsWith("?") ? query.slice(1) : (query || "");
  const usp = new URLSearchParams(raw);
  const params: HashParams = {};
  usp.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

/**
 * @description 从 hash 中读取模块 ID
 */
export function getModuleFromHash(hash: string): ModuleType | null {
  const params = parseHash(hash);
  const mod = params["module"];
  return mod ? (mod as ModuleType) : null;
}

/**
 * @description 从 hash 中读取项目名称
 */
export function getProjectFromHash(hash: string): string | null {
  const params = parseHash(hash);
  const name = params["project"];
  return name ?? null;
}

/**
 * @description 应用当前窗口的 hash 参数：设置模块与选择/创建项目
 * @param opts.setActiveModule - 设置激活模块的函数
 * @param opts.onProjectEnsured - 可选回调，项目创建/选择完成后触发
 */
export async function applyHashParams(opts: {
  setActiveModule: (module: ModuleType) => void;
  onProjectEnsured?: (projectName: string) => void;
}): Promise<void> {
  if (typeof window === "undefined") return;
  const hash = window.location.hash || "";

  const mod = getModuleFromHash(hash);
  if (mod) {
    opts.setActiveModule(mod);
  }

  const projectName = getProjectFromHash(hash);
  if (projectName) {
    const project = await ensureDefaultProject(projectName);
    if (project && opts.onProjectEnsured) opts.onProjectEnsured(projectName);
  }
}

/**
 * @description 统一应用路由参数（支持 hash 与 query），用于集中式初始化
 * @param opts.setActiveModule - 设置激活模块的函数
 * @param opts.searchParams - 可选：自定义查询参数来源（App Router 的 searchParams）
 */
export async function applyRouteParams(opts?: {
  setActiveModule?: (module: ModuleType) => void;
  searchParams?: URLSearchParams | Record<string, string>;
  onProjectEnsured?: (projectName: string) => void;
}): Promise<void> {
  if (typeof window === "undefined") return;

  // 防御: 允许无参数调用，提供安全的默认实现
  const setActiveModule = opts?.setActiveModule ?? (() => {});
  const onProjectEnsured = opts?.onProjectEnsured;

  // 合并 query 与 hash，hash 优先
  let queryParams: HashParams = {};
  const sp = opts?.searchParams;
  if (sp) {
    if (sp instanceof URLSearchParams) {
      sp.forEach((value, key) => {
        queryParams[key] = value;
      });
    } else {
      queryParams = { ...(sp as Record<string, string>) } as HashParams;
    }
  } else {
    queryParams = parseQuery(window.location.search || "");
  }

  const hashParams = parseHash(window.location.hash || "");
  const merged = { ...queryParams, ...hashParams };

  // 模块初始化
  const mod = merged["module"] as ModuleType | undefined;
  if (mod) {
    setActiveModule(mod);
  }

  // 项目初始化
  const projectName = merged["project"];
  if (projectName) {
    const project = await ensureDefaultProject(projectName);
    if (project && onProjectEnsured) onProjectEnsured(projectName);
  }
}
