-- Admin private notes for listings
create table if not exists public.admin_notes (
    id uuid primary key default uuid_generate_v4(),
    listing_id uuid not null references public.listings(id) on delete cascade,
    admin_id uuid not null references public.profiles(id) on delete cascade,
    note text not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_admin_notes_listing_id on public.admin_notes(listing_id);
create index if not exists idx_admin_notes_admin_id on public.admin_notes(admin_id);
create index if not exists idx_admin_notes_created_at on public.admin_notes(created_at desc);

alter table public.admin_notes enable row level security;

drop policy if exists "admin_notes_super_admin_select" on public.admin_notes;
create policy "admin_notes_super_admin_select"
on public.admin_notes
for select
to authenticated
using (
    exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'super_admin'
          and p.is_active = true
    )
);

drop policy if exists "admin_notes_super_admin_insert" on public.admin_notes;
create policy "admin_notes_super_admin_insert"
on public.admin_notes
for insert
to authenticated
with check (
    admin_id = auth.uid()
    and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'super_admin'
          and p.is_active = true
    )
);

drop policy if exists "admin_notes_super_admin_update" on public.admin_notes;
create policy "admin_notes_super_admin_update"
on public.admin_notes
for update
to authenticated
using (
    exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'super_admin'
          and p.is_active = true
    )
)
with check (
    exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'super_admin'
          and p.is_active = true
    )
);

drop policy if exists "admin_notes_super_admin_delete" on public.admin_notes;
create policy "admin_notes_super_admin_delete"
on public.admin_notes
for delete
to authenticated
using (
    exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'super_admin'
          and p.is_active = true
    )
);
