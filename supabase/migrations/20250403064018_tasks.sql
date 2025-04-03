-- description: creating tasks table with appropriate RLS policies
create table public.tasks (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  due_date timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  primary key (id),
  constraint status_check check (status in ('pending', 'in_progress', 'completed'))
);

-- enable row level security
alter table public.tasks enable row level security;

-- create indices
create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_status_idx on public.tasks (status);

-- allow users to select their own tasks
create policy "Users can view their own tasks" 
on public.tasks
for select 
to authenticated
using (auth.uid() = user_id);

-- allow users to insert their own tasks
create policy "Users can create their own tasks" 
on public.tasks
for insert 
to authenticated
with check (auth.uid() = user_id);

-- allow users to update their own tasks
create policy "Users can update their own tasks" 
on public.tasks
for update 
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- allow users to delete their own tasks
create policy "Users can delete their own tasks" 
on public.tasks
for delete 
to authenticated
using (auth.uid() = user_id);

comment on table public.tasks is 'Stores user tasks and their details';