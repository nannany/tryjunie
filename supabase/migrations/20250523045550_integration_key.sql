create table "public"."integration_keys" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "key" text not null,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "last_used_at" timestamp with time zone,
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."integration_keys" enable row level security;

CREATE INDEX integration_keys_key_idx ON public.integration_keys USING btree (key);

CREATE UNIQUE INDEX integration_keys_key_key ON public.integration_keys USING btree (key);

CREATE UNIQUE INDEX integration_keys_pkey ON public.integration_keys USING btree (id);

CREATE INDEX integration_keys_user_id_idx ON public.integration_keys USING btree (user_id);

alter table "public"."integration_keys" add constraint "integration_keys_pkey" PRIMARY KEY using index "integration_keys_pkey";

alter table "public"."integration_keys" add constraint "integration_keys_key_key" UNIQUE using index "integration_keys_key_key";

alter table "public"."integration_keys" add constraint "integration_keys_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."integration_keys" validate constraint "integration_keys_user_id_fkey";

grant delete on table "public"."integration_keys" to "anon";

grant insert on table "public"."integration_keys" to "anon";

grant references on table "public"."integration_keys" to "anon";

grant select on table "public"."integration_keys" to "anon";

grant trigger on table "public"."integration_keys" to "anon";

grant truncate on table "public"."integration_keys" to "anon";

grant update on table "public"."integration_keys" to "anon";

grant delete on table "public"."integration_keys" to "authenticated";

grant insert on table "public"."integration_keys" to "authenticated";

grant references on table "public"."integration_keys" to "authenticated";

grant select on table "public"."integration_keys" to "authenticated";

grant trigger on table "public"."integration_keys" to "authenticated";

grant truncate on table "public"."integration_keys" to "authenticated";

grant update on table "public"."integration_keys" to "authenticated";

grant delete on table "public"."integration_keys" to "service_role";

grant insert on table "public"."integration_keys" to "service_role";

grant references on table "public"."integration_keys" to "service_role";

grant select on table "public"."integration_keys" to "service_role";

grant trigger on table "public"."integration_keys" to "service_role";

grant truncate on table "public"."integration_keys" to "service_role";

grant update on table "public"."integration_keys" to "service_role";

create policy "Users can create their own integration keys"
on "public"."integration_keys"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can delete their own integration keys"
on "public"."integration_keys"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can update their own integration keys"
on "public"."integration_keys"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



