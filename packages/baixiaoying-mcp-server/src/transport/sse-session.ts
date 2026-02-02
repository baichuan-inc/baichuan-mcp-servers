/**
 * Session 管理
 * 管理 MCP 会话的生命周期和关联的 SSE 流
 */

import { SSEStream, generateStreamId } from "./sse-stream.js";
import type { ServerResponse } from "node:http";

/**
 * 默认 Session TTL（30分钟）
 */
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;

/**
 * Session 清理检查间隔（1分钟）
 */
const CLEANUP_INTERVAL_MS = 60 * 1000;

/**
 * Session 数据结构
 */
export interface Session {
  /** Session 唯一标识 */
  sessionId: string;

  /** 关联的 SSE 流 */
  streams: Map<string, SSEStream>;

  /** 创建时间 */
  createdAt: number;

  /** 最后活跃时间 */
  lastActiveAt: number;

  /** 协议版本 */
  protocolVersion: string;
}

/**
 * Session 管理器
 */
export class SessionManager {
  /** 所有活跃的 Session */
  private sessions: Map<string, Session> = new Map();

  /** Session TTL（毫秒） */
  private sessionTtl: number;

  /** 清理定时器 */
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(sessionTtl: number = DEFAULT_SESSION_TTL_MS) {
    this.sessionTtl = sessionTtl;
    this.startCleanup();
  }

  /**
   * 创建新 Session
   */
  createSession(protocolVersion: string): Session {
    const sessionId = this.generateSessionId();
    const session: Session = {
      sessionId,
      streams: new Map(),
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      protocolVersion,
    };
    this.sessions.set(sessionId, session);
    console.error(`[SessionManager] Created session: ${sessionId}`);
    return session;
  }

  /**
   * 获取 Session
   */
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActiveAt = Date.now();
    }
    return session;
  }

  /**
   * 删除 Session
   */
  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // 关闭所有关联的流
    for (const stream of session.streams.values()) {
      stream.close();
    }
    session.streams.clear();

    this.sessions.delete(sessionId);
    console.error(`[SessionManager] Deleted session: ${sessionId}`);
    return true;
  }

  /**
   * 为 Session 创建新的 SSE 流
   */
  createStream(sessionId: string, res: ServerResponse): SSEStream | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const streamId = generateStreamId();
    const stream = new SSEStream(streamId, res);

    // 流关闭时从 session 中移除
    stream.onClose(() => {
      session.streams.delete(streamId);
      console.error(
        `[SessionManager] Stream ${streamId} closed, remaining: ${session.streams.size}`
      );
    });

    session.streams.set(streamId, stream);
    session.lastActiveAt = Date.now();

    console.error(
      `[SessionManager] Created stream ${streamId} for session ${sessionId}`
    );
    return stream;
  }

  /**
   * 获取 Session 中用于发送消息的主流
   * 选择最近活跃的流
   */
  getPrimaryStream(sessionId: string): SSEStream | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.streams.size === 0) {
      return null;
    }

    // 返回第一个未关闭的流
    for (const stream of session.streams.values()) {
      if (!stream.closed) {
        return stream;
      }
    }

    return null;
  }

  /**
   * 检查 Session 是否存在
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, CLEANUP_INTERVAL_MS);
  }

  /**
   * 清理过期的 Session
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActiveAt > this.sessionTtl) {
        expiredIds.push(sessionId);
      }
    }

    for (const sessionId of expiredIds) {
      this.deleteSession(sessionId);
      console.error(`[SessionManager] Expired session cleaned: ${sessionId}`);
    }
  }

  /**
   * 生成唯一的 Session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 12);
    return `mcp-session-${timestamp}-${random}`;
  }

  /**
   * 关闭 Session 管理器
   */
  close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // 关闭所有 Session
    for (const sessionId of this.sessions.keys()) {
      this.deleteSession(sessionId);
    }
  }

  /**
   * 获取活跃 Session 数量（用于调试）
   */
  get activeSessionCount(): number {
    return this.sessions.size;
  }
}
