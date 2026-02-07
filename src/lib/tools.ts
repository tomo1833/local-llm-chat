/**
 * MCPツール定義とシステムプロンプト
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export const MCP_TOOLS: ToolDefinition[] = [
  {
    name: 'search_private_desk',
    description: 'Private Desk 全体（例: 日報、ウィキ、ブログ）を統合検索',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '検索キーワード',
        },
        limit: {
          type: 'number',
          description: '最大結果数（デフォルト: 5）',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_diary',
    description: '指定IDの日報を読み込む',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: '日報ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'write_diary',
    description: '新しい日報を作成',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '日報のタイトル',
        },
        content: {
          type: 'string',
          description: '日報の内容',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'read_wiki',
    description: '指定IDのウィキページを読み込む',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'ウィキページID',
        },
      },
      required: ['id'],
    },
  },
];

/**
 * システムプロンプトを生成
 */
export function generateSystemPrompt(): string {
  const toolsDescription = MCP_TOOLS.map((tool) => {
    const params = Object.entries(tool.parameters.properties)
      .map(([key, value]: [string, any]) => {
        const required = tool.parameters.required.includes(key) ? ' (必須)' : '';
        return `      - ${key}: ${value.description}${required}`;
      })
      .join('\n');
    return `
## ${tool.name}
説明: ${tool.description}
パラメータ:
${params}`;
  }).join('\n');

  return `あなたはPrivate Deskアシスタントです。ユーザーの質問に答え、必要に応じてツールを使用して情報を取得します。

## 利用可能なツール
${toolsDescription}

## ツール呼び出し方法
ツールを使用する必要がある場合は、以下の JSON 形式で指定してください。複数のツール呼び出しが可能です。

\`\`\`json
[TOOL_CALL]
{
  "name": "ツール名",
  "params": {
    "key": "value"
  }
}
[/TOOL_CALL]\`\`\`

例:
\`\`\`json
[TOOL_CALL]
{
  "name": "search_private_desk",
  "params": {
    "query": "プロジェクトの進捗",
    "limit": 3
  }
}
[/TOOL_CALL]\`\`\`

## 注意点
1. ツール呼び出しは [TOOL_CALL] と [/TOOL_CALL] で囲む
2. 複数のツールを呼び出す場合は、各々を [TOOL_CALL] で囲む
3. ツール呼び出し後、結果に基づいて回答を続行する
4. ツール呼び出しが不要な場合は直接回答する
5. JSON形式は正確に、スペースやカンマに注意

## ツール呼び出しの例

ユーザー: 「最近のプロジェクト進捗について教えて」
アシスタント:
\`\`\`json
[TOOL_CALL]
{
  "name": "search_private_desk",
  "params": {
    "query": "プロジェクト進捗",
    "limit": 5
  }
}
[/TOOL_CALL]\`\`\`

[検索結果が返されたら]
検索結果から以下の内容を見つけました...`;
}

/**
 * ツール呼び出しをレスポンスから抽出
 */
export interface ToolCall {
  name: string;
  params: Record<string, any>;
}

export function extractToolCalls(response: string): ToolCall[] {
  const toolCalls: ToolCall[] = [];
  const regex = /\[TOOL_CALL\]\s*([\s\S]*?)\s*\[\/TOOL_CALL\]/g;
  
  let match;
  while ((match = regex.exec(response)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      if (json.name && json.params) {
        toolCalls.push({
          name: json.name,
          params: json.params,
        });
      }
    } catch (error) {
      console.error('[Tools] ツール呼び出しパース失敗:', {
        timestamp: new Date().toISOString(),
        content: match[1],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  return toolCalls;
}

/**
 * ツール呼び出しをマスク（ストリーミングで隠す）
 */
export function maskToolCalls(response: string): string {
  return response.replace(/\[TOOL_CALL\]\s*[\s\S]*?\s*\[\/TOOL_CALL\]/g, '');
}
