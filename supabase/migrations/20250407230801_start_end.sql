alter table "public"."tasks" drop column "due_date";

alter table "public"."tasks" drop column "estimated_minutes";

alter table "public"."tasks" add column "end_time" timestamp with time zone;

alter table "public"."tasks" add column "estimated_minute" integer;

alter table "public"."tasks" add column "start_time" timestamp with time zone;


