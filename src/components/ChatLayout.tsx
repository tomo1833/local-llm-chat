'use client';

import { useState, useRef, useEffect } from 'react';
import ThreadList from './ThreadList';
import ChatWindow from './ChatWindow';
import { Thread, Message } from '@/types';

export default function ChatLayout() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const res = await fetch('/api/threads');
      const data = await res.json();
      // Ensure data is an array before setting
      if (Array.isArray(data)) {
        setThreads(data);
      } else {
        console.error('Invalid threads data:', data);
        setThreads([]);
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
      setThreads([]);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      const res = await fetch(`/api/threads/${threadId}`);
      const data = await res.json();
      setCurrentThread(data.thread);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewThread = async () => {
    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '新しいスレッド' }),
      });
      const newThread = await res.json();
      setThreads([newThread, ...threads]);
      setCurrentThread(newThread);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const deleteThread = async (thread: Thread) => {
    const confirmed = window.confirm(`「${thread.title}」を削除しますか？`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/threads/${thread.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Failed to delete thread');
      }

      setThreads((prev) => prev.filter((t) => t.id !== thread.id));

      if (currentThread?.id === thread.id) {
        setCurrentThread(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  const sendMessage = async (userMessage: string) => {
    if (!currentThread) return;

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      threadId: currentThread.id,
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    };

    setMessages([...messages, newUserMessage]);
    setLoading(true);

    try {
      // Save user message
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: currentThread.id,
          role: 'user',
          content: userMessage,
        }),
      });

      // Get AI response with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: currentThread.id,
          messages: [...messages, newUserMessage],
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = '';
      const aiMessageId = Date.now().toString();

      // Create initial AI message
      const initialAiMessage: Message = {
        id: aiMessageId,
        threadId: currentThread.id,
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, initialAiMessage]);

      // Stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        aiMessage += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: aiMessage }
              : msg
          )
        );
      }

      // Save AI message
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: currentThread.id,
          role: 'assistant',
          content: aiMessage,
        }),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left sidebar */}
      <ThreadList
        threads={threads}
        currentThread={currentThread}
        onSelectThread={(thread) => {
          setCurrentThread(thread);
          loadThreadMessages(thread.id);
        }}
        onNewThread={createNewThread}
        onDeleteThread={deleteThread}
      />

      {/* Main chat area */}
      <ChatWindow
        currentThread={currentThread}
        messages={messages}
        loading={loading}
        onSendMessage={sendMessage}
      />
    </div>
  );
}
