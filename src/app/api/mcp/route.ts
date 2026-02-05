import { NextRequest } from 'next/server';
import { getMCPClient } from '@/lib/mcp-client';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * MCP サーバーを通して Private Desk を検索
 */
export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // MCP サーバーパス（環境変数から取得）
    const mcpServerPath = process.env.MCP_SERVER_PATH;
    if (!mcpServerPath) {
      return new Response(
        JSON.stringify({ error: 'MCP_SERVER_PATH environment variable is not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await getMCPClient(mcpServerPath);

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
        result = await client.callTool('search_private_desk', {
          query: params.query,
          limit: params.limit || 5,
        });
        break;

      case 'read_diary':
        if (!params?.id) {
          return new Response(
            JSON.stringify({ error: 'Missing id parameter' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        result = await client.callTool('read_diary', { id: params.id });
        break;

      case 'write_diary':
        if (!params?.title || !params?.content) {
          return new Response(
            JSON.stringify({ error: 'Missing title or content' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        result = await client.callTool('write_diary', {
          title: params.title,
          content: params.content,
        });
        break;

      case 'read_wiki':
        if (!params?.id) {
          return new Response(
            JSON.stringify({ error: 'Missing id parameter' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        result = await client.callTool('read_wiki', { id: params.id });
        break;

      case 'write_wiki':
        if (!params?.title || !params?.content) {
          return new Response(
            JSON.stringify({ error: 'Missing title or content' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        result = await client.callTool('write_wiki', {
          title: params.title,
          content: params.content,
        });
        break;

      case 'read_blog':
        if (!params?.id) {
          return new Response(
            JSON.stringify({ error: 'Missing id parameter' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        result = await client.callTool('read_blog', { id: params.id });
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
        break;

      case 'search_passwords':
        if (!params?.query) {
          return new Response(
            JSON.stringify({ error: 'Missing query parameter' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        result = await client.callTool('search_passwords', {
          query: params.query,
        });
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('MCP API Error:', error);
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
    const mcpServerPath = process.env.MCP_SERVER_PATH;
    if (!mcpServerPath) {
      return new Response(
        JSON.stringify({ error: 'MCP_SERVER_PATH environment variable is not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await getMCPClient(mcpServerPath);

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
