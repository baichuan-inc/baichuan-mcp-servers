/**
 * 认证与安全工具
 *
 * 从 HTTP 请求的 Authorization: Bearer <token> 头中提取用户的百川 API Key。
 * 在 HTTP/SSE 传输模式下，用户通过 Bearer Token 传入自己的 API Key，
 * 服务端使用该 Key 进行后续的百川 API 调用。
 *
 * API Key 解析优先级：Bearer Token > BAICHUAN_API_KEY 环境变量 > null
 */

import type { IncomingMessage } from "node:http";

/**
 * 从请求头中提取 Bearer Token
 *
 * @returns Bearer Token 字符串，如果不存在或格式不正确则返回 null
 */
export function extractBearerToken(req: IncomingMessage): string | null {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return null;
  }

  // 严格匹配 "Bearer <token>" 格式
  const match = authHeader.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

/**
 * 解析请求中的 API Key
 *
 * 优先从请求的 Authorization: Bearer <token> 中提取，
 * 如未提供则回退到 BAICHUAN_API_KEY 环境变量。
 *
 * @returns API Key 字符串，如果都未提供则返回 null
 */
export function resolveApiKey(req: IncomingMessage): string | null {
  return extractBearerToken(req) || process.env.BAICHUAN_API_KEY || null;
}

/**
 * Origin 校验配置
 */
export interface OriginValidationOptions {
  /** 允许的 Origin 列表，支持通配符（如 "http://localhost:*"），"*" 表示允许所有 */
  allowedOrigins: string[];
  /** 是否允许空 Origin（CLI/桌面客户端通常不携带 Origin） */
  allowEmptyOrigin: boolean;
}

/**
 * 校验请求的 Origin 是否在白名单中
 *
 * @param origin 请求的 Origin header 值，null 表示未携带
 * @param options 校验配置
 * @returns 是否允许该 Origin
 */
export function validateOrigin(origin: string | null, options: OriginValidationOptions): boolean {
  // 空 Origin 处理（CLI、桌面客户端等不带 Origin）
  if (!origin) {
    return options.allowEmptyOrigin;
  }

  // 检查白名单
  for (const allowed of options.allowedOrigins) {
    if (allowed === "*") {
      return true;
    }
    // 支持通配符匹配（如 http://localhost:*）
    if (allowed.includes("*")) {
      const pattern = allowed
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      if (new RegExp(`^${pattern}$`).test(origin)) {
        return true;
      }
    } else if (origin === allowed || origin.startsWith(allowed)) {
      return true;
    }
  }

  return false;
}
