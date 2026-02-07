import { Message } from '@/types';
import { generateSystemPrompt } from './tools';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';

export async function streamOllamaResponse(
  messages: Array<{ role: string; content: string }>
) {
  const formattedMessages = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content,
  }));

  // システムプロンプトを最初に追加
  const systemPrompt = generateSystemPrompt();
  const messagesWithSystem = [
    { role: 'system', content: systemPrompt },
    ...formattedMessages,
  ];

  console.log('[Ollama] LLM問い合わせを送信:', {
    timestamp: new Date().toISOString(),
    endpoint: `${OLLAMA_BASE_URL}/api/chat`,
    model: MODEL,
    messageCount: formattedMessages.length,
    hasSystemPrompt: true,
    messages: formattedMessages.map((m) => ({
      role: m.role,
      contentLength: m.content.length,
      preview: m.content.substring(0, 100),
    })),
  });

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messagesWithSystem,
      stream: true,
      tools: [
        {
          type: 'function',
          function: {
            name: 'search_diary',
            description: '日報を検索',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: '検索キーワード' },
                limit: { type: 'number', description: '最大結果数' },
              },
              required: ['query'],
            },
          },
        },
      ],
    }),
  });

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
