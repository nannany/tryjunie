-- Users can read their own integration keys
create policy "Users can read their own integration keys"
on public.integration_keys
for select
to authenticated
using (auth.uid() = user_id);
