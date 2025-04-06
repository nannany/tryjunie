-- スキーマ定義
create schema if not exists public;

-- テーブル定義
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  estimated_minute integer,
  due_date timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint status_check check (status in ('pending', 'in_progress', 'completed'))
);

-- インデックス
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_status_idx on public.tasks (status);

-- RLS (Row Level Security)
alter table public.tasks enable row level security;

-- RLSポリシー
-- 自分のタスクだけを取得できる
create policy "Users can view their own tasks" 
on public.tasks
for select 
to authenticated
using (auth.uid() = user_id);

-- 自分のタスクだけを作成できる
create policy "Users can create their own tasks" 
on public.tasks
for insert 
to authenticated
with check (auth.uid() = user_id);

-- 自分のタスクだけを更新できる
create policy "Users can update their own tasks" 
on public.tasks
for update 
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 自分のタスクだけを削除できる
create policy "Users can delete their own tasks" 
on public.tasks
for delete 
to authenticated
using (auth.uid() = user_id);

-- コメント
comment on table public.tasks is 'タスク管理テーブル';
comment on column public.tasks.id is 'タスクの一意識別子';
comment on column public.tasks.user_id is 'タスクの所有者ID';
comment on column public.tasks.title is 'タスクのタイトル';
comment on column public.tasks.description is 'タスクの詳細説明';
comment on column public.tasks.status is 'タスクのステータス(pending, in_progress, completed)';
comment on column public.tasks.due_date is 'タスクの期限';
comment on column public.tasks.estimated_minute is 'タスクの見積もり時間(分)';
comment on column public.tasks.created_at is 'タスク作成日時';
comment on column public.tasks.updated_at is 'タスク更新日時'; 