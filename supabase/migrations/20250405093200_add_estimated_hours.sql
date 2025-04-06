-- estimated_hoursカラムをtasksテーブルに追加
alter table public.tasks
add column estimated_hours numeric null;

comment on column public.tasks.estimated_hours is '見積もり時間（時間単位）'; 