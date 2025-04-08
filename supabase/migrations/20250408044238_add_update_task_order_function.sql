set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_task_order(p_id uuid, p_user_id uuid, p_task_date date, p_task_order integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;


