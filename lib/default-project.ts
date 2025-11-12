/**
 * @file 默认项目工具
 * @description 提供创建/选择默认项目的统一函数，便于测试与演示环境一键注入
 * @module lib/default-project
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-31
 * @updated 2025-10-31
 */
"use client";

import { useProjectStore } from "./project-store";
import type { Project } from "@/types/project";

/**
 * @description 创建或选择默认项目，并注入常见部署环境（dev / staging / prod）
 * @param projectName - 项目名称（默认用于查找或创建）
 * @returns Promise<Project | null>
 */
export async function ensureDefaultProject(projectName: string): Promise<Project | null> {
  try {
    const {
      searchProjects,
      createProject,
      setCurrentProject,
      updateProject,
      projects,
    } = useProjectStore.getState();

    // 如果已存在同名项目，直接选择
    const existing = (searchProjects?.(projectName) || []).find((p: any) => p?.name === projectName)
      || (Array.isArray(projects) ? projects.find((p: any) => p?.name === projectName) : null);

    if (existing) {
      setCurrentProject?.(existing as Project);
      return existing as Project;
    }

    // 否则创建一个最小可用的演示项目（createProject 会自动补齐必要字段）
    const demo = await createProject?.({
      name: projectName,
      description: `E2E 测试演示项目 - ${projectName}`,
      type: "web",
      status: "active",
      visibility: "private",
      deployment: { environments: [] },
    } as any);

    if (!demo) return null;

    // 注入唯一的 dev / staging / production 环境（覆盖原有，避免重复）
    const updatedEnvs = [
      {
        id: "dev",
        name: "开发环境",
        type: "development" as const,
        branch: "main",
        autoDeployEnabled: false,
        variables: { DEBUG: "true" },
        url: "http://localhost:3000",
      },
      {
        id: "staging",
        name: "预发布环境",
        type: "staging" as const,
        branch: "release",
        autoDeployEnabled: false,
        variables: { API_BASE_URL: "https://staging.api.example.com", FEATURE_FLAG_NEW: "true" },
        url: "https://staging.example.com",
      },
      {
        id: "prod",
        name: "生产环境",
        type: "production" as const,
        branch: "main",
        autoDeployEnabled: false,
        variables: { API_BASE_URL: "https://api.example.com" },
        url: "https://example.com",
      },
    ];

    await updateProject?.(demo.id, {
      deployment: {
        ...(demo.deployment || {}),
        environments: updatedEnvs,
        cicd: {
          enabled: false,
          provider: "github-actions",
          config: {},
          webhooks: [],
        },
        docker: {
          enabled: false,
          dockerfile: "./Dockerfile",
          image: "node:18-alpine",
          registry: "docker.io",
          buildArgs: {},
        },
      },
    });

    const created = (useProjectStore.getState().projects || []).find((p: any) => p?.id === demo.id) || demo;
    setCurrentProject?.(created as Project);
    return created as Project;
  } catch (error) {
    console.error("ensureDefaultProject 失败", error);
    return null;
  }
}
