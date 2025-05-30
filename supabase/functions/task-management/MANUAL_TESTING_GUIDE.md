# `task-management` Edge Function 手動テストガイド

このガイドは、最近の変更後に `task-management` Supabase Edge Function を手動でテストする手順を提供します。

## 1. 前提条件

テストを行う前に、Supabase プロジェクトで以下が設定されていることを確認してください。

### 1.1. `integration_keys` テーブル

- `integration_keys` という名前のテーブルを、少なくとも以下の列で作成します。

  - `key` (型: `TEXT` または `VARCHAR`, ユニーク): インテグレーションキーの文字列を格納します。
  - `user_id` (型: `UUID`, `auth.users(id)` への外部キー): このキーが関連付けられている Supabase ユーザーID。
  - `is_active` (型: `BOOLEAN`): キーが現在アクティブかどうか。
  - `description` (型: `TEXT`, オプション): キーの説明。

- **サンプルデータ**:
  - **有効かつアクティブなキー**: `auth.users` テーブルに存在するユーザーの行を挿入します。
    - `key`: `test-integration-key-active`
    - `user_id`: (既存ユーザーの UUID、例: `12345678-1234-1234-1234-1234567890ab`)
    - `is_active`: `true`
    - `description`: "テスト用のアクティブなキー"
  - **有効かつ非アクティブなキー**: 別の行を挿入します。
    - `key`: `test-integration-key-inactive`
    - `user_id`: (同じまたは別の既存ユーザーの UUID)
    - `is_active`: `false`
    - `description`: "テスト用の非アクティブなキー"

### 1.2. `tasks` テーブル

- `tasks` テーブルがあることを確認してください。関数はこのテーブルへの挿入を試みます。
- 少なくとも以下の列が必要です。
  - `title` (型: `TEXT` または `VARCHAR`)
  - `description` (型: `TEXT`, オプション)
  - `estimated_minute` (型: `INTEGER`, オプション)
  - `task_date` (型: `DATE`, オプション)
  - `user_id` (型: `UUID`): インテグレーションキーに関連付けられた `user_id` を格納します。

### 1.3. `tasks` テーブルの RLS (Row Level Security)

- RLS テストのために、`tasks` テーブルで RLS が有効になっていることを確認してください。
- `user_id` に基づいてアクセスを制限するポリシーを作成します。一般的なポリシーは次のようになります。

  ```sql
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can manage their own tasks"
  ON tasks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  ```

  _注意: このポリシーは、関数によって生成された JWT で設定された `user_id` に `auth.uid()` が正しく解決されることを前提としています。_

### 1.4. Edge Function の環境変数

`task-management` Supabase Function に対して、以下の環境変数が設定されていることを確認してください（`supabase start` を使用している場合はローカルの `.env` ファイル経由、または Supabase プロジェクト設定で）。

- `SUPABASE_URL`: プロジェクトの Supabase URL。
- `SUPABASE_ANON_KEY`: プロジェクトの anon キー。
- `SUPABASE_SERVICE_ROLE_KEY`: プロジェクトのサービスロールキー。
- `X_SUPABASE_JWT_SECRET`: JWT の署名に使用される強力な秘密の文字列。これは、Supabase プロジェクトが JWT 検証に使用する秘密と**同じでなければなりません**（Supabase UI/ドキュメントでは単に `JWT Secret` または `SUPABASE_JWT_SECRET` と呼ばれることが多いですが、関数コードは具体的に `X_SUPABASE_JWT_SECRET` を期待します）。これは Supabase プロジェクトの JWT 設定で見つけることができます。

## 2. テストシナリオ

`curl` や Postman のようなツールを使用して、Edge Function にリクエストを送信します。デフォルトのローカル URL は `http://127.0.0.1:54321/functions/v1/task-management` です。

### 2.1. 成功ケース

- **アクション**: 有効な `x-integration-id`（アクティブなもの）と有効な JSON タスクデータで関数を呼び出します。
  ```bash
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/task-management' \
  --header 'x-integration-id: test-integration-key-active' \
  --header 'Content-Type: application/json' \
  --data '{
      "title": "My Test Task via Integration",
      "description": "This is a task created successfully.",
      "estimated_minute": 60
  }'
  ```
- **期待される結果**:
  - HTTP ステータスコード: `200 OK` (またはカスタマイズしていれば `201 Created` ですが、現在のコードは 200 を返します)。
  - レスポンスボディ: `{"message":"タスクが正常に作成されました","task":{...}}` のような JSON。ここで `task` は作成されたタスクデータ（`id` と正しい `user_id` を含む）を含みます。
- **検証**:
  - Supabase プロジェクトの `tasks` テーブルを確認します。
  - 提供された詳細情報で新しいタスクが作成されているはずです。
  - 新しいタスクの `user_id` は、`integration_keys` テーブルの `test-integration-key-active` に関連付けられた `user_id` と**一致しなければなりません**。

### 2.2. エラーケース

#### 2.2.1. `x-integration-id` ヘッダーの欠落

- **アクション**: `x-integration-id` ヘッダーなしで関数を呼び出します。
  ```bash
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/task-management' \
  --header 'Content-Type: application/json' \
  --data '{"title":"Task missing header"}'
  ```
- **期待される結果**:
  - HTTP ステータスコード: `400 Bad Request`。
  - レスポンスボディ: `{"error":"x-integration-id header is missing"}`。

#### 2.2.2. 存在しない `x-integration-id`

