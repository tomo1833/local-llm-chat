import { streamOllamaResponse } from '@/lib/ollama';
import { getMessages } from '@/lib/db';
import { extractToolCalls, maskToolCalls } from '@/lib/tools';
import { executeToolCalls, formatToolResults } from '@/lib/tool-executor';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { threadId, messages } = await request.json();

    console.log('[API/Chat] チャットリクエスト受信:', {
      timestamp: new Date().toISOString(),
      threadId,
      messageCount: messages?.length || 0,
      messagesPreview: messages?.slice(-2).map((m: any) => ({
        role: m.role,
        contentLength: m.content?.length || 0,
      })),
    });

    if (!threadId || !messages) {
      console.error('[API/Chat] 必須パラメータ不足:', {
        timestamp: new Date().toISOString(),
        threadIdSet: !!threadId,
        messagesSet: !!messages,
      });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the Ollama response with streaming
    const ollamaResponse = await streamOllamaResponse(messages);

    // Create a ReadableStream that processes the Ollama response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaResponse.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let chunkCount = 0;
        let fullResponseText = '';
        const toolCallsFromStream: any[] = [];
        let pendingOutput = '';

        if (!reader) {
          console.error('[API/Chat] Ollamaレスポンスボディが無い:', {
            timestamp: new Date().toISOString(),
          });
          controller.close();
          return;
        }

        try {
          // ストリーミングレスポンスを全て集める
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunkCount++;
            const text = decoder.decode(value);
            buffer += text;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const json = JSON.parse(line);
                  if (json.message) {
                    // tool_calls があればそれを保存
                    if (json.message.tool_calls) {
                      toolCallsFromStream.push(...json.message.tool_calls);
                      console.log('[API/Chat] tool_calls検出:', {
                        timestamp: new Date().toISOString(),
                        toolCalls: json.message.tool_calls,
                      });
                    } else if (json.message.content && json.message.content.trim()) {
                      // content があれば通常の回答として使用
                      fullResponseText += json.message.content;
                      const displayContent = maskToolCalls(json.message.content);
                      if (displayContent.trim()) {
                        pendingOutput += displayContent;
                      }
                    }
                  }
                } catch (e) {
                  // Skip invalid JSON lines
                }
              }
            }
          }

          // 最後のバッファを処理
          if (buffer.trim()) {
            try {
              const json = JSON.parse(buffer);
              if (json.message?.tool_calls) {
                toolCallsFromStream.push(...json.message.tool_calls);
              } else if (json.message?.content) {
                fullResponseText += json.message.content;
              }
            } catch (e) {
              // Skip invalid JSON tail
            }
          }

          console.log('[API/Chat] Ollamaストリーミング完了:', {
            timestamp: new Date().toISOString(),
            threadId,
            chunkCount,
            fullResponseLength: fullResponseText.length,
            fullResponsePreview: fullResponseText.substring(0, 300),
            toolCallsCount: toolCallsFromStream.length,
          });

          // ツール呼び出しを抽出して実行
          const toolCalls = extractToolCalls(fullResponseText);
          
          // tool_callsがあればそれをツール呼び出しとして使用
          let finalToolCalls = toolCalls;
          if (finalToolCalls.length === 0 && toolCallsFromStream.length > 0) {
            finalToolCalls = toolCallsFromStream.map((tc: any) => {
              const name = tc.function?.name || tc.name;
              const args = tc.function?.arguments || tc.arguments || {};
              
              // 引数がJSON文字列の場合はパースする
              let params = args;
              if (typeof args === 'string') {
                try {
                  params = JSON.parse(args);
                } catch (e) {
                  params = args;
                }
              }
              
              // パラメータの検証とデフォルト値設定
              const toolName = name === 'search_diary' ? 'search_private_desk' : name;
              if (toolName === 'search_private_desk' && typeof params === 'object') {
                if (!params.query) {
                  params.query = messages[0]?.content || '最近'; // ユーザーメッセージまたはデフォルト
                }
                if (!params.limit) {
                  params.limit = 5;
                }
              }
              
              return {
                name,
                params,
              };
            });
          }
          
          console.log('[API/Chat] ツール呼び出し抽出処理:', {
            timestamp: new Date().toISOString(),
            detectedCount: finalToolCalls.length,
            tools: finalToolCalls.map((t) => ({ 
              name: t.name, 
              params: JSON.stringify(t.params).substring(0, 150),
              paramsKeys: typeof t.params === 'object' ? Object.keys(t.params) : [],
            })),
            fullResponse: fullResponseText.substring(0, 300),
          });

          if (finalToolCalls.length > 0) {
            console.log('[API/Chat] ツール呼び出し検出のため、初回ストリーム出力は抑制:', {
              timestamp: new Date().toISOString(),
              pendingOutputLength: pendingOutput.length,
            });
            console.log('[API/Chat] ツール呼び出し実行開始:', {
              timestamp: new Date().toISOString(),
              count: finalToolCalls.length,
              tools: finalToolCalls.map((t) => t.name),
            });

            // ツールを実行
            const toolResults = await executeToolCalls(finalToolCalls);
            const formattedResults = formatToolResults(toolResults);

            console.log('[API/Chat] ツール実行完了:', {
              timestamp: new Date().toISOString(),
              toolCount: finalToolCalls.length,
              results: Array.from(toolResults.entries()).map(([key, result]) => ({
                key,
                success: result.success,
                error: result.error,
              })),
            });

            console.log('[API/Chat] 再度LLM呼び出し開始:', {
              timestamp: new Date().toISOString(),
              toolCount: finalToolCalls.length,
              formattedResultsPreview: formattedResults.substring(0, 200),
            });

            // ツール結果を含めて再度LLM呼び出し
            const updatedMessages = [
              ...messages,
              { role: 'assistant', content: fullResponseText },
              {
                role: 'user',
                content: `ツール呼び出しの結果:\n${formattedResults}\n\nこの結果に基づいて、ユーザーへの最終回答をしてください。[TOOL_CALL]ブロックは表示しないでください。`,
              },
            ];

            const finalResponse = await streamOllamaResponse(updatedMessages);
            const finalReader = finalResponse.body?.getReader();
            const finalDecoder = new TextDecoder();
            let finalBuffer = '';
            let finalChunkCount = 0;

            console.log('[API/Chat] 再度LLM呼び出し成功（ストリーミング開始）:', {
              timestamp: new Date().toISOString(),
            });

            if (finalReader) {
              while (true) {
                const { done, value } = await finalReader.read();
                if (done) break;

                finalChunkCount++;
                const text = finalDecoder.decode(value);
                finalBuffer += text;
                const lines = finalBuffer.split('\n');
                finalBuffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.trim()) {
                    try {
                      const json = JSON.parse(line);
                      if (json.message?.content) {
                        controller.enqueue(json.message.content);
                      }
                    } catch (e) {
                      // Skip invalid JSON lines
                    }
                  }
                }
              }

              if (finalBuffer.trim()) {
                try {
                  const json = JSON.parse(finalBuffer);
                  if (json.message?.content) {
                    controller.enqueue(json.message.content);
                  }
                } catch (e) {
                  // Skip invalid JSON tail
                }
              }

              console.log('[API/Chat] 再度LLM呼び出しストリーミング完了:', {
                timestamp: new Date().toISOString(),
                finalChunkCount,
              });
            } else {
              console.error('[API/Chat] 再度LLMのレスポンスボディが無い:', {
                timestamp: new Date().toISOString(),
              });
            }
          } else {
            if (pendingOutput.trim()) {
              controller.enqueue(pendingOutput);
            }
            console.log('[API/Chat] ツール呼び出し無し - そのまま結果を返す:', {
              timestamp: new Date().toISOString(),
              reason: 'No tool calls detected in response',
            });
          }
        } catch (error) {
          console.error('[API/Chat] ストリーミングエラー:', {
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
            chunkCount,
          });
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    console.log('[API/Chat] ストリーミングレスポンス送信開始:', {
      timestamp: new Date().toISOString(),
      threadId,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('[API/Chat] チャットAPIエラー:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
