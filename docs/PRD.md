# Abantu Scheduler: Product Requirements

Source of truth for what the app is. Update this before changing behaviour.

## Problem
Our FIFA (EA FC 27 Pro Clubs) group keeps asking "who is the Coach this week?" and nobody remembers the record. We need one place that says who has the team, how they are doing, and when the next change happens.

## Users
Our friend group (about 4 to 8 people), mostly on phones. One shared view. A few people edit; everyone reads.

## Core rules
- One **Coach** controls the whole Abantu team on **Wednesdays and Sundays**.
- A Coach keeps the team for a **whole season and through the playoffs**. At the next season start the next Coach in the squad order takes over. Playoffs have a start date and an optional last day; with no last day they run on until one is set (or the next season starts), and the Coach keeps the team.
- A Coach is **benched after 3 losses in a row** and the next Coach takes over early. A win or a draw breaks the streak. League and playoff games both count. The streak only counts games since that Coach took over.
- Order of play is the squad order, and it loops.
- Many games can be played in a day. Every game is logged with one tap (Win, Draw, Loss), tagged League or Playoffs.
- A game counts for whoever was Coach when it was played.

## Features (built)
| Area | What it does |
|---|---|
| Home | Week strip first (Mon to Sun, Coach and games per day, playoff days tinted), Coach card, losses-in-a-row dots, **Previous** (with dates) and **Next up** side by side, one-tap game logging, order of play, next games (playoff games highlighted, with a note when the playoffs have no end date yet) |
| Handover popup | When a loss makes the streak 3, editors get a "Handover time" popup to appoint the next Coach (or Not now). Everyone else sees the red alert on Home |
| Records | League and Playoff W/D/L cards with an optional in-game record screenshot. **Not on any screen right now** (taken off Home to keep it simple); each coach's profile in Squad still shows their overall record and career |
| Calendar | Month grid with Coach per game day, results, playoff range shaded gold, seasons list (every Coach in a season, e.g. Theo → Olamide), playoffs and events with trophy markers |
| Squad | player card frames with the player's name under each card; Squad view and coach league table (win rate, form); coach profile with season-by-season career |
| Handover ceremony | On a Coach change: "Comunicado Oficial" thank-you, then a fun contract to sign. Wording is templated in `src/lib/messages.ts` with seeded variations |
| Goals | Goal of the week: each player uploads one clip a week, everyone votes, the winner is announced every Sunday (the 2nd game day), with a countdown. Every week's winner is kept in **The Vault**, a tab inside Goals next to This week (previous best goals, newest first, tap to play) |
| Settings | First player start date, seasons, **Handovers** (add or remove an early handover with an exact time, so past changeovers can be recorded; entries before the start date are flagged as ignored), FC or Classic look, share link, replay ceremony |

