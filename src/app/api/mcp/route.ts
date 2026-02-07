import { NextRequest } from 'next/server';
import { getMCPClient } from '@/lib/mcp-client';

export const dynamic = 'force-dynamic';

/**
 * MCP サーバーを通して Private Desk を検索
 */
export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json();

    console.log('[API/MCP] MCPリクエスト受信:', {
      timestamp: new Date().toISOString(),
      action,
      params: params ? JSON.stringify(params).substring(0, 200) : undefined,
    });

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // MCP サーバーのURL or ローカルパス
    const mcpServerUrl = process.env.MCP_SERVER_URL;
    const mcpServerPath = process.env.MCP_SERVER_PATH;

    console.log('[API/MCP] MCP設定:', {
      timestamp: new Date().toISOString(),
      mcpServerUrlSet: !!mcpServerUrl,
      mcpServerPathSet: !!mcpServerPath,
      mcpServerUrl: mcpServerUrl ? '設定済み' : '未設定',
      mcpServerPath: mcpServerPath ? '設定済み' : '未設定',
    });

    if (!mcpServerUrl && !mcpServerPath) {
      console.error('[API/MCP] MCP設定エラー:', {
        timestamp: new Date().toISOString(),
        error: 'MCP_SERVER_URL or MCP_SERVER_PATH is not set',
      });
      return new Response(
        JSON.stringify({ error: 'MCP_SERVER_URL or MCP_SERVER_PATH is not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = mcpServerPath ? await getMCPClient(mcpServerPath) : null;

    let result;

    switch (action) {
      case 'search':
        // 統合検索
        if (!params?.query) {
          return new Response(
            JSON.stringify({ error: 'Missing query parameter' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (mcpServerUrl) {
          console.log('[API/MCP] MCPサーバー(HTTP)へ検索リクエスト送信:', {
            timestamp: new Date().toISOString(),
            endpoint: `${mcpServerUrl}/mcp`,
            query: params.query,
            limit: params.limit || 5,
          });

          const response = await fetch(`${mcpServerUrl}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/call',
              params: {
                name: 'search_private_desk',
                arguments: {
                  query: params.query,
                  limit: params.limit || 5,
                },
              },
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            console.error('[API/MCP] MCPサーバー(HTTP)エラー:', {
              timestamp: new Date().toISOString(),
              status: response.status,
              error: text,
            });
            throw new Error(`MCP HTTP error: ${response.status} ${text}`);
          }

          result = await response.json();
          console.log('[API/MCP] MCPサーバー(HTTP)レスポンス受信:', {
            timestamp: new Date().toISOString(),
            resultPreview: JSON.stringify(result).substring(0, 200),
          });
        } else if (client) {
          console.log('[API/MCP] MCPクライアント(プロセス)へ検索リクエスト送信:', {
            timestamp: new Date().toISOString(),
            query: params.query,
            limit: params.limit || 5,
          });
          result = await client.callTool('search_private_desk', {
            query: params.query,
            limit: params.limit || 5,
          });
          console.log('[API/MCP] MCPクライアント(プロセス)レスポンス受信:', {
            timestamp: new Date().toISOString(),
            resultPreview: JSON.stringify(result).substring(0, 200),
          });
        }
        break;

      case 'read_diary':
        if (!params?.id) {
          return new Response(
            JSON.stringify({ error: 'Missing id parameter' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (mcpServerUrl) {
          console.log('[API/MCP] MCPサーバー(HTTP)へ日報読み込みリクエスト送信:', {
            timestamp: new Date().toISOString(),
            endpoint: `${mcpServerUrl}/mcp`,
            id: params.id,
          });

          const response = await fetch(`${mcpServerUrl}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/call',
              params: { name: 'read_diary', arguments: { id: params.id } },
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`MCP HTTP error: ${response.status} ${text}`);
          }

          result = await response.json();
        } else if (client) {
          result = await client.callTool('read_diary', { id: params.id });
        }
        break;

      case 'write_diary':
        if (!params?.title || !params?.content) {
          return new Response(
            JSON.stringify({ error: 'Missing title or content' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (mcpServerUrl) {
          const response = await fetch(`${mcpServerUrl}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/call',
              params: {
                name: 'write_diary',
                arguments: { title: params.title, content: params.content },
              },
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`MCP HTTP error: ${response.status} ${text}`);
          }

          result = await response.json();
        } else if (client) {
          result = await client.callTool('write_diary', {
            title: params.title,
            content: params.content,
          });
        }
        break;

      case 'read_wiki':
        if (!params?.id) {
          return new Response(
            JSON.stringify({ error: 'Missing id parameter' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (mcpServerUrl) {
          const response = await fetch(`${mcpServerUrl}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/call',
              params: { name: 'read_wiki', arguments: { id: params.id } },
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`MCP HTTP error: ${response.status} ${text}`);
          }

          result = await response.json();
        } else if (client) {
          result = await client.callTool('read_wiki', { id: params.id });
        }
        break;

      case 'write_wiki':
        if (!params?.title || !params?.content) {
          return new Response(
            JSON.stringify({ error: 'Missing title or content' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (mcpServerUrl) {
          const response = await fetch(`${mcpServerUrl}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/call',
              params: {
                name: 'write_wiki',
                arguments: { title: params.title, content: params.content },
              },
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`MCP HTTP error: ${response.status} ${text}`);
          }

          result = await response.json();
        } else if (client) {
          result = await client.callTool('write_wiki', {
            title: params.title,
            content: params.content,
          });
        }
        break;

      case 'read_blog':
        if (!params?.id) {
          return new Response(
            JSON.stringify({ error: 'Missing id parameter' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (mcpServerUrl) {
          const response = await fetch(`${mcpServerUrl}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/call',
              params: { name: 'read_blog', arguments: { id: params.id } },
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`MCP HTTP error: ${response.status} ${text}`);
          }

          result = await response.json();
        } else if (client) {
          result = await client.callTool('read_blog', { id: params.id });
        }
        break;

      case 'write_blog':
        if (
          !params?.title ||
          !params?.content ||
          !params?.contentMarkdown ||
          !params?.contentHtml ||
          !params?.eyecatch ||
          !params?.permalink ||
          !params?.site ||
          !params?.author ||
          !params?.persona
        ) {
          return new Response(
            JSON.stringify({ error: 'Missing required blog parameters' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (mcpServerUrl) {
          const response = await fetch(`${mcpServerUrl}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/call',
              params: {
                name: 'write_blog',
                arguments: {
                  title: params.title,
                  content: params.content,
                  contentMarkdown: params.contentMarkdown,
                  contentHtml: params.contentHtml,
                  eyecatch: params.eyecatch,
                  permalink: params.permalink,
                  site: params.site,
                  author: params.author,
                  persona: params.persona,
                },
              },
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`MCP HTTP error: ${response.status} ${text}`);
          }

          result = await response.json();
        } else if (client) {
          result = await client.callTool('write_blog', {
            title: params.title,
            content: params.content,
            contentMarkdown: params.contentMarkdown,
            contentHtml: params.contentHtml,
            eyecatch: params.eyecatch,
            permalink: params.permalink,
            site: params.site,
            author: params.author,
            persona: params.persona,
          });
        }
        break;

      case 'search_passwords':
        if (!params?.query) {
          return new Response(
            JSON.stringify({ error: 'Missing query parameter' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (mcpServerUrl) {
          const response = await fetch(`${mcpServerUrl}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/call',
              params: {
                name: 'search_passwords',
                arguments: { query: params.query },
              },
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`MCP HTTP error: ${response.status} ${text}`);
          }

          result = await response.json();
        } else if (client) {
          result = await client.callTool('search_passwords', {
            query: params.query,
          });
        }
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    console.log('[API/MCP] レスポンス送信:', {
      timestamp: new Date().toISOString(),
      success: true,
      resultPreview: JSON.stringify(result).substring(0, 200),
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[API/MCP] MCPエラー:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const mcpServerUrl = process.env.MCP_SERVER_URL;
    const mcpServerPath = process.env.MCP_SERVER_PATH;

    if (!mcpServerUrl && !mcpServerPath) {
      return new Response(
        JSON.stringify({ error: 'MCP_SERVER_URL or MCP_SERVER_PATH is not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (mcpServerUrl) {
      const response = await fetch(`${mcpServerUrl}/health`, { method: 'GET' });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`MCP HTTP error: ${response.status} ${text}`);
      }

      return new Response(
        JSON.stringify({
          status: 'connected',
          mcpServer: mcpServerUrl,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await getMCPClient(mcpServerPath as string);

    return new Response(
      JSON.stringify({
        status: 'connected',
        mcpServer: mcpServerPath,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('MCP Status Check Error:', error);
    return new Response(
      JSON.stringify({
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
