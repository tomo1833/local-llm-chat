'use client';

import { useState, useRef, useEffect } from 'react';
import { Thread, Message } from '@/types';

interface ChatWindowProps {
  currentThread: Thread | null;
  messages: Message[];
  loading: boolean;
  onSendMessage: (message: string) => void;
  selectedModel: string;
  modelOptions: Array<{
    name: string;
    parameterSize?: string | null;
    family?: string | null;
    quantization?: string | null;
  }>;
  onSelectModel: (model: string) => void;
  onRefreshModels: () => void;
  isModelPinned: boolean;
  onToggleModelPin: () => void;
  warnOnModelSwitch: boolean;
}

export default function ChatWindow({
  currentThread,
  messages,
  loading,
  onSendMessage,
  selectedModel,
  modelOptions,
  onSelectModel,
  onRefreshModels,
  isModelPinned,
  onToggleModelPin,
  warnOnModelSwitch,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [ollamaModel, setOllamaModel] = useState<string>('gpt-oss:20b');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let active = true;
    fetch('/api/ollama/status')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setOllamaStatus(data.status === 'connected' ? 'connected' : 'disconnected');
        if (typeof data.model === 'string' && data.model.trim().length > 0) {
          setOllamaModel(data.model);
        }
      })
      .catch(() => {
        if (!active) return;
        setOllamaStatus('disconnected');
      });
    return () => {
      active = false;
    };
  }, []);

  const modelInfo = (model: string) => {
    const info = modelOptions.find((m) => m.name === model);
    if (!info) return { badge: 'General', detail: null };
    const param = info.parameterSize ? info.parameterSize.toUpperCase() : null;
    const family = info.family ? info.family.toUpperCase() : null;
    const quant = info.quantization ? info.quantization.toUpperCase() : null;
    const badge = param || (family ? family : 'General');
    const detail = quant || family;
    return { badge, detail };
  };

  const handleSendMessage = () => {
    if (!input.trim() || !currentThread) return;

    onSendMessage(input);
    setInput('');
  };

  if (!currentThread) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-slate-100">
        <div className="text-center max-w-2xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/70 px-3 py-1 text-xs font-medium text-amber-800 shadow-sm">
            Local • Private • Fast
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            ローカルLLMチャットへようこそ
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            端末内で完結するローカルLLMチャットです。左のサイドバーから新しいスレッドを作成するか、
            既存のスレッドを選択してすぐに対話を始められます。
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs">
            <span className="text-slate-500">モデル状態:</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                ollamaStatus === 'connected'
                  ? 'bg-emerald-100 text-emerald-700'
                  : ollamaStatus === 'disconnected'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {ollamaStatus === 'connected'
                ? 'Ollama 稼働中'
                : ollamaStatus === 'disconnected'
                  ? 'Ollama 未接続'
                  : '確認中'}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
              {ollamaModel}
            </span>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-700">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-white">ローカル推論</span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">データは端末内</span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">軽量UI</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm" />
          <div>
            <div className="text-sm font-semibold text-slate-900">ローカルLLMチャット</div>
            <div className="text-xs text-slate-500">Private • Local • Fast</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedModel}
            onChange={(e) => {
              const next = e.target.value;
              if (warnOnModelSwitch && selectedModel && next !== selectedModel) {
                const confirmed = window.confirm('モデルを切り替えますか？');
                if (!confirmed) {
                  e.target.value = selectedModel;
                  return;
                }
              }
              onSelectModel(next);
            }}
            className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="モデル選択"
          >
            {(modelOptions.length > 0 ? modelOptions.map((m) => m.name) : [ollamaModel]).map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onToggleModelPin}
            className={`rounded-full px-2.5 py-1 text-xs ring-1 ${
              isModelPinned
                ? 'bg-amber-100 text-amber-800 ring-amber-200'
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
            aria-label="モデルをこのスレッドに固定"
            title={isModelPinned ? '固定解除' : 'このスレッドに固定'}
          >
            固定
          </button>
          <button
            type="button"
            onClick={onRefreshModels}
            className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            aria-label="モデル一覧を更新"
            title="モデル一覧を更新"
          >
            更新
          </button>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              ollamaStatus === 'connected'
                ? 'bg-emerald-100 text-emerald-700'
                : ollamaStatus === 'disconnected'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
            }`}
          >
            {ollamaStatus === 'connected'
              ? 'Ollama 稼働中'
              : ollamaStatus === 'disconnected'
                ? 'Ollama 未接続'
                : '確認中'}
          </span>
          {(() => {
            const info = modelInfo(selectedModel || ollamaModel);
            return (
              <>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800 ring-1 ring-amber-200">
                  {info.badge}
                </span>
                {info.detail && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                    {info.detail}
                  </span>
                )}
              </>
            );
          })()}
          {isModelPinned && (
            <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-amber-200">
              このスレッド固定
            </span>
          )}
          <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
            {selectedModel || ollamaModel}
          </span>
        </div>
      </div>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white via-white to-slate-50/60">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-2xl px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-slate-900 text-white rounded-br-none shadow-sm'
                  : 'bg-white text-slate-900 rounded-bl-none shadow-sm ring-1 ring-slate-200'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-40 rounded-full bg-white px-2 py-2 shadow-sm ring-1 ring-slate-200">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-2 w-2/3 animate-pulse rounded-full bg-gradient-to-r from-amber-300 via-slate-900 to-amber-300" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 bg-white/80 p-6">
        <div className="flex gap-3 items-end">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="ローカルLLMに話しかける..."
            disabled={loading}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:bg-slate-400 text-sm font-medium shadow-sm"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
