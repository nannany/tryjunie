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

##### 1. Android デバイスの開発者オプションを有効化

1. **設定** アプリを開く
2. **デバイス情報** または **端末情報** を選択
3. **ビルド番号** を7回連続でタップ
4. 「デベロッパーになりました」というメッセージが表示される

##### 2. USB デバッグを有効化

1. **設定** > **システム** > **開発者向けオプション** を開く
2. **USB デバッグ** をオンにする
3. 確認ダイアログで **OK** をタップ

##### 3. デバイスを接続

1. USB ケーブルでAndroidデバイスをコンピューターに接続
2. デバイスに「USB デバッグを許可しますか？」というダイアログが表示される
3. **このコンピューターを常に許可する** にチェックを入れて **OK** をタップ

##### 4. 接続確認

コマンドラインで以下を実行して、デバイスが認識されているか確認：

```bash
adb devices
```

以下のように表示されれば成功：
```
List of devices attached
ABC123456789    device
```

**注意**: 
- デバイスが表示されない場合は、USB ケーブルを変更するか、USBモードを「ファイル転送」に変更してみてください
- Windows の場合、デバイスのUSBドライバーのインストールが必要な場合があります

### 5. アプリの実行

Android Studio の "Run" ボタン（▶️）をクリックするか、以下のコマンドを実行：

```bash
./gradlew installDebug
```

## 実機でのテスト

実機でアプリをテストすることで、実際のユーザー体験を確認できます。

### デバイス選択

Android Studio で実行する際：

1. ツールバーのデバイス選択ドロップダウンをクリック
2. 接続されている実機を選択（エミュレーターと実機が両方表示されます）
3. "Run" ボタンをクリック

### コマンドラインから実機にインストール

```bash
# 接続されているデバイスを確認
adb devices

# デバッグ版をインストール
./gradlew installDebug

# 特定のデバイスにインストール（複数接続時）
adb -s DEVICE_ID install app/build/outputs/apk/debug/app-debug.apk
```

### 実機でのデバッグ

#### Logcat でログを確認

Android Studio の **Logcat** タブで、実機からのログをリアルタイムで確認できます：

1. **Logcat** タブを開く
2. デバイスを選択
3. フィルターを設定（例: `tag:TaskManagement` や `package:com.tryjunie.tasks`）

コマンドラインから：

```bash
# すべてのログを表示
adb logcat

# アプリのログのみ表示
adb logcat | grep "com.tryjunie.tasks"

# クラッシュレポートを確認
adb logcat | grep "AndroidRuntime"
```

#### ワイヤレスデバッグ（Android 11以上）

USB ケーブルなしでデバッグできます：

1. デバイスで **設定** > **開発者向けオプション** > **ワイヤレス デバッグ** をオンにする
2. **ペア設定コードによるデバイスのペア設定** をタップ
3. コンピューターで以下を実行：

```bash
adb pair IP_ADDRESS:PORT
# 表示されたペアリングコードを入力

adb connect IP_ADDRESS:PORT
```

これで、USB ケーブルなしでデバッグできます。

### パフォーマンステスト

実機でのパフォーマンスを確認：

#### メモリ使用量

Android Studio の **Profiler** を使用：

1. **View** > **Tool Windows** > **Profiler**
2. 実機を選択
3. **Memory** をクリックしてメモリ使用量を監視

#### ネットワーク通信

Supabase への通信を確認：

1. **Profiler** > **Network** タブ
2. API 呼び出しの時間とデータサイズを確認

#### CPU 使用率

1. **Profiler** > **CPU** タブ
2. UI のレンダリングやバックグラウンド処理の負荷を確認

### 実機特有の問題

実機でテストすることで、以下のような問題を発見できます：

- **ネットワーク接続**: Wi-Fi やモバイルデータでの動作
- **バッテリー消費**: バックグラウンドでの電力使用
- **画面サイズ**: 様々な解像度での表示
- **OS バージョン**: 古いバージョンでの互換性
- **パフォーマンス**: 低スペックデバイスでの動作

### 複数デバイスでのテスト推奨

可能であれば、以下のような異なる特性のデバイスでテストすることを推奨します：

- **低スペック端末**: メモリやCPUが限られたデバイス
- **高解像度端末**: 大画面や高DPIディスプレイ
- **古いOS**: サポート対象の最小APIレベル（API 24）
- **メーカー別**: Samsung、Xiaomi、OPPOなど、カスタムUIを持つデバイス

### Firebase Test Lab（オプション）

Google の Firebase Test Lab を使用すると、クラウド上の実機で自動テストができます：

1. Firebase Console でプロジェクトを作成
2. APK をアップロード
3. テスト対象のデバイスとOS バージョンを選択
4. テストを実行

