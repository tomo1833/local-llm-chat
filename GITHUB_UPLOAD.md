# GitHub へのアップロード手順

## 1. GitHub でリポジトリを作成

1. [github.com](https://github.com) にログイン
2. 右上の **+** → **New repository** をクリック
3. リポジトリ名を入力（例：`chatgpt-ollama-clone`）
4. 説明を入力（オプション）
   ```
   ローカルLLM (Ollama) を使った ChatGPT風チャットアプリケーション。
   Next.js, Prisma, SQLite を使用。
   ```
5. **Public** または **Private** を選択
6. **Create repository** をクリック

---

## 2. ローカルからプッシュ

作成後、GitHub が表示する手順の「…or push an existing repository from the command line」に従います：

```bash
# リモートを追加（YOUR_USERNAMEと YOUR_REPO_NAME を置き換え）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# メインブランチにリネーム（必要に応じて）
git branch -M main

# プッシュ
git push -u origin main
```

---

## 3. SSH キーを使う場合（推奨）

SSH キーが設定済みなら：

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## 4. 既にリモートが設定されている場合

```bash
# 現在のリモートを確認
git remote -v

# リモートを変更
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# プッシュ
git push -u origin main
```

---

## ✅ 確認

プッシュ後、GitHub のリポジトリページで以下を確認：

- ✅ ファイル一覧が表示される
- ✅ `.env` ファイルが含まれていない（`.gitignore` で除外）
- ✅ `README.md` と `SETUP_GUIDE.md` が表示される
- ✅ コミット履歴が表示される

---

## 📌 注意点

- **`.env` ファイルはアップロードされません**（セキュリティのため）
- `.env.example` が代わりにアップロードされます
- 他の開発者は `.env.example` を参考に `.env` を作成します
- `prisma/dev.db` も `.gitignore` に含まれます（ローカルDBのため）

---

## 🔄 今後の更新

変更をコミットしてプッシュ：

```bash
git add .
git commit -m "メッセージ"
git push
```

---

## リポジトリ説明（オプション）

GitHub のリポジトリトップに表示する説明の例：

```markdown
# ChatGPT Clone - Ollama版

ローカルLLM（Ollama）を使用したChatGPTのようなアプリケーション。

## 機能

- ChatGPT風UI（左にスレッド一覧、右にチャット）
- ローカルLLM（Ollama）との連携
- ストリーミング表示対応
- SQLiteで会話を自動保存

## テクノロジー

- Next.js 16 + React 19
- TypeScript + Tailwind CSS
- Prisma ORM + SQLite
- Ollama (gpt-oss-20b)

## セットアップ

詳細は [SETUP_GUIDE.md](SETUP_GUIDE.md) を参照
```
