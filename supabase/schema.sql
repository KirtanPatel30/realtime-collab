-- Realtime Collab App (Step 1/2) - Supabase schema
-- Run in Supabase SQL Editor.

-- Needed for uuid_generate_v4()
create extension if not exists "uuid-ossp";

-- Profiles (one row per auth user)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamp with time zone default now()
);

-- Workspaces
create table if not exists workspaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Workspace members (future: role-based access)
create table if not exists workspace_members (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'editor',
  created_at timestamp with time zone default now(),
  unique (workspace_id, user_id)
);

-- Documents
create table if not exists documents (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  title text default 'Untitled Document',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Document snapshots (Yjs state encoded as base64)
create table if not exists doc_content (
  id uuid primary key references documents(id) on delete cascade,
  content text,
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table documents enable row level security;
alter table doc_content enable row level security;

-- Profiles policies
create policy "profiles_select_own" on profiles
for select using (auth.uid() = id);

create policy "profiles_upsert_own" on profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
for update using (auth.uid() = id);

-- Workspaces policies (Step 1: owner-only)
create policy "workspaces_insert_owner" on workspaces
for insert with check (auth.uid() = owner);

create policy "workspaces_select_owner" on workspaces
for select using (auth.uid() = owner);

-- Workspace members policies (owner can add members later)
create policy "members_select_owner" on workspace_members
for select using (
  exists(
    select 1 from workspaces w
    where w.id = workspace_members.workspace_id
      and w.owner = auth.uid()
  )
);

-- Documents policies (Step 1: creator-only)
create policy "documents_insert_creator" on documents
for insert with check (auth.uid() = created_by);

create policy "documents_select_creator" on documents
for select using (auth.uid() = created_by);

-- Doc content policies (Step 1: creator-only via documents)
create policy "doc_content_upsert_creator" on doc_content
for insert with check (
  exists(select 1 from documents d where d.id = doc_content.id and d.created_by = auth.uid())
);

create policy "doc_content_update_creator" on doc_content
for update using (
  exists(select 1 from documents d where d.id = doc_content.id and d.created_by = auth.uid())
);

create policy "doc_content_select_creator" on doc_content
for select using (
  exists(select 1 from documents d where d.id = doc_content.id and d.created_by = auth.uid())
);