詳細: [Firebase Test Lab](https://firebase.google.com/docs/test-lab)

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

### 前提条件

リリース版のアプリを作成する前に、以下が必要です：

1. **キーストアファイル**: アプリに署名するための証明書
2. **Google Play Console アカウント**: Google Play にアプリを公開する場合
3. **アプリアイコン**: 適切なサイズのランチャーアイコン
4. **プライバシーポリシー**: Google Play で必須

### ステップ1: キーストアの作成

初回のみ、キーストアを作成する必要があります：

#### Android Studio を使用する場合

1. **Build** > **Generate Signed Bundle / APK** を選択
2. **Android App Bundle** または **APK** を選択し、**Next**
3. **Create new...** をクリック
4. 以下の情報を入力：
   - **Key store path**: キーストアの保存場所（例: `~/keystores/tryjunie-release.jks`）
   - **Password**: 安全なパスワード（必ず記録してください）
   - **Alias**: キーのエイリアス（例: `tryjunie-key`）
   - **Key password**: キーのパスワード
   - **Validity (years)**: 25年以上を推奨
   - **Certificate**: 組織情報（最低限、名前を入力）
5. **OK** をクリックしてキーストアを作成

#### コマンドラインを使用する場合

```bash
keytool -genkey -v -keystore ~/keystores/tryjunie-release.jks \
  -alias tryjunie-key -keyalg RSA -keysize 2048 -validity 10000
```

**重要**: キーストアファイルとパスワードは**絶対に失わないでください**。これらがないとアプリの更新ができなくなります。

### ステップ2: 署名設定の追加

`android/app/build.gradle.kts` に署名設定を追加（または `keystore.properties` ファイルを作成）：

#### 方法1: keystore.properties を使用（推奨）

`android/keystore.properties` ファイルを作成：

```properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=tryjunie-key
storeFile=/path/to/tryjunie-release.jks
```

`.gitignore` に `keystore.properties` を追加して、Git にコミットしないようにします。

#### 方法2: 環境変数を使用

環境変数を設定：

```bash
export KEYSTORE_PASSWORD=your-store-password
export KEY_PASSWORD=your-key-password
export KEY_ALIAS=tryjunie-key
export KEYSTORE_FILE=/path/to/tryjunie-release.jks
```

### ステップ3: リリースビルドの作成

#### Android App Bundle (AAB) の作成（推奨）

Google Play に公開する場合は AAB 形式が推奨されます：

```bash
./gradlew bundleRelease
```

生成されたファイル: `app/build/outputs/bundle/release/app-release.aab`

#### APK の作成

直接配布する場合や、Google Play 以外のストアに公開する場合：

```bash
./gradlew assembleRelease
```

生成されたファイル: `app/build/outputs/apk/release/app-release.apk`

#### Android Studio から作成

1. **Build** > **Generate Signed Bundle / APK**
2. **Android App Bundle** を選択し、**Next**
3. キーストア情報を入力
4. **release** ビルドバリアントを選択
5. **Finish** をクリック

### ステップ4: ビルドの検証

リリースビルドを実機でテストします：

```bash
# APK をインストール
adb install app/build/outputs/apk/release/app-release.apk

# または bundletool を使用して AAB をテスト
bundletool build-apks --bundle=app/build/outputs/bundle/release/app-release.aab \
  --output=app.apks --ks=/path/to/keystore.jks \
  --ks-key-alias=tryjunie-key

bundletool install-apks --apks=app.apks
```

### ステップ5: Google Play へのデプロイ

#### 5.1 Google Play Console の準備

1. [Google Play Console](https://play.google.com/console) にアクセス
2. 新しいアプリを作成
3. 以下の情報を入力：
   - アプリ名
   - デフォルト言語
   - アプリの種類（アプリまたはゲーム）
   - 無料/有料

#### 5.2 ストア掲載情報の作成

以下の情報が必要です：

- **アプリアイコン**: 512 x 512 px（PNG）
- **スクリーンショット**: 
  - 携帯電話: 最低2枚（最大8枚）
  - 7インチタブレット（オプション）
  - 10インチタブレット（オプション）
- **短い説明**: 80文字以内
- **詳しい説明**: 4000文字以内
- **カテゴリ**: アプリのカテゴリを選択
- **連絡先情報**: メールアドレス
- **プライバシーポリシー**: URL（必須）

#### 5.3 コンテンツレーティング

アプリのコンテンツに関する質問票に回答し、レーティングを取得します。

#### 5.4 対象ユーザーとコンテンツ

- 対象年齢層を設定
- 広告の有無を申告
- データの取り扱いに関する情報を提供

#### 5.5 リリース

1. **製品版** > **リリース** > **新しいリリースを作成** を選択
2. AAB ファイルをアップロード
3. リリースノートを入力（各言語）
4. **審査に送信** をクリック

審査には通常1～3日かかります。

### ステップ6: 継続的な更新

#### バージョンコードとバージョン名の更新

新しいバージョンをリリースする際は、`app/build.gradle.kts` を更新：

```kotlin
defaultConfig {
    versionCode = 2  // 前回より大きい整数
    versionName = "1.1.0"  // セマンティックバージョニング
}
```

#### 段階的公開

Google Play では、リリースを段階的に公開できます：

1. 初期公開率を設定（例: 5%、10%、20%）
2. クラッシュレートやユーザーフィードバックを監視
3. 問題がなければ段階的に公開率を上げる
4. 最終的に100%に到達

### リリースチェックリスト

- [ ] キーストアファイルを安全に保管
- [ ] ProGuard/R8 で難読化を有効化（本番用）
- [ ] デバッグログを無効化
- [ ] すべてのテストが通過
- [ ] 実機で動作確認
- [ ] スクリーンショットを準備
- [ ] プライバシーポリシーを準備
- [ ] リリースノートを作成
- [ ] バージョンコードを更新

### トラブルシューティング（リリース）

**問題**: 「キーストアが見つかりません」エラー
**解決策**: `keystore.properties` のパスが正しいか確認。絶対パスを使用することを推奨。

**問題**: Google Play で「重複する APK」エラー
**解決策**: `versionCode` を前のバージョンより大きい値に更新。

**問題**: アプリがリリースビルドでクラッシュする
**解決策**: ProGuard ルールを確認。必要なクラスが難読化されていないか確認（`proguard-rules.pro`）。

## 参考リンク

- [Jetpack Compose ドキュメント](https://developer.android.com/jetpack/compose)
- [Android Kotlin ガイド](https://developer.android.com/kotlin)
- [Supabase Kotlin SDK](https://github.com/supabase-community/supabase-kt)
- [Hilt ドキュメント](https://dagger.dev/hilt/)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)

## ライセンス

このプロジェクトはプライベートであり、特定のライセンスの下で配布されていません。
