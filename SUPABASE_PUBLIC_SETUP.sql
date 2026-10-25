-- Public-access configuration for the no-login family event website.
-- This deliberately allows unauthenticated visitors to READ the RSVP first names / group sizes
-- and ADD entries. It does NOT allow anonymous visitors to UPDATE or DELETE existing entries.
-- Review these policies before executing them in the Supabase SQL Editor.

alter table public.rsvps enable row level security;
alter table public.bring_items enable row level security;

grant usage on schema public to anon;

-- Remove table-wide and prior column-level grants for public visitors first.
revoke all privileges on table public.rsvps from anon;
revoke all privileges on table public.rsvps from public;
revoke select (id, name, person_count, note, created_by, created_at) on public.rsvps from anon;
revoke select (id, name, person_count, note, created_by, created_at) on public.rsvps from public;
revoke insert (id, name, person_count, note, created_by, created_at) on public.rsvps from anon;
revoke insert (id, name, person_count, note, created_by, created_at) on public.rsvps from public;
revoke update (id, name, person_count, note, created_by, created_at) on public.rsvps from anon;
revoke update (id, name, person_count, note, created_by, created_at) on public.rsvps from public;
revoke delete on table public.rsvps from anon;
revoke delete on table public.rsvps from public;

-- Only the public fields displayed by the website are readable, and only the needed fields are insertable.
grant select (name, person_count) on public.rsvps to anon;
grant insert (name, person_count) on public.rsvps to anon;

-- The bring list is hidden for now. Keep it unavailable to anonymous visitors.
revoke all privileges on table public.bring_items from anon;
revoke all privileges on table public.bring_items from public;
revoke select (id, item, who, created_by, created_at) on public.bring_items from anon;
revoke select (id, item, who, created_by, created_at) on public.bring_items from public;
revoke insert (id, item, who, created_by, created_at) on public.bring_items from anon;
revoke insert (id, item, who, created_by, created_at) on public.bring_items from public;
revoke update (id, item, who, created_by, created_at) on public.bring_items from anon;
revoke update (id, item, who, created_by, created_at) on public.bring_items from public;
revoke delete on table public.bring_items from anon;
revoke delete on table public.bring_items from public;

drop policy if exists "Public can read bring list" on public.bring_items;
drop policy if exists "Public can add bring items" on public.bring_items;

-- The RSVP list is intentionally public.
drop policy if exists "Public can read RSVP list" on public.rsvps;
create policy "Public can read RSVP list"
    on public.rsvps for select to anon
    using (true);

drop policy if exists "Public can submit RSVP" on public.rsvps;
create policy "Public can submit RSVP"
    on public.rsvps for insert to anon
    with check (
        created_by is null
        and name is not null
        and char_length(btrim(name)) between 1 and 40
        and person_count between 1 and 20
    );

-- No public UPDATE or DELETE policy is created. Manage removals from the Supabase dashboard.
-- Anonymous public submissions can be spammed; there is no server-side rate limit in this static site.
-- Delete old test RSVP rows from Supabase Table Editor before going live.
