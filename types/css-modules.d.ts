/**
 * @file CSS 模块类型声明
 * @description 为 `*.module.css` 提供类型支持，避免 TypeScript 找不到类型声明错误
 * @author YYC
 * @created 2025-10-30
 */
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}
