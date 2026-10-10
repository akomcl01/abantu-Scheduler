# Abantu Scheduler: Product Requirements

Source of truth for what the app is. Update this before changing behaviour.

## Problem
Our FIFA (EA FC 27 Pro Clubs) group keeps asking "who is the Coach this week?" and nobody remembers the record. We need one place that says who has the team, how they are doing, and when the next change happens.

## Users
Our friend group (about 4 to 8 people), mostly on phones. One shared view. A few people edit; everyone reads.

## Core rules
- One **Coach** controls the whole Abantu team on **Wednesdays and Sundays**.
- A Coach keeps the team for a **whole season**. At the next season start the next Coach in the squad order takes over.
- A Coach is **benched after 3 losses in a row** and the next Coach takes over early. A win or a draw breaks the streak. League and playoff games both count. The streak only counts games since that Coach took over.
- Order of play is the squad order, and it loops.
- Many games can be played in a day. Every game is logged with one tap (Win, Draw, Loss), tagged League or Playoffs.
- A game counts for whoever was Coach when it was played.

## Features (built)
| Area | What it does |
|---|---|
| Home | Week strip (Mon to Sun, Coach and games per day), Coach card, losses-in-a-row dots, one-tap game logging, League and Playoff record cards, order of play, next games |
| Records | League and Playoff W/D/L with proportional bar; optional screenshot of the in-game record per season |
| Calendar | Month grid with Coach per game day, results, seasons list, playoffs and events with trophy markers |
| Squad | player card frames; Squad view and coach league table (win rate, form); coach profile with season-by-season career |
| Handover ceremony | On a Coach change: "Comunicado Oficial" thank-you, then a fun contract to sign. Wording is templated in `src/lib/messages.ts` with seeded variations |
| Settings | First player start date, seasons, FC or Classic look, share link, replay ceremony |

## Design
- Default look mimics the FC 27 Pro Clubs menu (dark, white italic headings, mint accent, gold highlights). "Classic" is the warm paper variant.
- Mobile first. Floating pill nav at the bottom at every size.
- Player cards are **only a frame**: an exact outline (ratio `CARD_ASPECT` in `PlayerCard.tsx`) that the real FC card picture fills edge to edge. Nothing on the card is editable (no position, overall or stats). Add the picture by uploading or pasting it in Squad > card > Edit card, or save it as `public/cards/<name>.png`.
- Brand: the Abantu FC crest is the app icon.
- Wording: always say **Coach**. Use neutral pronouns (they/their) in generated text.

## Data
`members` (order = order of play), `startDate`, `seasons`, `benches`, `games`, `events`, `recordPics`. Rotation is derived from these in `src/lib/rotation.ts` (pure, unit tested). Nothing else is stored.

## Shared data (this branch: `firebase`)
- Everyone reads the same live data; editing needs the group PIN.
- **Firestore** collections: `club/state` (members, start date, seasons, benches, events), `games/{id}` (one doc per game, so two people logging at once never overwrite each other), `pics/{id}` (record screenshots and uploaded player pictures, one doc each).
- **Rules**: public read. Write only for the shared editor account.
- **PIN = the editor account's password** (Firebase Auth email/password). Unlock signs in with it; a wrong PIN fails to sign in.
- **No Cloud Storage** (needs the paid plan). Screenshots are compressed to under 450 KB and kept in Firestore.
- Without Firebase config the app runs in local mode (saved on the device), so development and demos still work.

## Out of scope
Accounts per person, push notifications, tracking individual goals or assists, importing results from the game.

## Decisions log
- Weekly rotation became **season-based** with a 3-loss bench.
- "Group night" removed: the same Coach plays both nights.
- "Any" was tried as the word for the role, then replaced with **Coach**.
- Supabase was dropped (projects full). Firebase is the shared store.
- A bench is stamped just after the loss that completed the 3-loss run (not at tap time), so those losses stay with the benched Coach and the next Coach starts at 0.
- Players have **one name, their real name**, used on the card and everywhere in the rotation (a separate character name was tried and dropped). Home shows the **Previous** Coach with their dates, then **Next up**.
- Hosting is Vercel (abantu-scheduler.vercel.app). Firebase is the database and editor sign-in only.

## Open items
- Real character names, squad order and card images from the group.
- Season dates (enter in Settings). FC 27 Clubs playoff dates are not published; add them as they are announced.

## Done when
- A new person opens the link and sees the same Coach, record and calendar as everyone else.
- Logging a game from two phones at the same time keeps both games.
- A wrong PIN cannot change anything, even by calling Firestore directly.
