# Abantu Scheduler

A simple, responsive scheduler for our FIFA group. We play **Wednesdays and Sundays**. One person — the **Coach** — controls the whole team for a **whole FC27 season**; the next player in the squad order takes over at the next season, or early if the current player loses **3 in a row**.

- **Home** – the week, who's on the sticks (and who was before and who's next), their losses in a row (3 triggers a handover popup), one-tap game logging, next games
- **Calendar** – who has each game, logged results, seasons and playoffs
- **Squad** – players, their card pictures, and the rotation order
- **Goals** – goal of the week: players upload a clip, everyone votes, the winner is announced every Sunday (with a countdown)
- **Settings** – first player's start date, seasons, handovers, look (FC / Classic), share link, editing PIN

## Records

Results are split into **League** and **Playoffs** (toggle above the Win / Draw / Loss buttons). The record cards (with an optional screenshot of the in-game record) are built but not shown on any screen at the moment.

## Player cards

Each player gets an FC-style card. To use the real card from the game, save a screenshot/PNG as `public/cards/<name>.png` (lowercase, dashes for spaces, e.g. `big-mike.png`). The card is only a frame for that picture. You can also upload or paste it in Squad → Edit card; it is saved to the database.

## Run

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # rotation logic tests
npm run build
```

## Share with the group (Firebase)

Without config the app runs in **local mode** (saved on this device only). To make one live schedule everyone sees:

1. [Firebase console](https://console.firebase.google.com) > **Add project** (the free Spark plan is enough).
2. **Build > Firestore Database** > Create database (production mode, any region).
3. **Build > Authentication** > Get started > enable **Email/Password**. Then **Users > Add user**: email `abantu-editor@abantu.app`, password = **the group PIN**. (Use another email if you like, and change it in `firestore.rules` and `.env` too.)
4. **Project settings > Your apps > Web (`</>`)**: register an app and copy `apiKey`, `projectId`, `appId`.
5. Copy `.env.example` to `.env` and fill those three values.
6. **Firestore > Rules**: paste the contents of `firestore.rules` and Publish. (Or `npx firebase-tools deploy --only firestore:rules`.)
7. `npm run dev` and open Settings. Unlock editing with the PIN.

Everyone can read the schedule. Only someone who knows the PIN can change it. Games are stored one document each, so two people logging at the same time never overwrite each other. Record screenshots are stored in Firestore (compressed), not Cloud Storage, so no paid plan is needed.

The site is hosted on **Vercel**: `vercel deploy --prod --scope <your-team>` (set the same `VITE_FIREBASE_*` values as Vercel environment variables first, since Vite bakes them in at build time). Publish rule changes with `npx firebase-tools deploy --only firestore:rules --project <project-id>`.

## Goal of the week (Vercel Blob)

Videos upload from the phone to Vercel Blob through `api/upload.ts`. One-time setup:

1. Vercel dashboard > your project > **Storage** > **Create Database** > **Blob** (public access). This adds `BLOB_READ_WRITE_TOKEN` to the project.
2. Publish the new `clips` and `votes` rules in `firestore.rules` (step 6 above).
3. Redeploy. For local testing use `vercel env pull .env.local` and `npx vercel dev` (plain `npm run dev` has no `/api`, so uploads fail there; everything else works).

Players don't use the PIN. Their names are protected by personal codes:

1. Firebase console > **Authentication > Sign-in method** > turn on **Anonymous**.
2. Publish `firestore.rules` (it adds `codes`, `claims`, `clips`, `votes`, `comments`).
3. In the app: Settings > **Player codes** (unlock editing first) > **Make codes**. Send each player their own code privately.
4. Each player opens Goals > **Who are you?**, picks their name and enters their code once. A new code (the **New** button) signs that player's old phone out.

 It kicks off on the Sunday set by `GOALS_START` in `src/lib/goals.ts` (11 Oct 2026). Weeks run Sunday to Sunday: voting is open all week, and the next Sunday the winner is announced and a new week opens.

Stack: Vite, React, TypeScript, Tailwind CSS v4, Firebase (Firestore + Auth), Vercel Blob.
