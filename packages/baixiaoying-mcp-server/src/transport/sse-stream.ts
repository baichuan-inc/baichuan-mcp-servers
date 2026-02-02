/**
 * SSE Stream 抽象
 * 管理单个 SSE 连接的生命周期和消息发送
 */

import { ServerResponse } from "node:http";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

/**
 * SSE 心跳间隔（毫秒）
 */
const HEARTBEAT_INTERVAL_MS = 20000; // 20秒

/**
 * SSE 重连建议时间（毫秒）
 */
const RETRY_MS = 2000;

/**
 * SSE Stream 类
 * 封装 SSE 连接的管理和消息发送
 */
export class SSEStream {
  /** 流唯一标识 */
  readonly streamId: string;

  /** HTTP 响应对象 */
  private res: ServerResponse;

  /** 消息序列号 */
  private seq: number = 0;

  /** 是否已关闭 */
  private _closed: boolean = false;

  /** 心跳定时器 */
  private heartbeatTimer: NodeJS.Timeout | null = null;

  /** 关闭回调 */
  private onCloseCallback: (() => void) | null = null;

  constructor(streamId: string, res: ServerResponse) {
    this.streamId = streamId;
    this.res = res;
    this.setupSSE();
    this.startHeartbeat();
  }

  /**
   * 获取流是否已关闭
   */
  get closed(): boolean {
    return this._closed;
  }

  /**
   * 设置关闭回调
   */
  onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  /**
   * 初始化 SSE 响应头
   */
  private setupSSE(): void {
    this.res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // 禁用 nginx 缓冲
    });

    // 发送初始空事件（用于断线重连标识）
    this.res.write(`id: ${this.streamId}:0\ndata: \nretry: ${RETRY_MS}\n\n`);

    // 监听连接关闭
    this.res.on("close", () => {
      this.handleClose();
    });

    this.res.on("error", (err) => {
      console.error(`[SSEStream ${this.streamId}] Error:`, err.message);
      this.handleClose();
    });
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (!this._closed) {
        try {
          this.res.write(": keep-alive\n\n");
        } catch {
          this.handleClose();
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  /**
   * 处理连接关闭
   */
  private handleClose(): void {
    if (this._closed) return;
    this._closed = true;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  /**
   * 发送 JSON-RPC 消息
   */
  send(message: JSONRPCMessage): boolean {
    if (this._closed) {
      return false;
    }

    try {
      this.seq++;
      const eventId = `${this.streamId}:${this.seq}`;
      const data = JSON.stringify(message);
      this.res.write(`id: ${eventId}\ndata: ${data}\n\n`);
      return true;
    } catch (err) {
      console.error(`[SSEStream ${this.streamId}] Send error:`, err);
      this.handleClose();
      return false;
    }
  }

  /**
   * 关闭流
   */
  close(): void {
    if (this._closed) return;

    try {
      // 发送关闭标记（可选）
      this.res.end();
    } catch {
      // 忽略关闭时的错误
    }

    this.handleClose();
  }
}

/**
 * 生成唯一的 stream ID
 */
export function generateStreamId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `stream-${timestamp}-${random}`;
}
