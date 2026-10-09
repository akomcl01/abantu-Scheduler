# Abantu Scheduler

A simple, responsive scheduler for our FIFA group. We play **Wednesdays** (group night) and **Sundays** (one person controls the whole team, rotating in a fixed loop).

- **Next up** – who's on the sticks this Sunday, and who follows
- **Calendar** – month grid on desktop, agenda on mobile; tap a Sunday to swap or skip
- **Squad** – character names, teams, and the rotation order
- **Settings** – rotation start date, share link, editing PIN

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
