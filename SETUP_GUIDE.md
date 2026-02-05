# ChatGPT Clone セットアップガイド

ローカルLLM を使った ChatGPT 風アプリのセットアップ手順です。

## システム要件

- Windows / macOS / Linux
- Node.js 18 以上
- npm または yarn
- Ollama（インストール済み）

---

## ステップ1: Ollama のインストールと起動

### macOS / Linux
```bash
# Ollama をインストール
curl -fsSL https://ollama.ai/install.sh | sh

# Ollama を起動
ollama serve
```

### Windows
1. [ollama.ai](https://ollama.ai) から Windows版をダウンロード
2. インストーラーを実行
3. ターミナルで確認：
```powershell
ollama serve
```

---

## ステップ2: モデルをダウンロード

Ollama が起動している状態で、別のターミナルを開いて実行：

```bash
# gpt-oss-20b をダウンロード（初回は時間がかかります）
ollama pull gpt-oss-20b

# インストール済みモデルを確認
ollama list
```

### 出力例
```
NAME              ID              SIZE    MODIFIED
gpt-oss-20b       2d6e5e38a0e7    13 GB   14 minutes ago
```

---

## ステップ3: Next.js プロジェクトのセットアップ

### 3.1 プロジェクトディレクトリに移動
```bash
cd d:\001_work_dir\003_project
```

### 3.2 依存関係をインストール
```bash
npm install
```

### 3.3 データベースを初期化
```bash
# SQLite データベースを作成
npx prisma migrate dev --name init
```

出力例：
```
Prisma schema loaded
Database is now in sync with your schema
Generated Prisma Client
```

### 3.4 環境変数の確認
`.env` ファイルを確認：

```env
DATABASE_URL="file:./dev.db"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="gpt-oss-20b"
```

---

## ステップ4: 開発サーバーを起動

```bash
npm run dev
```

出力例：
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
- Environments: .env
```

---

## ステップ5: アプリケーションの動作確認

1. ブラウザで `http://localhost:3000` を開く
2. "New Thread" ボタンをクリックして新規スレッドを作成
3. チャット欄にメッセージを入力して送信
4. Ollama から回答が ストリーミング表示されることを確認

---

## トラブルシューティング

### ❌ Error: Port 3000 is already in use

別のアプリケーションが既にポート3000を使用しています。

**解決方法:**
- ポート変更: `npm run dev -- -p 3001`
- または、別のアプリを終了

### ❌ Error: Cannot reach Ollama at http://localhost:11434

Ollama が起動していません。

**確認:**
```bash
# 別ターミナルで Ollama を起動
ollama serve
```

### ❌ Error: Model not found

モデルがダウンロードされていません。

**解決方法:**
```bash
# モデルをダウンロード
ollama pull gpt-oss-20b
```

### ❌ Database error

Prisma でエラーが発生しています。

**解決方法:**
```bash
# データベースをリセット
rm prisma/dev.db
npx prisma migrate dev --name init
```

---

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────┐
│                  Browser (フロントエンド)                   │
│  ChatGPT風UI (React + TypeScript + Tailwind CSS)        │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP
┌──────────────────▼──────────────────────────────────────┐
│              Next.js Server (バックエンド)                │
│  ├── /api/threads     → スレッド管理                    │
│  ├── /api/messages    → メッセージ保存                  │
│  └── /api/chat        → Ollama へのプロキシ          │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP ストリーミング
┌──────────────────▼──────────────────────────────────────┐
│              Ollama Server (LLM推論)                   │
│  gpt-oss-20b による回答生成                             │
└──────────────────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              SQLite Database (永続化)                   │
│  Thread / Message テーブル                              │
└──────────────────────────────────────────────────────────┘
```

---

## データベーススキーマ

### Thread テーブル
```sql
CREATE TABLE threads (
  id        String PRIMARY KEY,
  title     String,
  createdAt DateTime DEFAULT CURRENT_TIMESTAMP,
  updatedAt DateTime
);
```

### Message テーブル
```sql
CREATE TABLE messages (
  id        String PRIMARY KEY,
  threadId  String FOREIGN KEY,
  role      String,  -- "user" or "assistant"
  content   String,
  createdAt DateTime DEFAULT CURRENT_TIMESTAMP
);
```

---

## 本番環境へのデプロイ

### ビルド
```bash
npm run build
```

### 起動
```bash
npm start
```

---

## よくある質問

### Q: モデルを変更したい
`.env` の `OLLAMA_MODEL` を変更してください。
```env
OLLAMA_MODEL="gpt-oss-20b"  # → 別のモデルに変更
```

### Q: Ollama のポートを変更したい
```env
OLLAMA_BASE_URL="http://localhost:11435"  # ポート変更
```

### Q: 会話を削除したい
```bash
# データベースをリセット
rm prisma/dev.db
npx prisma migrate dev --name init
```

---

## 次のステップ

- [ ] マークダウン表示に対応させる
- [ ] コードハイライトを追加
- [ ] ユーザー認証を実装
- [ ] 複数モデル対応
- [ ] UIをカスタマイズ

---

## 参考リンク

- [Ollama 公式](https://ollama.ai)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [Prisma ドキュメント](https://www.prisma.io/docs)
