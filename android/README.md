# タスク管理アプリ - Android（Kotlin）版

このディレクトリには、タスク管理アプリのAndroid向けネイティブモバイルアプリケーション（Kotlin + Jetpack Compose）が含まれています。

## 概要

Kotlin と Jetpack Compose を使用したネイティブAndroidアプリです。
機能は `ui/` フォルダのWebアプリと同じです：

- タスク一覧の表示と管理
- タスクの作成・編集・削除
- 認証機能（ログイン・登録）
- Supabase バックエンドとの連携

## 技術スタック

- **言語**: Kotlin
- **UIフレームワーク**: Jetpack Compose
- **アーキテクチャ**: MVVM + Repository パターン
- **依存性注入**: Hilt
- **ネットワーク**: Supabase Kotlin SDK + Ktor
- **非同期処理**: Kotlin Coroutines + Flow
- **ナビゲーション**: Navigation Compose

## 前提条件

### 必須
- Android Studio Hedgehog (2023.1.1) 以上
- JDK 17 以上
- Android SDK (API Level 24-34)
- Kotlin 1.9.20 以上

### 環境変数

Supabase の設定が必要です。以下の方法で環境変数を設定してください：

#### 方法1: local.properties に追加（推奨）

`android/local.properties` ファイルに以下を追加：

```properties
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### 方法2: システム環境変数

以下の環境変数を設定：

```bash
export SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-supabase-anon-key"
```

## セットアップ手順

### 1. Android Studio でプロジェクトを開く

1. Android Studio を起動
2. "Open" を選択
3. `android/` ディレクトリを選択

### 2. Gradle Sync

Android Studio が自動的に Gradle Sync を開始します。
初回は依存関係のダウンロードに時間がかかります。

### 3. 環境変数の設定

上記の「環境変数」セクションを参照して、Supabase の設定を行ってください。

### 4. エミュレーターまたは実機の準備

#### エミュレーターを使用する場合

1. Android Studio の "Device Manager" を開く
2. "Create Device" をクリック
3. 任意のデバイスを選択（推奨: Pixel 6, API 34）
4. エミュレーターを起動

#### 実機を使用する場合

1. Android デバイスで開発者オプションを有効化
2. USB デバッグを有効化
3. USB でコンピューターに接続

### 5. アプリの実行

Android Studio の "Run" ボタン（▶️）をクリックするか、以下のコマンドを実行：

```bash
./gradlew installDebug
```

## プロジェクト構造

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/tryjunie/tasks/
│   │       │   ├── MainActivity.kt              # メインアクティビティ
│   │       │   ├── TaskManagementApplication.kt # Application クラス
│   │       │   ├── data/                        # データ層
│   │       │   │   ├── AuthRepository.kt        # 認証リポジトリ
│   │       │   │   └── TaskRepository.kt        # タスクリポジトリ
│   │       │   ├── di/                          # 依存性注入
│   │       │   │   └── AppModule.kt             # Hilt モジュール
│   │       │   ├── domain/                      # ドメイン層
│   │       │   │   ├── Task.kt                  # タスクモデル
│   │       │   │   └── User.kt                  # ユーザーモデル
│   │       │   └── ui/                          # UI 層
│   │       │       ├── TaskManagementApp.kt     # アプリナビゲーション
│   │       │       ├── screens/                 # 画面
│   │       │       │   ├── LoginScreen.kt       # ログイン画面
│   │       │       │   └── TaskListScreen.kt    # タスク一覧画面
│   │       │       ├── theme/                   # テーマ
│   │       │       │   ├── Color.kt
│   │       │       │   ├── Theme.kt
│   │       │       │   └── Type.kt
│   │       │       └── viewmodels/              # ViewModel
│   │       │           ├── AuthViewModel.kt
│   │       │           └── TaskListViewModel.kt
│   │       ├── res/                             # リソース
│   │       │   └── values/
│   │       │       ├── strings.xml              # 文字列リソース
│   │       │       ├── colors.xml               # 色リソース
│   │       │       └── themes.xml               # テーマ
│   │       └── AndroidManifest.xml              # マニフェスト
│   ├── build.gradle.kts                         # アプリレベル Gradle
│   └── proguard-rules.pro                       # ProGuard ルール
├── build.gradle.kts                             # プロジェクトレベル Gradle
├── settings.gradle.kts                          # Gradle 設定
├── gradle.properties                            # Gradle プロパティ
└── README.md                                    # このファイル
```

## 開発コマンド

### ビルド

```bash
# Debug ビルド
./gradlew assembleDebug

# Release ビルド
./gradlew assembleRelease
```

### テスト

```bash
# ユニットテストを実行
./gradlew test

# インストルメンテッドテストを実行
./gradlew connectedAndroidTest
```

### クリーン

```bash
./gradlew clean
```

## 開発ワークフロー

### コード変更時の手順

1. Kotlin ファイルを編集
2. Android Studio が自動的にビルド
3. "Run" で実行して変更を確認

### ライブプレビュー（Jetpack Compose）

Compose の `@Preview` アノテーションを使用して、Android Studio 内でUIをプレビューできます：

```kotlin
@Preview
@Composable
fun TaskItemPreview() {
    TaskManagementTheme {
        TaskItem(...)
    }
}
```

## トラブルシューティング

### ビルドエラー

**問題**: Gradle Sync が失敗する
**解決策**: 
- Android Studio を最新版に更新
- JDK 17 が正しくインストールされているか確認
- `./gradlew clean` を実行してキャッシュをクリア

**問題**: Supabase の設定エラー
**解決策**:
- `local.properties` または環境変数が正しく設定されているか確認
- ビルドを再実行（`./gradlew --refresh-dependencies`）

### 実行時エラー

**問題**: アプリがクラッシュする
**解決策**:
- Logcat を確認してエラーメッセージを確認
- Supabase の URL と Key が正しいか確認
- ネットワーク接続を確認

**問題**: タスクが表示されない
**解決策**:
- Supabase でデータが正しく保存されているか確認
- 認証が成功しているか確認
- Logcat でネットワークエラーを確認

## 今後の実装予定

- [ ] タスクの編集機能
- [ ] タスクのドラッグ&ドロップ並び替え
- [ ] カテゴリ管理
- [ ] タスクタイマー機能
- [ ] インテグレーションキー管理
- [ ] ダークモード対応の改善
- [ ] オフライン対応（Room DB）

## リリースビルド

### 署名付き APK/AAB の作成

1. Android Studio で **Build** > **Generate Signed Bundle / APK**
2. キーストアを作成または選択
3. リリース設定を選択してビルド

### Google Play へのデプロイ

1. AAB ファイルを作成
2. Google Play Console にアップロード
3. リリーストラックを選択してデプロイ

## 参考リンク

- [Jetpack Compose ドキュメント](https://developer.android.com/jetpack/compose)
- [Android Kotlin ガイド](https://developer.android.com/kotlin)
- [Supabase Kotlin SDK](https://github.com/supabase-community/supabase-kt)
- [Hilt ドキュメント](https://dagger.dev/hilt/)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)

## ライセンス

このプロジェクトはプライベートであり、特定のライセンスの下で配布されていません。
