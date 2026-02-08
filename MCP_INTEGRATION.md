# local-llm-chat から MCP サーバーに接続する

local-llm-chat から Private Desk MCP サーバーにアクセスするための設定と使用方法です。

## アーキテクチャ

現在の実装では、**HTTP経由でリモートMCPサーバーに接続**しています：

```
ユーザー入力
    ↓
ChatWindow (フロントエンド)
    ↓
/api/chat (Next.js API)
    ↓
Ollama LLM → ツール呼び出し検出
    ↓
tool-executor.ts (HTTP Client)
    ↓
HTTP POST → MCP_SERVER_URL
    ↓
private-desk-mcp-server (Raspberry Pi)
    ↓
結果を取得 → Ollama → ユーザーに返答
```

## セットアップ

### 1. 環境変数を設定

`.env` ファイルに MCP サーバーのURLを設定：

```env
# MCP サーバー（HTTP接続）
MCP_SERVER_URL=http://192.168.0.15:3001
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

## ツール実行の仕組み

### 主要ファイル

1. **tool-executor.ts** - MCPツール実行エンジン
   - `initializeMCP()`: MCPサーバーとハンドシェイク
   - `executeToolCall()`: ツールを実行
   - グローバルセッション管理

2. **tools.ts** - ツール定義
   - `MCP_TOOLS`: 利用可能なツール一覧
   - `generateSystemPrompt()`: LLM用のシステムプロンプト生成

3. **chat/route.ts** - チャットAPIエンドポイント
   - Ollamaからのレスポンスをストリーミング
   - ツール呼び出しを検出・実行
   - 結果をLLMに戻して最終回答を生成

## MCP プロトコルの流れ

### 1. 初期化（セッション確立）

```typescript
POST http://192.168.0.15:3001/mcp
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": { "name": "Private Desk MCP Client", "version": "1.0.0" }
  }
}
// レスポンス: Mcp-Session-Id ヘッダーを取得
```

### 2. 初期化完了通知

```typescript
POST http://192.168.0.15:3001/mcp
Headers: { "Mcp-Session-Id": "..." }
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "notifications/initialized",
  "params": {}
}
```

### 3. ツール呼び出し

```typescript
POST http://192.168.0.15:3001/mcp
Headers: { "Mcp-Session-Id": "..." }
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "search_private_desk",
    "arguments": { "query": "日報", "limit": 5 }
  }
}
```

## 利用可能なツール

### 1. search_private_desk - 統合検索

Private Desk 全体（日報、ウィキ、ブログ）を統合検索します。

**パラメータ:**
- `query` (string, 必須): 検索キーワード
- `limit` (number): 最大結果数（デフォルト: 5）

### 2. read_diary - 日報を読み込む

指定IDの日報を読み込みます。

**パラメータ:**
- `id` (number, 必須): 日報ID

### 3. write_diary - 日報を作成

新しい日報を作成します。

**パラメータ:**
- `title` (string, 必須): 日報のタイトル
- `content` (string, 必須): 日報の内容

### 4. read_wiki - ウィキを読み込む

指定IDのウィキページを読み込みます。

**パラメータ:**
- `id` (number, 必須): ウィキページID

## 使用例

チャットでLLMに以下のように指示すると、自動的にツールが呼び出されます：

```
ユーザー: 「最近の日報を検索してください」
→ LLMが search_private_desk ツールを呼び出し
→ 結果を基に回答を生成
```

## ~~React で使用~~

**注意**: `useMCP()` フックは削除されました。現在はLLMを介したツール呼び出しのみサポートしています。

## 利用可能なアクション（非推奨）

以下のセクションは古い実装に関するものです。現在は tool-executor.ts を使用してください。

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

## トラブルシューティング

### MCP サーバーに接続できない

MCPサーバーが起動しているか確認：

```bash
# Raspberry Piで確認
curl http://192.168.0.15:3001/health

# または、ローカルで
curl http://localhost:3001/health
```

### セッションエラー: "Server not initialized"

セッションが無効化された場合、自動的に再初期化を試みます。それでも解決しない場合：

1. MCPサーバーを再起動
2. local-llm-chat の開発サーバーを再起動

### エラー: "Database connection failed"

MCPサーバーの `PRIVATE_DESK_DB_PATH` が正しいか確認：

```bash
# MCP サーバーの .env を確認
cat /path/to/private-desk-mcp-server/.env
```

### タイムアウトエラー

tool-executor.ts のタイムアウトはデフォルト30秒です。必要に応じて調整してください。

## パフォーマンス最適化

### セッションの永続化

開発モードのホットリロードに対応するため、セッションIDは `global` スコープで管理されています。

### キャッシング

頻繁にアクセスされるデータはMCPサーバー側でキャッシュされます。

## セキュリティ

### パスワード情報

`search_private_desk` は以下の情報を **返しません**：

- 実際のパスワード
- ログイン ID（一部）
- メールアドレス（一部）

これはセキュリティ上の制限です。

## 関連リソース

- [MCP Server README](../../private-desk-mcp-server/README.md)
- [Private Desk リポジトリ](https://github.com/tomo1833/private-desk)
- [Model Context Protocol](https://spec.modelcontextprotocol.io/)
