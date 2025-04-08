alter table "public"."tasks" drop constraint "status_check";

drop index if exists "public"."tasks_status_idx";

alter table "public"."tasks" drop column "status";


