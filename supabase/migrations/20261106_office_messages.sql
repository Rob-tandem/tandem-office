-- Tandem Office: text messages + speech transcripts. Run once on the cockpit project (epdrqklfolvvvusaxfpo).
create table if not exists public.office_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  office text not null default '',
  kind text not null check (kind in ('text','said','system')),
  sender text not null,
  audience text not null check (audience in ('nearby','everyone','direct')),
  recipients text[],
  zone text,
  body text not null check (char_length(body) <= 4000)
);
create index if not exists office_messages_office_created_idx on public.office_messages (office, created_at);
alter table public.office_messages enable row level security;
create policy "office anon read" on public.office_messages for select to anon, authenticated using (true);
create policy "office anon insert" on public.office_messages for insert to anon, authenticated with check (true);
comment on table public.office_messages is 'Tandem Office (virtual office) text messages and speech transcripts. Exported daily to TeamOS co-owned/office/log/.';
