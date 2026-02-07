'use client';

import { Thread } from '@/types';

interface ThreadListProps {
  threads: Thread[];
  currentThread: Thread | null;
  onSelectThread: (thread: Thread) => void;
  onNewThread: () => void;
  onDeleteThread: (thread: Thread) => void;
}

export default function ThreadList({
  threads,
  currentThread,
  onSelectThread,
  onNewThread,
  onDeleteThread,
}: ThreadListProps) {
  return (
    <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewThread}
          className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
        >
          + 新しいスレッド
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            まだスレッドがありません。新しく作成してください！
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={`w-full px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  currentThread?.id === thread.id
                    ? 'bg-gray-200 text-black font-medium'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <button
                  onClick={() => onSelectThread(thread)}
                  className="flex-1 text-left truncate"
                >
                  {thread.title}
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteThread(thread);
                  }}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-red-600"
                  aria-label="スレッドを削除"
                  title="削除"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
