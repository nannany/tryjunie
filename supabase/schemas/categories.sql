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

-- RLS (Row Level Security)
alter table public.categories enable row level security;

-- マスターデータの初期データ投入
insert into public.categories (name, color, description) values
  ('仕事', '#3b82f6', '業務関連のタスク'),
  ('個人', '#10b981', '個人的なタスク'),
  ('学習', '#8b5cf6', '学習・スキルアップ関連'),
  ('健康', '#ef4444', '健康・運動関連'),
  ('家事', '#f59e0b', '家事・生活関連'),
  ('その他', '#6b7280', 'その他のタスク')
on conflict (name) do nothing;

-- コメント
comment on table public.categories is 'タスクカテゴリマスターテーブル';
comment on column public.categories.id is 'カテゴリの一意識別子';
comment on column public.categories.name is 'カテゴリ名';
comment on column public.categories.color is 'カテゴリの色';
comment on column public.categories.description is 'カテゴリの説明';
comment on column public.categories.created_at is 'カテゴリ作成日時';
comment on column public.categories.updated_at is 'カテゴリ更新日時';
