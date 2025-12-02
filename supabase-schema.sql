-- Create encoded_files table to store encoded data
-- This prevents UI lag by storing large encoded data in database instead of state

create table if not exists encoded_files (
  id uuid primary key default gen_random_uuid(),
  data text not null,
  file_count integer default 1,
  total_size bigint,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '24 hours'),
  access_count integer default 0
);

-- Enable Row Level Security
alter table encoded_files enable row level security;

-- Allow anyone to read (for QR code sharing)
create policy "Allow public read access"
  on encoded_files
  for select
  to anon
  using (true);

-- Allow anyone to insert
create policy "Allow public insert"
  on encoded_files
  for insert
  to anon
  with check (true);

-- Create index for faster lookups
create index if not exists idx_encoded_files_created_at on encoded_files(created_at);
create index if not exists idx_encoded_files_expires_at on encoded_files(expires_at);

-- Auto-delete expired records (optional cleanup)
create or replace function delete_expired_encoded_files()
returns void as $$
begin
  delete from encoded_files where expires_at < now();
end;
$$ language plpgsql;
