-- Stillwell CMS. Apply with the Supabase migration tool.
create table public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.site_admins enable row level security;
revoke all on public.site_admins from anon, authenticated;
grant select on public.site_admins to authenticated;
create policy "Administrators can verify their own membership" on public.site_admins
for select to authenticated using (user_id = (select auth.uid()));

create table public.posts (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 150),
  title text not null check (length(trim(title)) between 1 and 110),
  excerpt text not null default '' check (length(excerpt) <= 260),
  body text not null check (length(trim(body)) between 1 and 100000),
  image text not null default '/assets/slow.jpg' check (length(image) <= 2048),
  image_alt text not null default '' check (length(image_alt) <= 200),
  category text not null check (category in ('Everyday wellbeing','Starting therapy','Relationships')),
  tags text[] not null default '{}' check (cardinality(tags) <= 12),
  date date not null default current_date,
  status text not null default 'draft' check (status in ('draft','published')),
  seo_title text not null default '' check (length(seo_title) <= 70),
  seo_description text not null default '' check (length(seo_description) <= 180),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_published_date_idx on public.posts (date desc, created_at desc) where status = 'published';
alter table public.posts enable row level security;
revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
create policy "Visitors can read published articles" on public.posts for select
to anon using (status = 'published');
create policy "Members read published articles or administer" on public.posts for select to authenticated
using (status = 'published' or exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy "Administrators can create articles" on public.posts for insert to authenticated
with check (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy "Administrators can update articles" on public.posts for update to authenticated
using (exists (select 1 from public.site_admins where user_id = (select auth.uid())))
with check (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy "Administrators can delete articles" on public.posts for delete to authenticated
using (exists (select 1 from public.site_admins where user_id = (select auth.uid())));

create function public.touch_post() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  new.version = old.version + 1;
  new.created_at = old.created_at;
  return new;
end;
$$;
revoke execute on function public.touch_post() from public, anon, authenticated;
create trigger posts_touch before update on public.posts for each row execute function public.touch_post();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 2097152, array['image/jpeg','image/png','image/webp']);
create policy "Administrators can inspect blog images" on storage.objects for select to authenticated
using (bucket_id = 'blog-images' and exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy "Administrators can upload blog images" on storage.objects for insert to authenticated
with check (bucket_id = 'blog-images' and exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy "Administrators can remove blog images" on storage.objects for delete to authenticated
using (bucket_id = 'blog-images' and exists (select 1 from public.site_admins where user_id = (select auth.uid())));
