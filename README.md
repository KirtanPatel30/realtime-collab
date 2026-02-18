# Realtime Collaboration App

A Google-Docs-style starter: **Supabase Auth + Workspaces + Documents + Realtime editing (Yjs) + Autosave + Presence (who's online)**.

## Tech
- Next.js (App Router) + TypeScript + Tailwind
- Supabase: Auth, Postgres, Realtime (broadcast + presence)
- TipTap editor + Yjs CRDT

## Setup

### 1) Install
```bash
npm install
```

### 2) Env vars
Copy `.env.example` to `.env.local` and fill values from Supabase:
- Supabase Dashboard → **Project Settings → API**

```bash
cp .env.example .env.local
```

### 3) Database schema + RLS
In Supabase Dashboard → **SQL Editor**, run:
- `supabase/schema.sql`

### 4) Enable Realtime
Supabase Dashboard → **Realtime**:
- Ensure Realtime is enabled for your project.
- Presence is used on the `doc:<docId>` channel.

### 5) Run
```bash
npm run dev
```
Open http://localhost:3000

## Features (current)
- Email/password sign in + sign up
- Create workspaces + documents
- Realtime collaborative editing (Yjs updates over Supabase Realtime broadcast)
- Autosave document snapshots to Postgres (`doc_content`)
- Presence: show **Online count** + **who is online**

## Useful scripts
```bash
npm run lint
npm run typecheck
```

## Notes
- `.env.local` is intentionally **not committed** (keys stay local).
- This step keeps permissions simple (owner/creator only). Next step is to make access **workspace-member based**.
