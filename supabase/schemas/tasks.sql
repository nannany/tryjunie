-- スキーマ定義
create schema if not exists public;

-- テーブル定義
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  estimated_minute integer,
  task_order integer,
  task_date date not null default current_date,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- インデックス
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_category_id_idx on public.tasks (category_id);

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

-- task_order 順にソートして、 task_order とその次の task_order の値の平均値にtask_orderを更新する
create or replace function public.update_task_order(
  p_id uuid,
  p_user_id uuid,
  p_task_date date,
  p_task_order integer
)
returns void as $$
declare
  next_task_order integer;
  new_task_order integer;
begin

  select task_order into next_task_order
  from public.tasks
  where user_id = p_user_id
    and task_date = p_task_date
    and task_order > p_task_order
  order by task_order asc
  limit 1;

  if next_task_order is not null then
    new_task_order := (p_task_order + next_task_order) / 2;
  else
    new_task_order := p_task_order + 1000;
  end if;

  update public.tasks
  set task_order = new_task_order,
      updated_at = now()
  where id = p_id;

end;
$$ language plpgsql;

-- コメント
comment on table public.tasks is 'タスク管理テーブル';
comment on column public.tasks.id is 'タスクの一意識別子';
comment on column public.tasks.user_id is 'タスクの所有者ID';
comment on column public.tasks.title is 'タスクのタイトル';
comment on column public.tasks.description is 'タスクの詳細説明';
comment on column public.tasks.estimated_minute is 'タスクの見積もり時間(分)';
comment on column public.tasks.start_time is 'タスクの開始時間';
comment on column public.tasks.end_time is 'タスクの終了時間';
comment on column public.tasks.created_at is 'タスク作成日時';
comment on column public.tasks.updated_at is 'タスク更新日時';
comment on column public.tasks.category_id is 'タスクが属するカテゴリID'; 