-- スキーマ定義
create schema if not exists public;

-- カテゴリテーブル定義（マスターデータ）
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text, -- カテゴリの色（オプション）
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- インデックス
create index if not exists categories_name_idx on public.categories (name);

-- コメント
comment on table public.categories is 'タスクカテゴリマスターテーブル';
comment on column public.categories.id is 'カテゴリの一意識別子';
comment on column public.categories.name is 'カテゴリ名';
comment on column public.categories.color is 'カテゴリの色';
comment on column public.categories.description is 'カテゴリの説明';
comment on column public.categories.created_at is 'カテゴリ作成日時';
comment on column public.categories.updated_at is 'カテゴリ更新日時';
