# タスク管理アプリ - Android版

このディレクトリには、タスク管理アプリのAndroid向けモバイルアプリケーションが含まれています。

## 概要

Capacitorを使用して、既存のReact UIをAndroidネイティブアプリとしてパッケージ化しています。
機能は `ui/` フォルダのWebアプリと同じです：

- タスク一覧の表示と管理
- タスクの作成・編集・削除
- ドラッグ&ドロップでの並び替え
- インテグレーションキー管理
- 認証機能（ログイン・登録）

## 前提条件

### 必須
- Node.js (v14以上)
- npm または yarn
- Android Studio (最新版推奨)
- Java Development Kit (JDK) 17以上

### 環境変数

アプリを実行する前に、Supabaseの設定が必要です。
プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## セットアップ手順

### 0. 環境チェック（推奨）

開発環境が正しくセットアップされているか確認するには、以下のスクリプトを実行してください：

```bash
cd android
./check-requirements.sh
```

このスクリプトは、Node.js、Java、Android SDK などの必要な環境が整っているかチェックします。

### 1. 依存関係のインストール

```bash
cd android
npm install --legacy-peer-deps
```

**注意**: `--legacy-peer-deps` フラグは、依存関係の競合を回避するために必要です。

### 2. Webアプリのビルド

```bash
npm run build
```

これにより、`dist/` フォルダにプロダクション用のWebアセットが生成されます。

### 3. Androidプロジェクトと同期

```bash
npm run android:sync
```

このコマンドは、ビルドされたWebアセットをAndroidプロジェクトにコピーします。

### 4. Android Studioでプロジェクトを開く

```bash
npm run android:open
```

または、手動で以下のディレクトリをAndroid Studioで開きます：
```
android/android/
```

### 5. アプリの実行

#### Android Studioから実行する場合

1. Android Studioでプロジェクトを開く
2. エミュレーターを起動するか、実機を接続
3. 「Run」ボタン（▶️）をクリック

#### コマンドラインから実行する場合

```bash
npm run android:run
```

注: デバイスまたはエミュレーターが起動している必要があります。

## 開発ワークフロー

### コード変更時の手順

1. `src/` 配下のコードを編集
2. Webアプリをビルド: `npm run build`
3. Androidプロジェクトと同期: `npm run android:sync`
4. Android Studioでリフレッシュまたは再実行

### ライブリロード開発（推奨）

開発中は、Capacitorのライブリロード機能を使用できます：

1. 開発サーバーを起動:
```bash
npm run dev
```

2. `capacitor.config.ts` を編集し、開発サーバーのURLを追加:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tryjunie.taskmanager',
  appName: 'TaskManagementApp',
  webDir: 'dist',
  server: {
    url: 'http://localhost:5173', // 開発時のみ
    cleartext: true
  }
};

export default config;
```

3. アプリを再実行すると、開発サーバーに接続され、変更が即座に反映されます

**注意**: 本番ビルド前に `server` セクションは削除してください。

## ビルドとリリース

### リリース用APKのビルド

1. Android Studioでプロジェクトを開く
2. **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)** を選択
3. ビルドが完了すると、APKファイルの場所が通知されます

### 署名付きリリースビルド

1. **Build** > **Generate Signed Bundle / APK** を選択
2. **APK** を選択し、「Next」
3. キーストアを作成または選択
4. リリース設定を選択し、ビルド

## トラブルシューティング

### ビルドエラー

**問題**: `dist/` ディレクトリが見つからない
**解決策**: `npm run build` を実行してWebアセットをビルドしてください

**問題**: Gradleビルドエラー
**解決策**: 
- Android Studioのバージョンを確認
- JDKバージョンを確認（JDK 17推奨）
- Android SDKが正しくインストールされているか確認

### デバイス/エミュレーターが見つからない

**解決策**:
```bash
# 接続されているデバイスを確認
adb devices

# エミュレーターがない場合、Android Studio > Device Manager で作成
```

### 環境変数が読み込まれない

**解決策**: 
- `.env.local` がプロジェクトルートに存在するか確認
- `npm run build` を再実行
- `npm run android:sync` を再実行

## プロジェクト構造

```
android/
├── src/                      # React アプリケーションのソースコード（ui/ からコピー）
├── public/                   # 静的アセット
├── android/                  # Capacitorが生成したAndroidネイティブプロジェクト（git無視）
├── dist/                     # ビルドされたWebアセット（git無視）
├── node_modules/             # npmパッケージ（git無視）
├── capacitor.config.ts       # Capacitor設定
├── package.json              # 依存関係とスクリプト
├── vite.config.ts            # Viteビルド設定
├── tailwind.config.cjs       # Tailwind CSS設定
├── .env.local.example        # 環境変数テンプレート
├── check-requirements.sh     # 環境チェックスクリプト
└── README.md                 # このファイル
```

## クイックスタート

初めての方は、以下の手順で最速セットアップできます：

```bash
# 1. android ディレクトリに移動
cd android

# 2. 環境チェック（オプション）
./check-requirements.sh

# 3. 依存関係をインストール
npm install --legacy-peer-deps

# 4. 環境変数を設定
cp .env.local.example .env.local
# .env.local を編集して、Supabase の URL とキーを設定

# 5. ビルド
npm run build

# 6. Android プロジェクトと同期
npm run android:sync

# 7. Android Studio で開く
npm run android:open
```

## 参考リンク

- [Capacitor公式ドキュメント](https://capacitorjs.com/)
- [Android Developer Guide](https://developer.android.com/)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [React公式ドキュメント](https://react.dev/)
- [Vite公式ドキュメント](https://vitejs.dev/)

## ライセンス

このプロジェクトはプライベートであり、特定のライセンスの下で配布されていません。
