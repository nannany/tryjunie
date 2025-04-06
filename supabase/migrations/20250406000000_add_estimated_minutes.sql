-- estimated_minutesカラムをtasksテーブルに追加
alter table public.tasks
add column estimated_minutes integer null;

comment on column public.tasks.estimated_minutes is '見積もり時間（分単位）'; 