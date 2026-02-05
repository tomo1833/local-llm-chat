# ChatGPT Clone - Ollama版

ローカルLLM（Ollama）を使用したChatGPTのようなアプリケーション。Next.js + SQLiteで構築されています。

## 機能

- ✅ ChatGPT風UI（左にスレッド一覧、右にチャット画面）
- ✅ ローカルLLM（Ollama）との連携
- ✅ ストリーミング表示（リアルタイムで回答を表示）
- ✅ 会話履歴をSQLiteに自動保存
- ✅ マルチスレッド対応

## 前提条件

- Node.js 18以上
- npm または yarn
- Ollama（http://localhost:11434で起動していること）
- Ollama に `gpt-oss-20b` がインストール済み

## セットアップ

### 1. Ollamaの確認

```bash
# Ollama が起動しているか確認
curl http://localhost:11434/api/tags
```

### 2. プロジェクトの依存関係をインストール

```bash
npm install
```

### 3. Prismaマイグレーション

```bash
npx prisma migrate dev --name init
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## プロジェクト構造

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # Ollama ストリーミングAPI
│   │   ├── threads/       # スレッド管理API
│   │   └── messages/      # メッセージ保存API
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # メインページ
├── components/
│   ├── ChatLayout.tsx     # メインレイアウト
│   ├── ChatWindow.tsx     # チャット表示エリア
│   └── ThreadList.tsx     # スレッド一覧
├── lib/
│   ├── db.ts              # データベース操作
│   └── ollama.ts          # Ollama API連携
├── types/
│   └── index.ts           # TypeScript型定義
prisma/
├── schema.prisma          # データベーススキーマ
└── migrations/            # マイグレーション履歴
```

## 環境変数

`.env` ファイルで設定：

```env
DATABASE_URL="file:./dev.db"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="gpt-oss-20b"
```

## 使用方法

1. **新規スレッドを作成**
   - 左上の "New Thread" ボタンをクリック

2. **メッセージを送信**
   - 右下のテキスト入力欄にメッセージを入力
   - "Send" ボタンをクリック、または Enter キーを押す

3. **スレッドを切り替え**
   - 左のスレッド一覧からスレッドを選択

4. **会話は自動保存**
   - すべての会話はSQLiteデータベースに自動保存されます

## トラブルシューティング

### Ollamaに接続できない
- Ollama が起動しているか確認：`ollama serve`
- ポートが正しいか確認：デフォルトは `http://localhost:11434`
- `.env` の `OLLAMA_BASE_URL` を確認

### モデルが見つからない
- Ollama にモデルをプル：`ollama pull gpt-oss-20b`
- インストール済みモデルを確認：`curl http://localhost:11434/api/tags`

### データベースエラー
- SQLiteデータベースをリセット：`rm prisma/dev.db && npx prisma migrate dev --name init`

## 開発

### ビルド
```bash
npm run build
```

### 本番環境で実行
```bash
npm start
```

### Prisma Studio でDB確認
```bash
npx prisma studio
```

## API仕様

### GET /api/threads
すべてのスレッド一覧を取得

### POST /api/threads
新規スレッドを作成
```json
{
  "title": "スレッドタイトル"
}
```

### GET /api/threads/[id]
特定のスレッドとメッセージを取得

### POST /api/messages
メッセージをデータベースに保存
```json
{
  "threadId": "thread-id",
  "role": "user|assistant",
  "content": "メッセージ内容"
}
```

### POST /api/chat
Ollama からストリーミング応答を取得（Server-Sent Events）
```json
{
  "threadId": "thread-id",
  "messages": [
    { "role": "user", "content": "..." }
  ]
}
```

## テクノロジースタック

- **フロントエンド**: Next.js 16 (App Router) + React 19 + TypeScript
- **スタイル**: Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: SQLite + Prisma ORM
- **LLM**: Ollama (gpt-oss-20b)
- **ストリーミング**: ReadableStream API

## ライセンス

MIT

## 今後の改善予定

- [ ] ユーザー認証
- [ ] Markdown 表示対応
- [ ] コード ハイライト
- [ ] 複数のOllamaモデル対応
- [ ] 会話のエクスポート機能
- [ ] UIダーク/ライトモード切り替え

