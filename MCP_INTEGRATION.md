# local-llm-chat から MCP サーバーに接続する

local-llm-chat から Private Desk MCP サーバーにアクセスするための設定と使用方法です。

## セットアップ

### 1. 環境変数を設定

`.env` ファイルに MCP サーバーのパスを設定：

```env
# Raspberry Pi 本番環境
MCP_SERVER_PATH=/home/pi/projects/private-desk-mcp-server/dist/index.js

# または開発環境（Windows/Linux）
MCP_SERVER_PATH=../private-desk-mcp-server/dist/index.js
```

### 2. パッケージの依存関係を確認

local-llm-chat の `package.json` に以下が含まれていることを確認：

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0"
  }
}
```

## API エンドポイント

### GET /api/mcp

MCP サーバーの接続状態を確認します。

**レスポンス:**
```json
{
  "status": "connected",
  "mcpServer": "/home/pi/projects/private-desk-mcp-server/dist/index.js"
}
```

### POST /api/mcp

MCP サーバーにアクション（ツール実行）を送信します。

**リクエスト形式:**
```json
{
  "action": "search",
  "params": {
    "query": "プロジェクト",
    "limit": 5
  }
}
```

## 利用可能なアクション

### 1. 統合検索

```json
{
  "action": "search",
  "params": {
    "query": "検索キーワード",
    "limit": 5
  }
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "passwords": [...],
    "diaries": [...],
    "wikis": [...],
    "blogs": [...]
  }
}
```

### 2. 日報を読み込む

```json
{
  "action": "read_diary",
  "params": {
    "id": 123
  }
}
```

### 3. 日報を作成

```json
{
  "action": "write_diary",
  "params": {
    "title": "2026年2月5日の日報",
    "content": "本日の作業内容..."
  }
}
```

### 4. Wiki を読み込む

```json
{
  "action": "read_wiki",
  "params": {
    "id": 456
  }
}
```

### 5. Wiki を作成

```json
{
  "action": "write_wiki",
  "params": {
    "title": "開発環境の構築",
    "content": "手順..."
  }
}
```

### 6. ブログを読み込む

```json
{
  "action": "read_blog",
  "params": {
    "id": 789
  }
}
```

### 7. ブログを作成

```json
{
  "action": "write_blog",
  "params": {
    "title": "リリースノート",
    "content": "本文テキスト",
    "contentMarkdown": "# リリース\n...",
    "contentHtml": "<h1>リリース</h1>...",
    "eyecatch": "https://example.com/image.jpg",
    "permalink": "release-note-2026-02",
    "site": "example.com",
    "author": "author-id",
    "persona": "persona-id"
  }
}
```

### 8. パスワード検索

```json
{
  "action": "search_passwords",
  "params": {
    "query": "GitHub"
  }
}
```

## React で使用

カスタムフック `useMCP()` を利用：

```tsx
import { useMCP } from '@/lib/use-mcp';

export function MyComponent() {
  const { search, readDiary, writeDiary, loading, error } = useMCP();

  const handleSearch = async () => {
    const results = await search('プロジェクト', 5);
    console.log('Search results:', results);
  };

  const handleWriteDiary = async () => {
    const result = await writeDiary('タイトル', '本文...');
    console.log('Diary created:', result);
  };

  return (
    <div>
      <button onClick={handleSearch} disabled={loading}>
        {loading ? '検索中...' : '検索'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

## トラブルシューティング

### MCP サーバーに接続できない

```bash
# MCP サーバーが起動しているか確認
node /path/to/private-desk-mcp-server/dist/index.js
```

### エラー: "Cannot find module"

MCP サーバーがビルドされているか確認：

```bash
cd /path/to/private-desk-mcp-server
npm run build
```

### エラー: "Database connection failed"

`PRIVATE_DESK_DB_PATH` が正しいか確認：

```bash
# MCP サーバーの .env を確認
cat /path/to/private-desk-mcp-server/.env
```

### タイムアウトエラー

MCP サーバーのレスポンス時間が長い場合、`MCP_REQUEST_TIMEOUT` を設定：

```env
MCP_REQUEST_TIMEOUT=60000  # 60秒
```

## パフォーマンス最適化

### キャッシング（例）

```tsx
const cache = new Map();

async function cachedSearch(query: string) {
  if (cache.has(query)) {
    return cache.get(query);
  }
  
  const result = await search(query);
  cache.set(query, result);
  return result;
}
```

### 大量データ処理

```json
{
  "action": "search",
  "params": {
    "query": "キーワード",
    "limit": 3  // 最初は少なく取得
  }
}
```

## セキュリティ

### パスワード情報

`search_passwords` は以下の情報を **返しません**：

- 実際のパスワード
- ログイン ID（一部）
- メールアドレス（一部）

これはセキュリティ上の制限です。

### API エンドポイントの保護

本番環境では API エンドポイントを認証で保護することを推奨：

```tsx
// 例: 認証ミドルウェア
export async function POST(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth || auth !== `Bearer ${process.env.API_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // ... 既存のコード
}
```

## 関連リソース

- [MCP Server README](../../private-desk-mcp-server/README.md)
- [Private Desk リポジトリ](https://github.com/tomo1833/private-desk)
- [Model Context Protocol](https://spec.modelcontextprotocol.io/)
