/**
 * MCPツール実行ユーティリティ
 */

import { ToolCall } from './tools';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL;

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// MCP初期化状態管理
let mcpSessionId: string | null = null;
let mcpInitialized = false;

/**
 * MCP サーバーの初期化ハンドシェイク
 */
async function initializeMCP(): Promise<boolean> {
  if (mcpInitialized && mcpSessionId) {
    console.log('[ToolExecutor] MCP既に初期化済み:', {
      timestamp: new Date().toISOString(),
      sessionId: mcpSessionId,
    });
    return true;
  }

  if (!MCP_SERVER_URL) {
    console.error('[ToolExecutor] MCPサーバーURLが設定されていません');
    return false;
  }

  try {
    console.log('[ToolExecutor] MCP初期化開始:', {
      timestamp: new Date().toISOString(),
      endpoint: `${MCP_SERVER_URL}/mcp`,
    });

    // 1. initialize リクエスト
    const initResponse = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'Private Desk MCP Client',
            version: '1.0.0',
          },
        },
      }),
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error('[ToolExecutor] initialize失敗:', {
        timestamp: new Date().toISOString(),
        status: initResponse.status,
        error: errorText,
      });
      return false;
    }

    const initData = await initResponse.json();
    console.log('[ToolExecutor] initialize レスポンス受信:', {
      timestamp: new Date().toISOString(),
      result: initData.result,
    });

    // Mcp-Session-Id をヘッダーから取得（レスポンスヘッダーにある場合）
    const sessionIdHeader = initResponse.headers.get('Mcp-Session-Id');
    if (sessionIdHeader) {
      mcpSessionId = sessionIdHeader;
      console.log('[ToolExecutor] Mcp-Session-Id 取得:', {
        timestamp: new Date().toISOString(),
        sessionId: mcpSessionId,
      });
    }

    // 2. initialized 通知送信
    const initializedResponse = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        ...(mcpSessionId ? { 'Mcp-Session-Id': mcpSessionId } : {}),
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'notifications/initialized',
        params: {},
      }),
    });

    if (!initializedResponse.ok) {
      const errorText = await initializedResponse.text();
      console.error('[ToolExecutor] initialized送信失敗:', {
        timestamp: new Date().toISOString(),
        status: initializedResponse.status,
        error: errorText,
      });
      return false;
    }

    console.log('[ToolExecutor] MCP初期化完了:', {
      timestamp: new Date().toISOString(),
      sessionId: mcpSessionId,
    });

    mcpInitialized = true;
    return true;
  } catch (error) {
    console.error('[ToolExecutor] MCP初期化エラー:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}


/**
 * MCPサーバー経由でツールを実行
 */
export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  if (!MCP_SERVER_URL) {
    console.error('[ToolExecutor] MCPサーバーURLが設定されていません:', {
      timestamp: new Date().toISOString(),
      toolName: toolCall.name,
    });
    return {
      success: false,
      error: 'MCP_SERVER_URL is not configured',
    };
  }

  try {
    // MCP初期化ハンドシェイクを実行
    const initialized = await initializeMCP();
    if (!initialized) {
      return {
        success: false,
        error: 'Failed to initialize MCP server',
      };
    }

    const toolNameMap: Record<string, string> = {
      search_diary: 'search_private_desk',
    };
    const resolvedToolName = toolNameMap[toolCall.name] ?? toolCall.name;

    // ツールパラメータを検証し、デフォルト値を設定
    let validatedParams = { ...toolCall.params };
    
    // オブジェクトでない場合は空オブジェクトに
    if (typeof validatedParams !== 'object' || validatedParams === null) {
      validatedParams = {};
    }

    // search_private_desk の場合、query パラメータが必須
    if (resolvedToolName === 'search_private_desk') {
      // query が無い場合は、必須パラメータとして「最近」をデフォルト設定
      if (!validatedParams.query || validatedParams.query === '') {
        console.warn('[ToolExecutor] query パラメータが不足しているため、デフォルト値を使用:', {
          timestamp: new Date().toISOString(),
          originalParams: toolCall.params,
        });
        validatedParams.query = '最近';
      }
      
      // limit が無い場合は 5 をデフォルト値に
      if (!validatedParams.limit || validatedParams.limit < 1) {
        validatedParams.limit = 5;
      }
    }

    console.log('[ToolExecutor] ツール実行開始:', {
      timestamp: new Date().toISOString(),
      toolName: resolvedToolName,
      originalParams: JSON.stringify(toolCall.params),
      validatedParams: JSON.stringify(validatedParams),
      paramKeys: Object.keys(validatedParams),
      sessionId: mcpSessionId,
    });

    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        ...(mcpSessionId ? { 'Mcp-Session-Id': mcpSessionId } : {}),
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: resolvedToolName,
          arguments: validatedParams,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[ToolExecutor] ツール実行エラー:', {
        timestamp: new Date().toISOString(),
        toolName: resolvedToolName,
        status: response.status,
        error: text,
      });
      return {
        success: false,
        error: `HTTP ${response.status}: ${text}`,
      };
    }

    const result = await response.json();
    console.log('[ToolExecutor] ツール実行成功:', {
      timestamp: new Date().toISOString(),
      toolName: resolvedToolName,
      resultPreview: JSON.stringify(result).substring(0, 200),
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[ToolExecutor] ツール実行例外:', {
      timestamp: new Date().toISOString(),
      toolName: toolCall.name,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 複数のツール呼び出しを順序実行
 */
export async function executeToolCalls(
  toolCalls: ToolCall[]
): Promise<Map<string, ToolResult>> {
  const results = new Map<string, ToolResult>();

  for (let i = 0; i < toolCalls.length; i++) {
    const toolCall = toolCalls[i];
    const result = await executeToolCall(toolCall);
    results.set(`tool_${i}_${toolCall.name}`, result);

    console.log('[ToolExecutor] ツール呼び出し完了:', {
      timestamp: new Date().toISOString(),
      index: i,
      totalCount: toolCalls.length,
      toolName: toolCall.name,
      success: result.success,
    });
  }

  return results;
}

/**
 * ツール結果をフォーマット（LLMへの入力用）
 */
export function formatToolResults(results: Map<string, ToolResult>): string {
  const formattedResults: string[] = [];

  results.forEach((result, key) => {
    if (result.success) {
      formattedResults.push(`[${key}] 成功:\n${JSON.stringify(result.data)}`);
    } else {
      formattedResults.push(`[${key}] エラー: ${result.error}`);
    }
  });

  return formattedResults.join('\n\n');
}
