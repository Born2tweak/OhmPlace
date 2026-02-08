# OhmPlace

A campus-only marketplace for students to buy, sell, and trade parts. Verified `.edu` emails only.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS
- **Backend**: Supabase (Auth, Postgres)
- **Deployment**: Vercel (planned)

## Getting Started

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000

## Project Status

- [x] Phase 1: Foundation & Auth
- [ ] Phase 2: Marketplace Core (Supply)
- [ ] Phase 3: Marketplace Core (Demand)
- [ ] Phase 4: Interactions
- [ ] Phase 5: Polish & Launch
