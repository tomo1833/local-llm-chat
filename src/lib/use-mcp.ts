import { useState, useCallback } from 'react';

export interface SearchResult {
  passwords: Array<{
    id: number;
    site_name: string;
    site_url?: string;
    memo?: string;
  }>;
  diaries: Array<{
    id: number;
    title: string;
    content: string;
    created_at: string;
  }>;
  wikis: Array<{
    id: number;
    title: string;
    content: string;
    created_at: string;
  }>;
  blogs: Array<{
    id: number;
    title: string;
    content: string;
    created_at: string;
  }>;
}

/**
 * MCP サーバーと通信するカスタムフック
 */
export function useMCP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 統合検索
   */
  const search = useCallback(
    async (query: string, limit: number = 5): Promise<SearchResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'search',
            params: { query, limit },
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.data as SearchResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Search error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * 日報を読み込む
   */
  const readDiary = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read_diary',
          params: { id },
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 日報を作成
   */
  const writeDiary = useCallback(async (title: string, content: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'write_diary',
          params: { title, content },
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Wiki を読み込む
   */
  const readWiki = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read_wiki',
          params: { id },
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Wiki を作成
   */
  const writeWiki = useCallback(async (title: string, content: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'write_wiki',
          params: { title, content },
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * パスワードを検索
   */
  const searchPasswords = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search_passwords',
          params: { query },
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    search,
    readDiary,
    writeDiary,
    readWiki,
    writeWiki,
    searchPasswords,
    loading,
    error,
  };
}
