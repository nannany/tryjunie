# MCPサーバー (Node.js)

このサーバーは、Node.js用の`@modelcontextprotocol/sdk`を使用してモデルコンテキストプロトコル (MCP)を実装しています。Supabaseの`task-management` Edge Function (エッジ関数)と連携することを目的としています。

## 目的

サーバーは`StdioServerTransport`を使用しており、標準入出力を介して通信します。主な目的は、クライアントがSupabaseの`task-management`機能と対話できるようにするMCP機能（ツールなど）を公開することです。たとえば、MCPクライアントはこのサーバー上のツールを呼び出し、それがSupabase関数へのHTTP POSTリクエストをトリガーすることができます。

技術的には、サーバーは標準的なMCPリクエスト（ツールのリスト化やツールの呼び出しなど）のハンドラーを実装しています。MCPクライアントから照会されると、`create_task`ツールとその入力パラメータスキーマ（Zodから派生）を公開します。

## セットアップと実行

1.  **前提条件**:

    - [Node.js](https://nodejs.org/)がインストールされていることを確認してください（npmが含まれています）。
    - Supabase スタック（`task-management` Edge Function (エッジ関数)を含む）との対話をテストする場合は、実行中である必要があります。

2.  **ディレクトリに移動**:

    ```bash
    cd /path/to/your/project/mcp
    ```

3.  **依存関係のインストール**:
    まだインストールしていない場合、または新たにプルした場合:

    ```bash
    npm install
    ```

4.  **環境変数の設定**:
    サーバーを実行する前に、以下に詳述する環境変数を**必ず**設定する必要があります。
    例:

    ```bash
    export SUPABASE_FUNCTION_URL="http://localhost:54321/functions/v1/task-management"
    export X_INTEGRATION_ID="your-actual-integration-id"
    ```

5.  **サーバーの実行**:
    サーバーはTypeScriptで書かれており、`ts-node`を使用して実行できます:

    ```bash
    # 上記のように環境変数が設定されていることを確認してください
    npx ts-node index.ts
    ```

    または、`tsc`を使用してTypeScriptをJavaScriptにコンパイルし（`tsconfig.json`の設定に従い、`./dist`に出力されます）、その後JavaScriptファイルを実行することもできます:

    ```bash
    # 環境変数が設定されていることを確認してください
    npm run build  # package.jsonの"build": "tsc"スクリプトを使用します
    node dist/index.js
    ```

    開発中は、簡便さから`ts-node`がよく使われます。

    起動すると、使用されているSupabase URLとインテグレーションIDを示すメッセージが表示され、続いて次のように表示されます: `"[timestamp] MCP Server with StdioTransport started. Ready to handle ListTools and CallTool requests."`（実際のツール名`create_task`はListToolsハンドラーを介して公開されます）。

## 環境変数 (必須)

サーバーを実行する前に、以下の環境変数を**必ず**設定する必要があります:

- **`SUPABASE_FUNCTION_URL`**: ターゲットのSupabase `task-management` Edge Function (エッジ関数)の完全なURLを指定します。

  - 例: `export SUPABASE_FUNCTION_URL="http://localhost:54321/functions/v1/task-management"`
  - デプロイされたSupabase関数の場合は、その本番URLを使用します。

- **`X_INTEGRATION_ID`**: Supabase `task-management` Edge Function (エッジ関数)が認証と認可のために必要とするインテグレーションID。このIDは、Supabase関数が呼び出し元のユーザーまたはシステムを識別し、認可するために使用されます。
  - 例: `export X_INTEGRATION_ID="your-actual-integration-id"`

これらの変数が起動時に検出されない場合、サーバーはエラーをログに記録して終了します。

## 対話モデル

`task-management` Supabase Edge Function (エッジ関数)は、JSONボディと`x-integration-id`ヘッダー（注意: Supabaseに送信されるヘッダーは`x-integration-id`のままです）を持つ`POST`リクエストを期待するHTTPエンドポイントです。

このMCPサーバーは、`create_task`という名前のMCPツールを介してその機能を公開します。

### ツール: `create_task(params)`

**パラメータ (`params`オブジェクト):**

- `title` (string): タスクのタイトル。**必須**。
- `description` (string, optional): タスクの説明。
- `estimated_minute` (number, optional): タスクの推定時間（分）。
- `task_date` (string, optional): "YYYY-MM-DD"形式のタスクの日付。指定しない場合、Supabase関数は通常、現在の日付をデフォルトとします。

MCPクライアントがこのツールを（例えばstdioトランスポートを介して）呼び出すと、サーバーは次のようになります:

1.  `params`から`title`、`description`、`estimated_minute`、`task_date`を使用して、HTTPリクエストのJSONボディを構築します。
2.  環境変数から`SUPABASE_FUNCTION_URL`（リクエストの送信先）と`X_INTEGRATION_ID`（`x-integration-id`ヘッダー用）を取得します。
3.  設定された`SUPABASE_FUNCTION_URL`にHTTP `POST`リクエストを行います。
4.  Supabase関数からのJSONレスポンス（成功オブジェクトまたはエラーオブジェクトの可能性があります）をMCPクライアントに直接返します。

これにより、MCPクライアントはHTTPリクエストを処理したり、Supabase固有の認証詳細を直接管理したりすることなく、Supabaseでタスクを管理できます。

## MCPクライアント設定例

このセクションでは、このMCPサーバーをMCPクライアントアプリケーション（例: MCPをサポートするデスクトップアシスタント）でどのように設定できるかの例を示します。正確な形式はクライアントによって異なる場合があります。

```json
{
  "mcpServers": {
    "myTaskServer": {
      "command": "node",
      "args": ["/path/to/your/project/mcp/dist/index.js"],
      "env": {
        "X_INTEGRATION_ID": "your-actual-integration-id-value",
        "SUPABASE_FUNCTION_URL": "https://<your-project-ref>.supabase.co/functions/v1/task-management"
      }
    }
  }
}
```

**クライアント設定に関する注意:**

- **`myTaskServer`**: これは、このMCPサーバーインスタンスに対するクライアント定義のエイリアスです。クライアントはこの名前を使用してMCPリクエストを送信します。
- **`command`と`args`**:
  - これらのフィールドは、MCPサーバーを起動する方法を指定します。
  - 例の`["node", "/path/to/your/project/mcp/dist/index.js"]`は、`npm run build`を使用してTypeScriptをJavaScriptにビルドし、コンパイルされた出力を実行していることを前提としています。
  - または、開発用、または`ts-node`がグローバルに利用可能で優先される場合は、`["npx", "ts-node", "/path/to/your/project/mcp/index.ts"]`を使用することもできます。
  - `index.js`または`index.ts`へのパスがシステムで正しいことを確認してください。
- **`env`**:
  - このブロックは、必要な環境変数をサーバープロセスに渡すために重要です。
  - `X_INTEGRATION_ID`: 特定のインテグレーションIDに設定する必要があります。
  - `SUPABASE_FUNCTION_URL`: Supabase `task-management` Edge Function (エッジ関数)のURLに設定する必要があります。
  - 将来サーバーが必要とする可能性のある他の環境変数を含めます。

この設定により、MCPクライアントはMCPサーバーを起動して通信でき、それがSupabase Edge Function (エッジ関数)へのブリッジとして機能します。

## GitHub Packagesへの公開

このセクションでは、`mcp`パッケージをGitHub Packagesに公開する方法について説明します。

### 前提条件

- **Node.jsとnpmのインストール**: システムにNode.js（npmを含む）がインストールされていることを確認してください。
- **GitHubパーソナルアクセストークン（PAT）**: `write:packages`スコープを持つPATが必要です。
    - GitHubの開発者設定から生成します。
    - **重要**: このPATはパスワードのように安全に保管してください。リポジトリにコミットしないでください。
- **`package.json`の`name`フィールドのスコープ**: `mcp/package.json`の`name`フィールドは、GitHub Packages用に正しくスコープ設定されている必要があります（例: `@USER/mcp`）。
    - **`USER`を実際のGitHubユーザー名または組織名に置き換えることを忘れないでください。**
- **`package.json` publishConfig**: `mcp/package.json`ファイルには、`publishConfig`セクションが含まれている必要があります:
    ```json
    "publishConfig": {
      "registry": "https://npm.pkg.github.com/"
    }
    ```
- **`package.json`リポジトリURL**: `mcp/package.json`ファイルには、GitHubリポジトリを指す`repository`フィールドが必要です:
    ```json
    "repository": {
      "type": "git",
      "url": "https://github.com/USER/MCP_REPO.git"
    }
    ```
    - **`USER`をGitHubのユーザー名/組織、`MCP_REPO`をリポジトリ名に置き換えることを忘れないでください。**

### 公開手順

1.  **GitHub Packagesでの認証**:
    npmにGitHub Packagesへの公開にPATを使用するように指示する必要があります。`~/.npmrc`ファイル（または堅牢性のためにWindows/macOS/Linuxでは`$HOME/.npmrc`）を次の行で作成または更新します:
    ```bash
    echo "//npm.pkg.github.com/:_authToken=YOUR_PAT" > ~/.npmrc
    ```
    - `YOUR_PAT`を実際のパーソナルアクセストークンに置き換えます。
    - この手順は、PATが変更されない限り、マシン上で一度だけ実行する必要があります。

2.  **mcpディレクトリへの移動**:
    ターミナルを開き、`mcp`パッケージディレクトリに変更します:
    ```bash
    cd /path/to/your/project/mcp
    ```

3.  **依存関係のインストール**:
    すべての依存関係が最新であることを確認します:
    ```bash
    npm install
    ```

4.  **パッケージのビルド**:
    TypeScriptコードをJavaScriptにコンパイルします。これは通常、`tsconfig.json`および`package.json`（"files"配列）で指定されているように、`build`または`dist`ディレクトリに出力されます。
    ```bash
    npm run build
    ```

5.  **パッケージの公開**:
    これで、パッケージをGitHub Packagesに公開できます:
    ```bash
    npm publish
    ```

### トラブルシューティング

公開中に問題が発生した場合:

- **PAT権限の確認**: PATに`write:packages`スコープがあることを確認してください。
- **`package.json`の確認**:
    - パッケージの`name`が正しくスコープ設定されていること（例: `@USER/mcp`）を再確認してください。
    - `publishConfig`セクションが存在し、正しいことを確認してください。
    - `repository.url`が正確であることを確認してください。
- **正しいディレクトリ**: `npm publish`を`mcp`ディレクトリ内（つまり、公開したい`package.json`を含むディレクトリ）から実行していることを確認してください。
- **npmバージョン**: まれに、古いnpmバージョンで問題が発生する場合があります。npmの更新を検討してください: `npm install -g npm@latest`。
- **既存のパッケージバージョン**: 同じバージョンのパッケージを2回公開することはできません。再公開する場合は、`package.json`の`version`をインクリメントしてください。
