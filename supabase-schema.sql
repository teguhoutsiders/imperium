-- =====================================================================
-- IMPERIUM · gudang data di Supabase
-- Tempel SELURUH isi file ini di Supabase › SQL Editor › New query › Run.
-- Aman dijalankan ulang.
-- =====================================================================

-- 0. Tabel percobaan sebelumnya (tasks, projects, links, finance, english)
--    tidak dipakai Imperium. Semuanya masih kosong, jadi dihapus saja.
drop table if exists public.tasks, public.projects, public.links, public.finance, public.english;

-- 1. Satu tabel untuk semua dokumen Imperium
--    (tugas, proyek, impian, keuangan, catatan, pengaturan, dll.)
create table if not exists public.docs (
  user_id  uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  id       text        not null,
  kind     text        not null default '',
  data     jsonb       not null default '{}'::jsonb,
  updated  timestamptz not null default clock_timestamp(),
  deleted  boolean     not null default false,
  primary key (user_id, id)
);
create index if not exists docs_user_updated on public.docs (user_id, updated);
create index if not exists docs_user_kind    on public.docs (user_id, kind);

-- 2. Keamanan: setiap baris hanya bisa dibaca/diubah pemiliknya
alter table public.docs enable row level security;
drop policy if exists "docs milik sendiri" on public.docs;
create policy "docs milik sendiri" on public.docs
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.docs from anon;
grant select, insert, update, delete on public.docs to authenticated;

-- 3. Simpan banyak perubahan sekaligus (set / ubah sebagian / hapus)
create or replace function public.imp_batch(ops jsonb)
returns timestamptz
language plpgsql
security invoker
set search_path = public
as $$
declare
  op  jsonb;
  uid uuid := auth.uid();
  ts  timestamptz := clock_timestamp();
begin
  if uid is null then
    raise exception 'Belum masuk' using errcode = '28000';
  end if;
  for op in select * from jsonb_array_elements(coalesce(ops, '[]'::jsonb)) loop
    if op->>'o' = 'set' then
      insert into public.docs as d (user_id, id, kind, data, updated, deleted)
      values (uid, op->>'id', coalesce(op->'d'->>'kind', ''), coalesce(op->'d', '{}'::jsonb), ts, false)
      on conflict (user_id, id) do update
        set kind = excluded.kind, data = excluded.data, updated = ts, deleted = false;
    elsif op->>'o' = 'upd' then
      update public.docs
         set data    = data || coalesce(op->'f', '{}'::jsonb),
             kind    = coalesce((data || coalesce(op->'f', '{}'::jsonb))->>'kind', kind),
             updated = ts
       where user_id = uid and id = op->>'id' and not deleted;
    elsif op->>'o' = 'del' then
      update public.docs
         set deleted = true, data = '{}'::jsonb, updated = ts
       where user_id = uid and id = op->>'id';
    end if;
  end loop;
  return ts;
end;
$$;
revoke all on function public.imp_batch(jsonb) from public, anon;
grant execute on function public.imp_batch(jsonb) to authenticated;

-- 4. Perubahan langsung muncul di perangkat lain (realtime)
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'docs') then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;

-- 5. Tempat berkas (foto, PDF, bukti bayar), privat
insert into storage.buckets (id, name, public, file_size_limit)
values ('imperium', 'imperium', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "imperium baca berkas sendiri"  on storage.objects;
drop policy if exists "imperium unggah berkas sendiri" on storage.objects;
drop policy if exists "imperium ubah berkas sendiri"  on storage.objects;
drop policy if exists "imperium hapus berkas sendiri" on storage.objects;

create policy "imperium baca berkas sendiri" on storage.objects for select to authenticated
  using (bucket_id = 'imperium' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "imperium unggah berkas sendiri" on storage.objects for insert to authenticated
  with check (bucket_id = 'imperium' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "imperium ubah berkas sendiri" on storage.objects for update to authenticated
  using (bucket_id = 'imperium' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "imperium hapus berkas sendiri" on storage.objects for delete to authenticated
  using (bucket_id = 'imperium' and (storage.foldername(name))[1] = (select auth.uid())::text);
