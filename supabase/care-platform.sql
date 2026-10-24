create table public.providers (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 2 and 100),
 slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=150),
 profession text not null check(profession in ('Therapist','Clinical psychologist','Psychiatrist','Counsellor')),
 credentials text not null check(length(credentials) between 2 and 200),
 registration text not null default '' check(length(registration)<=150),
 city text not null check(length(city) between 2 and 100),
 languages text[] not null default array['English'] check(cardinality(languages) between 1 and 12),
 specialties text[] not null default '{}' check(cardinality(specialties)<=20),
 modes text[] not null default array['Online'] check(modes <@ array['Online','In person']),
 bio text not null check(length(bio) between 20 and 3000),
 verified boolean not null default false,
 active boolean not null default false,
 created_at timestamptz not null default now(),
 check(not active or verified),
 check(profession not in ('Psychiatrist','Clinical psychologist') or not active or length(trim(registration))>0)
);
alter table public.providers enable row level security;
revoke all on public.providers from anon,authenticated;
grant select on public.providers to anon,authenticated;
grant insert,update,delete on public.providers to authenticated;
create policy "Public provider directory" on public.providers for select to anon using(active and verified);
create policy "Member provider visibility" on public.providers for select to authenticated using((active and verified) or exists(select 1 from public.site_admins where user_id=(select auth.uid())));
create policy "Admin provider creation" on public.providers for insert to authenticated with check(exists(select 1 from public.site_admins where user_id=(select auth.uid())));
create policy "Admin provider updates" on public.providers for update to authenticated using(exists(select 1 from public.site_admins where user_id=(select auth.uid()))) with check(exists(select 1 from public.site_admins where user_id=(select auth.uid())));
create policy "Admin provider removal" on public.providers for delete to authenticated using(exists(select 1 from public.site_admins where user_id=(select auth.uid())));
create table public.care_requests (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('consultation','provider_application','therapist_referral','patient_referral','partnership')),
 contact_name text not null check(length(trim(contact_name)) between 2 and 100),
 email text not null check(length(email)<=180 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 phone text not null default '' check(length(phone)<=30),
 city text not null check(length(trim(city)) between 2 and 100),
 service text not null check(length(service) between 2 and 100),
 mode text not null default 'Online' check(mode in ('Online','In person','Either')),
 language text not null default 'English' check(length(language) between 2 and 50),
 relationship text not null check(relationship in ('Adult seeking care','Parent or legal guardian','Professional enquiry')),
 professional_details text not null default '' check(length(professional_details)<=1000),
 provider_id uuid references public.providers(id) on delete set null,
 consent boolean not null check(consent),
 is_test boolean not null default true check(is_test),
 status text not null default 'new' check(status in ('new','reviewing','contacted','closed')),
 created_at timestamptz not null default now()
);
create index care_requests_created_idx on public.care_requests(created_at desc);
alter table public.care_requests enable row level security;
revoke all on public.care_requests from anon,authenticated;
grant insert(kind,contact_name,email,phone,city,service,mode,language,relationship,professional_details,provider_id,consent) on public.care_requests to anon,authenticated;
grant select,update,delete on public.care_requests to authenticated;
create policy "Submit test enquiry" on public.care_requests for insert to anon,authenticated with check(consent and is_test and status='new');
create policy "Admin enquiry visibility" on public.care_requests for select to authenticated using(exists(select 1 from public.site_admins where user_id=(select auth.uid())));
create policy "Admin enquiry updates" on public.care_requests for update to authenticated using(exists(select 1 from public.site_admins where user_id=(select auth.uid()))) with check(exists(select 1 from public.site_admins where user_id=(select auth.uid())));
create policy "Admin enquiry removal" on public.care_requests for delete to authenticated using(exists(select 1 from public.site_admins where user_id=(select auth.uid())));