## Goal of the week
- **Kickoff: Sunday 11 Oct 2026** (`GOALS_START` in `src/lib/goals.ts`). Until then the Goals tab shows a countdown and how it works; nothing can be uploaded.
- A week runs **Sunday to Saturday**. Each player uploads **one clip per week** (uploading again replaces it). Anyone can watch.
- **Voting**: one vote per player per week, changeable until voting closes, **never for your own clip**. Vote counts are hidden until the winner is announced.
- **Open all week. The next Sunday (the 2nd game day) voting for that week closes, the winner is announced and a new week opens.** A live countdown on Goals shows the time left to the kickoff, then to each Sunday. Last week's winner stays on top of Goals for the week. Most votes wins; a tie goes to the earlier upload; no votes means no winner.
- **Looks like an Instagram post**: each clip is a post card (player, video, upvote button, caption, comments). The upvote is the vote above (one per week, can move it to another clip). Anyone who has picked their name can **comment** (up to 280 characters, any time, including after the winner is announced). Comments are stored in `comments/{id}`.
- **The Vault** is a tab inside Goals: "This week" (watch, upvote, comment) and "The Vault". It lists the winning clip of every finished week, newest first. Nothing is deleted: clips and votes stay in Firestore and Blob, and winners are worked out from them, so the vault builds itself.
- **Who you are is verified, not just picked.** The Coach makes a **personal code** per player in Settings (Player codes, editing unlocked) and sends it privately. A player picks their name and enters the code once; that **claims** the name for their phone (each phone has its own anonymous Firebase sign-in, separate from the editor's PIN sign-in). Firestore only accepts a clip, upvote or comment from the phone that holds that player's claim, so switching name to vote again needs someone else's code. A new code signs the old phone out (lost phone, leaked code). Local mode (no Firebase) skips this and is a plain name picker. Known limits: a player who hands their code to someone lets that person vote as them, and one person holding two codes could vote twice; the video upload route is not identity-checked, only size- and type-limited.
- Videos are uploaded straight from the phone to **Vercel Blob** (public URLs, video files only, up to 100 MB) through `api/upload.ts`. Firestore keeps only `clips/{week__playerId}` (title + URL) and `votes/{week__voterId}`. Without Firebase config, clips and votes are saved on the device; uploading still needs the deployed app (or `vercel dev`).
- Rules live in `src/lib/goals.ts` (pure, unit tested).

## Design
- Default look mimics the FC 27 Pro Clubs menu (dark, white italic headings, mint accent, gold highlights). "Classic" is the warm paper variant.
- Mobile first. Floating pill nav at the bottom at every size.
- Player cards are **only a frame**: an exact outline (ratio `CARD_ASPECT` in `PlayerCard.tsx`) that the real FC card picture fills edge to edge. Nothing on the card is editable (no position, overall or stats). Add the picture by uploading or pasting it in Squad > card > Edit card, or save it as `public/cards/<name>.png`.
- Brand: the Abantu FC crest is the app icon.
- Wording: always say **Coach**. Use neutral pronouns (they/their) in generated text.

## Data
`members` (order = order of play; one `name` per player, their real name), `startDate`, `seasons`, `benches` (handover stamps), `games`, `events` (playoffs have an optional `end`), `recordPics`. Rotation is derived from these in `src/lib/rotation.ts` (pure, unit tested). Goal-of-the-week `clips` and `votes` are stored separately (see above) because players write them without the PIN.

## Shared data (this branch: `firebase`)
- Everyone reads the same live data; editing needs the group PIN.
- **Firestore** collections: `club/state` (members, start date, seasons, benches, events), `games/{id}` (one doc per game, so two people logging at once never overwrite each other), `pics/{id}` (record screenshots and uploaded player pictures, one doc each).
- **Rules**: public read. Write only for the shared editor account, except `clips`, `votes` and `comments`, which are accepted only from the phone holding that player's claim (see above); `codes` and `claims` are readable only by the editor (a phone can read its own claim). Only the editor can delete.
- **PIN = the editor account's password** (Firebase Auth email/password). Unlock signs in with it; a wrong PIN fails to sign in.
- **No Cloud Storage** (needs the paid plan). Screenshots are compressed to under 450 KB and kept in Firestore. Goal videos are too big for that, so they go to Vercel Blob.
- Without Firebase config the app runs in local mode (saved on the device), so development and demos still work.
- **Live setup:** Firebase project `abantu-fc-scheduler-a4ab5` (Firestore + Email/Password auth, rules published from `firestore.rules`), site on Vercel at https://abantu-scheduler.vercel.app with the `VITE_FIREBASE_*` variables set for production and preview. With `.env` present, local dev reads and writes this same database.

## Out of scope
Accounts per person, push notifications, tracking individual goals or assists, importing results from the game.

## Decisions log
- Weekly rotation became **season-based** with a 3-loss bench.
- "Group night" removed: the same Coach plays both nights.
- "Any" was tried as the word for the role, then replaced with **Coach**.
- Supabase was dropped (projects full). Firebase is the shared store.
- A bench is stamped just after the loss that completed the 3-loss run (not at tap time), so those losses stay with the benched Coach and the next Coach starts at 0.
- Players have **one name, their real name**, used on the card and everywhere in the rotation (a separate character name was tried and dropped). Home shows the **Previous** Coach with their dates, then **Next up**.
- Goal of the week: **Vercel Blob** for the video files (chosen over pasting links), **personal codes + claiming a name** for identity (chosen over a plain name picker, which let anyone vote as anyone, and over PIN-only), winner on **Sunday** as the 2nd game day. Weeks run **Sunday to Sunday** (not Monday to Sunday) so that Sunday is both the kickoff and every announcement day, with a countdown to it.
- Hosting is Vercel (abantu-scheduler.vercel.app). Firebase is the database and editor sign-in only.

## Open items
- Playoffs start 15 Oct 2026 (saved as an event). Set the **last day** once it is announced: remove the event and add it again with a last day.
- Season 2 dates. Do not enter its start until the playoffs finish (a start inside open-ended playoffs would hand the team over mid-playoffs).
- Games from 27 Sep to 7 Oct (Theo's run) were never logged and Home only logs today's results, so the records start from zero. A way to enter past games is not built.
- The record screenshot upload has no screen now (see Records above). Decide where it goes or drop it.
- Rotation order after Olamide is the squad order set by hand in Squad (an A to Z rule was tried and reverted).
