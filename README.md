# Abantu Scheduler

A simple, responsive scheduler for our FIFA group. We play **Wednesdays and Sundays**. One person — the **Coach** — controls the whole team for a **whole FC27 season**; the next player in the squad order takes over at the next season, or early if the current player loses **3 in a row**.

- **Next up** – who's on the sticks, their losses in a row (3 triggers a handover), and recent results
- **Calendar** – who has each game, logged results, seasons and playoffs
- **Squad** – character names, teams, and the rotation order
- **Goals** – goal of the week: players upload a clip, everyone votes, the winner is announced on Sunday
- **Settings** – first player's start date, seasons, look (FC / Classic), share link, editing PIN

## Records

Results are split into **League** and **Playoffs** (toggle above the Win / Draw / Loss buttons). Each record card also takes an optional screenshot of the in-game record, so it works even if you don't log every game.

## Player cards

Each player gets an FC-style card. To use the real card from the game, save a screenshot/PNG as `public/cards/<name>.png` (lowercase, dashes for spaces, e.g. `big-mike.png`). Without a file the app draws a card from the position, overall and stats set in the Squad tab.

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

To publish the site: `npm run build`, then `npx firebase-tools deploy --only hosting` (set your project with `npx firebase-tools use <project-id>` first).

## Goal of the week (Vercel Blob)

Videos upload from the phone to Vercel Blob through `api/upload.ts`. One-time setup:

1. Vercel dashboard > your project > **Storage** > **Create Database** > **Blob** (public access). This adds `BLOB_READ_WRITE_TOKEN` to the project.
2. Publish the new `clips` and `votes` rules in `firestore.rules` (step 6 above).
3. Redeploy. For local testing use `vercel env pull .env.local` and `npx vercel dev` (plain `npm run dev` has no `/api`, so uploads fail there; everything else works).

Players pick their name in the Goals tab (no PIN). Weeks run Monday to Sunday; voting is open Monday to Saturday and the winner is announced on Sunday.

Stack: Vite, React, TypeScript, Tailwind CSS v4, Firebase (Firestore + Auth), Vercel Blob.
