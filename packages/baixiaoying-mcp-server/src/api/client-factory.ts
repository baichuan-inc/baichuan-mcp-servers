/**
 * BaixiaoyingClient 工厂
 *
 * 按 API Key 缓存 BaixiaoyingClient 实例，
 * 避免同一 key 重复创建对象。
 */

import { BaixiaoyingClient } from "./client.js";

const DEFAULT_BASE_URL = "https://api.baichuan-ai.com/v1";
const DEFAULT_TIMEOUT_MS = 25000;

export class BaixiaoyingClientFactory {
  private clients: Map<string, BaixiaoyingClient> = new Map();
  private baseUrl: string;
  private timeoutMs: number;

  constructor(baseUrl?: string, timeoutMs?: number) {
    this.baseUrl = baseUrl || DEFAULT_BASE_URL;
    this.timeoutMs = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * 获取或创建指定 API Key 的 BaixiaoyingClient 实例
   *
   * @returns BaixiaoyingClient 实例，如果 apiKey 为空则返回 null
   */
  getClient(apiKey: string | null | undefined): BaixiaoyingClient | null {
    if (!apiKey) return null;

    let client = this.clients.get(apiKey);
    if (!client) {
      client = new BaixiaoyingClient(apiKey, this.baseUrl, this.timeoutMs);
      this.clients.set(apiKey, client);
    }
    return client;
  }
}
