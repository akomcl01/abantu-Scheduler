# Abantu Scheduler

A simple, responsive scheduler for our FIFA group. We play **Wednesdays and Sundays**. One person — the **Any** — controls the whole team for a **whole FC27 season**; the next player in the squad order takes over at the next season, or early if the current player loses **3 in a row**.

- **Next up** – who's on the sticks, their losses in a row (3 triggers a handover), and recent results
- **Calendar** – who has each game, logged results, seasons and playoffs
- **Squad** – character names, teams, and the rotation order
- **Settings** – first player's start date, seasons, look (FC / Classic), share link, editing PIN

## Player cards

Each player gets an FC-style card. To use the real card from the game, save a screenshot/PNG as `public/cards/<name>.png` (lowercase, dashes for spaces, e.g. `big-mike.png`). Without a file the app draws a card from the position, overall and stats set in the Squad tab.

## Run

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # rotation logic tests
npm run build
```

## Share with the group (optional)

Without config the app runs in **local mode** (saved in your browser). To make one live schedule everyone sees:

1. Create a free [Supabase](https://supabase.com) project.
2. Run `supabase/schema.sql` in the SQL editor (change the default PIN `abantu`).
3. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
4. Deploy (e.g. Vercel) with the same two env vars. Everyone can view; editing needs the PIN.

Stack: Vite, React, TypeScript, Tailwind CSS v4, Supabase.
