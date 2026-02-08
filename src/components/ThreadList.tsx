'use client';

import { Thread } from '@/types';
import { useState } from 'react';

interface ThreadListProps {
  threads: Thread[];
  currentThread: Thread | null;
  onSelectThread: (thread: Thread) => void;
  onNewThread: () => void;
  onDeleteThread: (thread: Thread) => void;
  onRenameThread: (thread: Thread, title: string) => void;
  threadSort: 'updated' | 'created';
  onChangeThreadSort: (sort: 'updated' | 'created') => void;
  pinnedModels: Record<string, string>;
}

export default function ThreadList({
  threads,
  currentThread,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onRenameThread,
  threadSort,
  onChangeThreadSort,
  pinnedModels,
}: ThreadListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  const startEdit = (thread: Thread) => {
    setEditingId(thread.id);
    setDraftTitle(thread.title);
  };

  const commitEdit = (thread: Thread) => {
    const nextTitle = draftTitle.trim();
    setEditingId(null);
    if (!nextTitle || nextTitle === thread.title) return;
    onRenameThread(thread, nextTitle);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftTitle('');
  };

  return (
    <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="mb-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-4 py-3 text-white shadow-sm">
          <div className="text-xs uppercase tracking-widest text-slate-200">
            Local LLM
          </div>
          <div className="text-lg font-semibold tracking-tight">
            ローカルLLMチャット
          </div>
        </div>
        <button
          onClick={onNewThread}
          className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium"
        >
          + 新規チャット
        </button>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span>並び替え</span>
          <button
            onClick={() => onChangeThreadSort('updated')}
            className={`rounded-full px-2 py-1 ring-1 ${
              threadSort === 'updated'
                ? 'bg-slate-900 text-white ring-slate-900'
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            更新順
          </button>
          <button
            onClick={() => onChangeThreadSort('created')}
            className={`rounded-full px-2 py-1 ring-1 ${
              threadSort === 'created'
                ? 'bg-slate-900 text-white ring-slate-900'
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            作成順
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            まだチャットがありません。新規チャットを作成してください。
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={`w-full px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  currentThread?.id === thread.id
                    ? 'bg-white text-slate-900 font-medium shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                }`}
              >
                {editingId === thread.id ? (
                  <input
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        commitEdit(thread);
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        cancelEdit();
                      }
                    }}
                    onBlur={() => commitEdit(thread)}
                    className="flex-1 truncate rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    autoFocus
                    aria-label="スレッド名を編集"
                  />
                ) : (
                  <button
                    onClick={() => onSelectThread(thread)}
                    onDoubleClick={() => startEdit(thread)}
                    className="flex-1 text-left truncate"
                  >
                    {thread.title}
                  </button>
                )}
                {pinnedModels[thread.id] && (
                  <span
                    className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800 ring-1 ring-amber-200"
                    title={`固定モデル: ${pinnedModels[thread.id]}`}
                  >
                    固定
                  </span>
                )}
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    startEdit(thread);
                  }}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-slate-700"
                  aria-label="スレッド名を編集"
                  title="編集"
                >
                  ✎
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteThread(thread);
                  }}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-rose-600"
                  aria-label="チャットを削除"
                  title="削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
