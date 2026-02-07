# ログ出力実装レポート

## 概要
LLM（Ollama）のクエリとMCPサーバーへのアクセスに関する詳細なログ出力を実装しました。

---

## 実装内容

### 1. **Ollama LLM ログ出力** (`src/lib/ollama.ts`)
- **リクエスト送信時**: モデル、メッセージ数、メッセージプレビューをログ出力
- **エラー時**: HTTPステータスとエラーメッセージをログ出力
- **成功時**: ストリーミング開始確認のログを出力

```log
[Ollama] LLM問い合わせを送信: {
  timestamp: "2026-02-06T...",
  endpoint: "http://localhost:11434/api/chat",
  model: "gpt-oss:20b",
  messageCount: 2,
  messages: [...]
}
```

---

### 2. **MCPクライアント ログ出力** (`src/lib/mcp-client.ts`)

#### 接続処理
- **接続開始**: サーバーパスをログ出力
- **接続成功**: 接続確立をログ出力
- **接続失敗**: エラーメッセージと詳細をログ出力

```log
[MCP] MCPサーバーに接続中: { serverPath: "..." }
[MCP] MCPサーバーに接続成功: {}
```

#### リクエスト・レスポンス処理
- **リクエスト送信**: メソッド、ID、パラメータプレビューをログ出力
- **レスポンス受信**: ID、エラー有無、結果プレビューをログ出力
- **タイムアウト**: タイムアウト発生とメソッド情報をログ出力
- **エラー**: 詳細なエラーメッセージをログ出力

```log
[MCP] MCPリクエスト送信: {
  id: 1,
  method: "tools/call",
  params: "{...}"
}
[MCP] MCPレスポンス受信: {
  id: 1,
  method: "tools/call",
  hasError: false
}
```

---

### 3. **MCP APIエンドポイント ログ出力** (`src/app/api/mcp/route.ts`)

#### リクエスト処理
- **リクエスト受信**: アクション、パラメータをログ出力
- **MCP設定確認**: URL/パス設定状態をログ出力
- **設定エラー**: 設定不足エラーをログ出力

```log
[API/MCP] MCPリクエスト受信: {
  action: "search",
  params: "{\"query\": \"...\"}"
}
[API/MCP] MCP設定: {
  mcpServerUrlSet: true,
  mcpServerPathSet: false
}
```

#### サーバーアクセス（2モード対応）
- **HTTP モード** (MCP_SERVER_URL): HTTPエンドポイントへのリクエスト
- **プロセス モード** (MCP_SERVER_PATH): ローカルプロセス経由でのリクエスト

```log
[API/MCP] MCPサーバー(HTTP)へ検索リクエスト送信: {
  endpoint: "http://192.168.0.15:3001/tools/call",
  query: "...",
  limit: 5
}
```

#### レスポンス処理
- **成功時**: 結果プレビューをログ出力
- **エラー時**: エラーメッセージ、HTTPステータス、スタックトレースをログ出力

---

### 4. **チャット API ログ出力** (`src/app/api/chat/route.ts`)

- **リクエスト受信**: threadId、メッセージ数、最新メッセージプレビューをログ出力
- **パラメータ検証**: 不足するパラメータをログ出力
- **ストリーミング処理**: 処理済みチャンク数、完了時刻をログ出力
- **エラー処理**: 詳細なエラー情報とスタックトレースをログ出力

```log
[API/Chat] チャットリクエスト受信: {
  threadId: "...",
  messageCount: 2,
  messagesPreview: [...]
}
[API/Chat] Ollamaストリーミング完了: {
  threadId: "...",
  chunkCount: 42
}
```

---

## 環境設定 (`.env`)

現在の設定状況:
```
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="gpt-oss:20b"
MCP_SERVER_URL=http://192.168.0.15:3001
```

### MCP サーバーへのアクセス状態
✅ **MCP_SERVER_URL が設定済み** → **HTTPモード**で動作中

- **エンドポイント**: `http://192.168.0.15:3001`
- **アクセス方式**: HTTP POST リクエスト
- **利用可能なアクション**:
  - `search`: 統合検索
  - `read_diary`: 日報読み込み
  - `write_diary`: 日報書き込み
  - その他のツール

---

## ログの確認方法

### サーバー実行時のコンソール出力
```bash
npm run dev
# または
yarn dev
```

### ログの見かた
すべてのログは以下のプレフィックスで分類されます:
- `[Ollama]`: LLM（Ollama）関連
- `[MCP]`: MCPクライアント関連
- `[API/MCP]`: MCPサーバーAPI関連
- `[API/Chat]`: チャットAPI関連

### 例: 検索リクエストの全フロー
```
[API/MCP] MCPリクエスト受信: { action: "search", ... }
[API/MCP] MCP設定: { mcpServerUrlSet: true, ... }
[API/MCP] MCPサーバー(HTTP)へ検索リクエスト送信: { endpoint: "...", ... }
[API/MCP] MCPサーバー(HTTP)レスポンス受信: { resultPreview: "..." }
[API/MCP] レスポンス送信: { success: true, ... }
```

---

## トラブルシューティング

### MCP サーバーに接続できない場合
```log
[API/MCP] MCP設定エラー: { error: "MCP_SERVER_URL or MCP_SERVER_PATH is not set" }
```
→ `.env` ファイルで `MCP_SERVER_URL` または `MCP_SERVER_PATH` を設定してください

### Ollama に接続できない場合
```log
[Ollama] LLM問い合わせエラー: { status: 500, statusText: "..." }
```
→ Ollama が `http://localhost:11434` で起動しているか確認してください

### タイムアウトエラー
```log
[MCP] MCPリクエストタイムアウト: { id: 1, method: "..." }
```
→ MCPサーバーの応答が遅い、またはサーバーが不応答の可能性があります

---

## ログレベル

すべてのログは `console.log()` または `console.error()` を使用しています：
- **Info**: `console.log()` で `[Prefix]` を含めて出力
- **Error**: `console.error()` で `[Prefix]` を含めて出力

---

## 今後の改善案

1. **本格的なロギングライブラリの導入** (例: Winston, Pino)
   - ファイルへのログ保存
   - ログレベル管理 (DEBUG, INFO, WARN, ERROR)
   - タイムスタンプの自動化

2. **パフォーマンスモニタリング**
   - レスポンス時間の記録
   - リクエスト/レスポンスサイズの記録

3. **構造化ログ** (JSON形式)
   - ログ分析ツール (Splunk, DataDog 等) との連携
   - 検索・フィルタリングの効率化
