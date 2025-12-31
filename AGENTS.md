# Repository Guidelines

## Project Structure & Module Organization
`ui/` は Vite + React 製の SPA で、`src/pages` に画面、`src/components` に再利用 UI、`src/contexts` と `src/reducers` に状態、`src/lib` にユーティリティ（`supabase/client.ts` など）、`src/test` に Vitest セットアップを配置します。公開アセットは `ui/public`、Tailwind・ESLint・TS 各種設定は `package.json` 直下に置いています。`supabase/` には SQL スキーマやマイグレーション、シード、Edge Functions（`functions/task-management`）をまとめ、`mcp/` では Supabase 関数を `create_task` ツールとして公開する Model Context Protocol ブリッジを提供します。

## Build, Test, and Development Commands
`ui/` 直下で `npm install` を実行したら、`npm run dev` で http://localhost:5173 の開発サーバーを起動、`npm run build` で `tsc`→Vite ビルド、`npm run preview` で `dist/` を確認できます。`npm run lint` は `ui/src` と `mcp/src` に同じ ESLint 設定を適用し、`npm run test` や `npm run test:ui` で Vitest + Testing Library を実行します。DB/Edge Functions は `supabase start`、`supabase migration up`、`supabase migration list`、`supabase functions deploy` などを `supabase/README.md` の手順に沿って利用してください。

## Coding Style & Naming Conventions
TypeScript + ES Modules を前提にインデントは 2 スペースで統一します。React コードは `vite.config.ts` の `@` エイリアスを使い (`import Card from "@/components/Card";`)、スタイルは Tailwind ユーティリティを基本とし、共有トークンは `tailwind.config.cjs`、補助 CSS は `src/styles` にまとめます。ESLint + `@typescript-eslint` + React/Hooks/React Refresh 構成で lint-staged がコミット時に Prettier を走らせます。意図的に未使用の変数は `_` プレフィックスで黙認させてください。

## Testing Guidelines
Vitest と Testing Library（jsdom + `@testing-library/jest-dom`）でフック、リデューサー、UI ロジックを検証します。テストファイルは `*.test.ts(x)` を推奨し、グローバル設定が必要なら `src/test/setup.ts` を拡張します。タスク CRUD、ドラッグ & ドロップ順序、認証ガード、インテグレーションキー通知など主要フローを押さえ、大きな変更をマージする前に `npm run test -- --coverage` でカバレッジを確認してください。

## Commit & Pull Request Guidelines
履歴はゆるやかな Conventional Commits (`feat:`, `fix:`, `chore(deps):` など) に従っています。件名は命令形 + 範囲で短くまとめ（例: `feat(tasks): support inline estimate edit`）、PR では目的、実行したテスト、影響する Supabase マイグレーションや MCP 変更、関連 Issue を記述します。UI に影響する場合はタスクカードやトースト、Integration Keys 画面のスクリーンショットを添付するとレビューが早まります。

## Security & Configuration Tips
フロントエンドは `ui/.env.local` に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` が必要です。MCP サーバーは `SUPABASE_FUNCTION_URL` と `X_INTEGRATION_ID` を設定したうえで `npx ts-node index.ts` もしくは `node dist/index.js` を実行してください。Supabase CLI で本番へアクセスする際は `SUPABASE_DB_PASSWORD` をシェルに読み込み、秘密情報は `.env.local`・`.envrc` など gitignore 済みのファイルやシークレットマネージャーで管理し、リポジトリに含めないよう徹底します。
