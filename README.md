# 7315-CTR0 EC — Manuscript System

## Install & run

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Build for production

```bash
npm run build
npm start
```

## Deploy to Vercel

Push to a GitHub repo, connect to Vercel, done. No env vars needed yet (auth comes later).

## What's here

- Rich text editor (TipTap) with formatting toolbar: H1/H2/H3, Bold, Italic, Strikethrough, Monospace, Block Quote
- Keyboard shortcuts: ⌘B bold, ⌘I italic, etc.
- Drag-and-drop chapter reordering
- Inline chapter rename (double-click)
- Character profiles with photo upload
- Trash system with restore / permanent delete
- 30-day word count graph
- Export to .md and .docx

## Coming next (Supabase backend)

- `chapters` table: id, title, content, position, created_at, updated_at
- `characters` table: id, name, age, appearance, history, role, arc, photo_url
- `word_count_log` table: date, count
- Supabase Storage bucket for character photos
- Env var password auth via middleware
