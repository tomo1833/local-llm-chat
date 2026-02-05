import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface MCPMessage {
  jsonrpc: string;
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * MCP サーバーとの通信を管理
 */
export class MCPClient extends EventEmitter {
  private process: any;
  private messageId: number = 0;
  private pendingRequests: Map<number, (response: MCPResponse) => void> = new Map();
  private buffer: string = '';

  constructor(private serverPath: string) {
    super();
  }

  /**
   * MCP サーバーに接続
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.process = spawn('node', [this.serverPath], {
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 30000,
        });

        this.process.stdout.on('data', (data: Buffer) => {
          this.handleData(data.toString());
        });

        this.process.stderr.on('data', (data: Buffer) => {
          console.error('MCP Server stderr:', data.toString());
        });

        this.process.on('error', (error: Error) => {
          console.error('MCP Server process error:', error);
          reject(error);
        });

        // Connection established
        setTimeout(() => resolve(), 100);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * データを受信して処理
   */
  private handleData(data: string): void {
    this.buffer += data;
    const lines = this.buffer.split('\n');

    // 最後の行は不完全な可能性があるので保持
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response: MCPResponse = JSON.parse(line);
          const handler = this.pendingRequests.get(response.id);
          if (handler) {
            this.pendingRequests.delete(response.id);
            handler(response);
          }
        } catch (error) {
          console.error('Failed to parse MCP response:', error, line);
        }
      }
    }
  }

  /**
   * MCP サーバーにリクエストを送信
   */
  async call(method: string, params?: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('MCP Server not connected'));
        return;
      }

      const id = ++this.messageId;
      const message: MCPMessage = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      // タイムアウト設定
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`MCP request timeout for method: ${method}`));
      }, 30000);

      // ハンドラを一度だけ設定
      const handler = (response: MCPResponse) => {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(id);
        if (response.error) {
          reject(new Error(`MCP Error: ${response.error.message}`));
        } else {
          resolve(response.result);
        }
      };

      this.pendingRequests.set(id, handler);

      try {
        this.process.stdin.write(JSON.stringify(message) + '\n');
      } catch (error) {
        this.pendingRequests.delete(id);
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * リソースを読み込む
   */
  async readResource(uri: string): Promise<unknown> {
    return this.call('resources/read', { uri });
  }

  /**
   * ツールを実行
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    return this.call('tools/call', { name, arguments: args });
  }

  /**
   * MCP サーバーを切断
   */
  disconnect(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.pendingRequests.clear();
  }
}

// グローバルインスタンス
let globalMCPClient: MCPClient | null = null;

/**
 * MCP クライアントを取得（シングルトン）
 */
export async function getMCPClient(serverPath: string): Promise<MCPClient> {
  if (!globalMCPClient) {
    globalMCPClient = new MCPClient(serverPath);
    await globalMCPClient.connect();
  }
  return globalMCPClient;
}

/**
 * MCP クライアントを閉じる
 */
export function closeMCPClient(): void {
  if (globalMCPClient) {
    globalMCPClient.disconnect();
    globalMCPClient = null;
  }
}
