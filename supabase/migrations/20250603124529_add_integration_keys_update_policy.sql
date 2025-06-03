create policy "Anyone can update by key and user_id"
on "public"."integration_keys"
as permissive
for update
to public
using (((key IS NOT NULL) AND (user_id IS NOT NULL)))
with check (((key IS NOT NULL) AND (user_id IS NOT NULL)));



