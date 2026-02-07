# タスク管理アプリ

## 概要

このプロジェクトは、React、TypeScript、Viteを使用して構築されたタスク管理アプリケーションです。ユーザーはタスクの作成、表示、管理を行うことができます。

**プラットフォーム:**
- **Webアプリ** (`ui/`): ブラウザで動作するWebアプリケーション
- **Androidアプリ** (`android/`): Kotlin + Jetpack Compose で構築されたネイティブAndroidアプリ

## デプロイ

このアプリケーションは以下のURLでデプロイされています：
https://tryjunie.vercel.app/

## 機能

- タスク一覧：タスクの統計情報（合計見積もり時間や計算された終了時刻など）がタスク一覧ページに表示されます。すべてのタスクを表示します。
- タスク詳細：タスクの詳細（タイトル、見積もり時間（分））はタスク一覧内でインラインで編集可能です。専用のタスク詳細ページはありません。
- タスク作成：新しいタスクを作成
- インテグレーションキー管理：このページでインテグレーションキーを管理できます。

## 技術スタック

### Webアプリ (`ui/`)
- **フロントエンド**：React、TypeScript
- **ルーティング**：React Router
- **スタイリング**：Tailwind CSS
- **UIコンポーネント**：Radix UI
- **アイコン**：Lucide React
- **ビルドツール**：Vite

### Androidアプリ (`android/`)
- **言語**：Kotlin
- **UIフレームワーク**：Jetpack Compose
- **アーキテクチャ**：MVVM + Repository パターン
- **依存性注入**：Hilt
- **バックエンド**：Supabase Kotlin SDK

## プロジェクト構成

```
tryjunie/
├── ui/              # Webアプリケーション
├── android/         # Androidモバイルアプリ
├── supabase/        # Supabaseバックエンド設定
└── mcp/             # Model Context Protocol ブリッジ
```

## インストール方法

### Webアプリ (`ui/`)

#### 前提条件

- Node.js (バージョン14以上)
- npm または yarn

#### セットアップ手順

1. リポジトリをクローンする

   ```bash
   git clone [ここにリポジトリのURLを挿入してください]
   cd tryjunie
   ```

2. UI ディレクトリに移動して依存関係をインストールする

   ```bash
   cd ui
   npm install --legacy-peer-deps
   # または
   yarn install
   ```

3. 開発サーバーを起動する

   ```bash
   npm run dev
   # または
   yarn dev
   ```

4. ブラウザで以下のURLにアクセスする
   ```
   http://localhost:5173
   ```

### Androidアプリ (`android/`)

Androidアプリのセットアップと実行方法については、[android/README.md](android/README.md) を参照してください。

## 使用方法

- **タスク一覧ページ**: アプリケーションのメインページです。特定の日付のタスクを表示し、タスクの並び替え、編集、削除が可能です。また、タスクの総見積もり時間などの統計もここに表示されます。
- **タスクのクイック追加**: タスク一覧ページの上部にある入力フィールドから、新しいタスクを迅速に追加できます。
- **タスクのインライン編集**: 各タスクのタイトルや見積もり時間は、一覧内で直接クリックして編集できます。
- **インテグレーションキー管理**: ナビゲーションメニューからアクセスし、外部サービスとの連携に使用するAPIキーなどを管理します。

## 開発コマンド

### Webアプリ (`ui/`)

- `npm run dev`：開発サーバーを起動します
- `npm run build`：プロダクション用にアプリケーションをビルドします
- `npm run lint`：ESLintを使用してコードをリントします
- `npm run preview`：ビルドされたアプリケーションをプレビューします

### Androidアプリ (`android/`)

Kotlin と Jetpack Compose で構築されたネイティブAndroidアプリです。

**前提条件:**
- Android Studio Hedgehog (2023.1.1) 以上
- JDK 17 以上
- Android SDK

**セットアップ:**
1. Android Studio で `android/` ディレクトリを開く
2. `local.properties` に Supabase の設定を追加
3. Gradle Sync を実行
4. エミュレーターまたは実機で実行

詳細は [android/README.md](android/README.md) を参照してください。

## ライセンス

このプロジェクトはプライベートであり、特定のライセンスの下で配布されていません。
