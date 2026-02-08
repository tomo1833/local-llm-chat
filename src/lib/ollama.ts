import { Message } from '@/types';
import { generateSystemPrompt, MCP_TOOLS } from './tools';
import { getMcpToolsCached } from './tool-executor';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';

export async function streamOllamaResponse(
  messages: Array<{ role: string; content: string }>,
  options?: { model?: string }
) {
  const formattedMessages = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content,
  }));

  // システムプロンプトを最初に追加
  const mcpTools = await getMcpToolsCached();
  const toolsForPrompt = mcpTools && mcpTools.length > 0 ? mcpTools : MCP_TOOLS;
  const systemPrompt = generateSystemPrompt(toolsForPrompt);
  const messagesWithSystem = [
    { role: 'system', content: systemPrompt },
    ...formattedMessages,
  ];

  console.log('[Ollama] LLM問い合わせを送信:', {
    timestamp: new Date().toISOString(),
    endpoint: `${OLLAMA_BASE_URL}/api/chat`,
    model: options?.model || MODEL,
    messageCount: formattedMessages.length,
    hasSystemPrompt: true,
    messages: formattedMessages.map((m) => ({
      role: m.role,
      contentLength: m.content.length,
      preview: m.content.substring(0, 100),
    })),
  });

  // タイムアウトを30秒に設定
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || MODEL,
        messages: messagesWithSystem,
        stream: true,
        tools: toolsForPrompt.map((tool) => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[Ollama] LLM問い合わせエラー:', {
        timestamp: new Date().toISOString(),
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Ollama API error: ${response.status}`);
    }

    console.log('[Ollama] LLM問い合わせ成功（ストリーミング開始）:', {
      timestamp: new Date().toISOString(),
      status: response.status,
    });

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('[Ollama] タイムアウト:', {
        timestamp: new Date().toISOString(),
        timeout: '30秒',
        endpoint: `${OLLAMA_BASE_URL}/api/chat`,
      });
      throw new Error(`Ollama接続タイムアウト（30秒）。Ollamaが起動しているか確認してください: ${OLLAMA_BASE_URL}`);
    }
    
    console.error('[Ollama] 接続エラー:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      endpoint: `${OLLAMA_BASE_URL}/api/chat`,
    });
    throw new Error(`Ollama接続エラー: ${error.message}。Ollamaが起動しているか確認してください: ${OLLAMA_BASE_URL}`);
  }
}

export async function getOllamaModels() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    return [];
  }
}
