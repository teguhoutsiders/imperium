-- =========================================================
-- IMPERIUM - Skrip pembuat tabel Supabase
-- Tempel semua isi file ini di SQL Editor, lalu klik Run.
-- =========================================================

-- 1. TUGAS (Planner)
create table public.tasks (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  judul      text not null,
  catatan    text,
  status     text not null default 'todo'   check (status in ('todo','doing','done')),
  prioritas  text not null default 'sedang' check (prioritas in ('rendah','sedang','tinggi')),
  tenggat    date,
  dibuat     timestamptz not null default now()
);

-- 2. PROYEK
create table public.projects (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nama       text not null,
  deskripsi  text,
  status     text not null default 'aktif' check (status in ('aktif','jeda','selesai')),
  progres    int  not null default 0 check (progres between 0 and 100),
  mulai      date,
  target     date,
  dibuat     timestamptz not null default now()
);

-- 3. KUMPULAN LINK (Files)
create table public.links (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  judul      text not null,
  url        text not null,
  kategori   text,
  catatan    text,
  dibuat     timestamptz not null default now()
);

-- 4. KEUANGAN (income, expense, asset, liability)
create table public.finance (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  jenis      text not null check (jenis in ('income','expense','asset','liability')),
  kategori   text,
  keterangan text,
  jumlah     numeric(15,2) not null default 0,
  tanggal    date not null default current_date,
  dibuat     timestamptz not null default now()
);

-- 5. ENGLISH (kosakata)
create table public.english (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kata       text not null,
  arti       text,
  contoh     text,
  status     text not null default 'baru' check (status in ('baru','belajar','hafal')),
  dibuat     timestamptz not null default now()
);

-- =========================================================
-- KEAMANAN: setiap data hanya bisa dibaca/diubah pemiliknya
-- =========================================================
alter table public.tasks    enable row level security;
alter table public.projects enable row level security;
alter table public.links    enable row level security;
alter table public.finance  enable row level security;
alter table public.english  enable row level security;

create policy "pemilik saja" on public.tasks    for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pemilik saja" on public.projects for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pemilik saja" on public.links    for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pemilik saja" on public.finance  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pemilik saja" on public.english  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Index supaya pencarian per pengguna tetap cepat
create index on public.tasks    (user_id);
create index on public.projects (user_id);
create index on public.links    (user_id);
create index on public.finance  (user_id, tanggal);
create index on public.english  (user_id);