- **アクション**: `integration_keys` テーブルに存在しない `x-integration-id` で関数を呼び出します。
  ```bash
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/task-management' \
  --header 'x-integration-id: non-existent-key' \
  --header 'Content-Type: application/json' \
  --data '{"title":"Task with non-existent key"}'
  ```
- **期待される結果**:
  - HTTP ステータスコード: `404 Not Found`。
  - レスポンスボディ: `{"error":"Integration key not found."}`。

#### 2.2.3. 非アクティブな `x-integration-id`

- **アクション**: `is_active = false` とマークされた `x-integration-id` で関数を呼び出します。
  ```bash
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/task-management' \
  --header 'x-integration-id: test-integration-key-inactive' \
  --header 'Content-Type: application/json' \
  --data '{"title":"Task with inactive key"}'
  ```
- **期待される結果**:
  - HTTP ステータスコード: `403 Forbidden`。
  - レスポンスボディ: `{"error":"Integration key is inactive."}`。

#### 2.2.4. 無効なタスクデータ

- **アクション**: 無効なタスクデータ（例: タイトル欠落）で関数を呼び出します。
  ```bash
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/task-management' \
  --header 'x-integration-id: test-integration-key-active' \
  --header 'Content-Type: application/json' \
  --data '{"description":"Task missing title"}'
  ```
- **期待される結果**:
  - HTTP ステータスコード: `400 Bad Request`。
  - レスポンスボディ: `{"error":"Invalid task data","details":["タイトルは必須です"]}`。

#### 2.2.5. 環境変数の欠落（概念的）

- **アクション**: これは、関数のデプロイメント環境を変更せずに `curl` で直接テストするのがより困難です。もし一時的に関数の `SUPABASE_JWT_SECRET`（または `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` のような他の必須環境変数）を設定解除してから呼び出すとします。
  ```bash
  # SUPABASE_JWT_SECRET が関数の環境で設定解除されていると仮定
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/task-management' \
  --header 'x-integration-id: test-integration-key-active' \
  --header 'Content-Type: application/json' \
  --data '{"title":"Test Env Var Missing"}'
  ```
- **期待される結果**:
  - HTTP ステータスコード: `500 Internal Server Error`。
  - レスポンスボディ: `{"error":"Server configuration error."}`。
  - 関数のサーバーサイドログは、どの変数が欠落していたかを示すはずです（例: "Missing one or more required environment variables..."）。

### 2.3. RLS テスト（概念的および実践的）

これは、関数によって生成された JWT が `tasks` テーブルの RLS ポリシーに対して `user_id` を正しく想定するかどうかをテストします。

- **前提条件**: セクション 1.3 の RLS ポリシーがアクティブであることを確認します。

- **シナリオ 1: タスクの `user_id` が JWT の `sub` と一致する（暗黙的）**

  - これは **成功ケース (2.1)** でカバーされています。関数内の `newTask` オブジェクトは `user_id: taskData.user_id || actualUserId` を使用します。リクエストボディで `taskData.user_id` が提供されない場合、`actualUserId`（インテグレーションキーから）が使用されます。JWT の `sub` クレームはこの `actualUserId` に設定されます。`auth.uid()`（JWT `sub` から派生）が `newTask.user_id` と一致するため、RLS は挿入を許可するはずです。

- **シナリオ 2: `taskData.user_id` を別のユーザーに設定しようとする（関数ロジックで許可されている場合）**

  - 現在の関数ロジック: `user_id: taskData.user_id || actualUserId`。これは、リクエストで `taskData.user_id` が提供された場合、挿入される前にそれが優先されることを意味します。ただし、JWT は引き続き `actualUserId`（インテグレーションキーからのもの）に対して生成されます。
  - **アクション**: `taskData.user_id` が `test-integration-key-active` に関連付けられていない _別の_ ユーザーの有効な UUID であるリクエストを送信します。
    ```bash
    # 'other-user-uuid' が 'test-integration-key-active' に関連付けられていないユーザーの有効な UUID であると仮定
    curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/task-management' \
    --header 'x-integration-id: test-integration-key-active' \
    --header 'Content-Type: application/json' \
    --data '{
        "title": "RLS Test Task - Mismatched UserID",
        "user_id": "other-user-uuid"
    }'
    ```
  - **期待される結果**:
    - HTTP ステータスコード: `400 Bad Request` (これは、RLS 違反が原因となる Supabase 挿入エラーで現在のコードが返すものです)。
    - レスポンスボディ: `{"error":"タスクの保存に失敗しました", "details":"..."}`。詳細には "new row violates row-level security policy for table "tasks"" などが含まれる場合があります。
  - **検証**:

    - タスクは `tasks` テーブルに作成されてはなりません。
    - これにより、関数ロジックが別の `user_id` を設定しようと試みることができたとしても、Supabase によって強制される RLS ポリシー（JWT の `auth.uid()` を使用）がそれを防ぐことが確認されます。

  - **`taskData.user_id` に関する注意**: 現在の関数では、`taskData.user_id` をオプションで渡すことができます。`x-integration-id` が `user_id` を_単独で_決定することが意図されている場合、関数ロジックは `taskData` 内のいかなる `user_id` も無視し、常に `actualUserId` を使用するように変更する必要があります。ただし、RLS ポリシーは強力な保護手段を提供します。

## 3. クリーンアップ

- テスト後、必要に応じてテストデータ（インテグレーションキー、タスク）を削除または非アクティブ化することを忘れないでください。
- 環境変数への一時的な変更を元に戻します。
