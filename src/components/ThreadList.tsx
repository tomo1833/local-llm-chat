'use client';

import { Thread } from '@/types';

interface ThreadListProps {
  threads: Thread[];
  currentThread: Thread | null;
  onSelectThread: (thread: Thread) => void;
  onNewThread: () => void;
}

export default function ThreadList({
  threads,
  currentThread,
  onSelectThread,
  onNewThread,
}: ThreadListProps) {
  return (
    <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewThread}
          className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
        >
          + New Thread
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No threads yet. Create one to start!
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                  currentThread?.id === thread.id
                    ? 'bg-gray-200 text-black font-medium'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {thread.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
