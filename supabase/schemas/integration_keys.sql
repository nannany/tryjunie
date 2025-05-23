-- インテグレーションキーテーブル定義
create table if not exists public.integration_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key text not null unique,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  last_used_at timestamp with time zone,
  updated_at timestamp with time zone not null default now()
);

-- インデックス
create index if not exists integration_keys_user_id_idx on public.integration_keys (user_id);
create index if not exists integration_keys_key_idx on public.integration_keys (key);

-- RLS (Row Level Security)
alter table public.integration_keys enable row level security;

-- 自分のインテグレーションキーだけを作成できる
create policy "Users can create their own integration keys" 
on public.integration_keys
for insert 
to authenticated
with check (auth.uid() = user_id);

-- 自分のインテグレーションキーだけを更新できる
create policy "Users can update their own integration keys" 
on public.integration_keys
for update 
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 自分のインテグレーションキーだけを削除できる
create policy "Users can delete their own integration keys" 
on public.integration_keys
for delete 
to authenticated
using (auth.uid() = user_id);

-- Users can read their own integration keys
create policy "Users can read their own integration keys"
on public.integration_keys
for select
to authenticated
using (auth.uid() = user_id);

-- コメント
comment on table public.integration_keys is 'インテグレーションキー管理テーブル';
comment on column public.integration_keys.id is 'インテグレーションキーの一意識別子';
comment on column public.integration_keys.user_id is 'キーの所有者ID';
comment on column public.integration_keys.name is 'キーの名前（用途など）';
comment on column public.integration_keys.key is 'インテグレーションキー文字列';
comment on column public.integration_keys.is_active is 'キーが有効かどうか';
comment on column public.integration_keys.created_at is 'キー作成日時';
comment on column public.integration_keys.last_used_at is 'キー最終使用日時';
comment on column public.integration_keys.updated_at is 'キー更新日時';
