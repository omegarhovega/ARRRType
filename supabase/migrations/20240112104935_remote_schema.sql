create policy "Update (public)"
on "public"."games"
as permissive
for update
to public
using (true)
with check (true)