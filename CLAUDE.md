# Abantu Scheduler

Mobile-first scheduler for our EA FC 27 Pro Clubs group. One **Coach** controls the whole team on Wednesdays and Sundays for a season, or until 3 losses in a row. **Read `docs/PRD.md` before changing behaviour** and don't re-ask settled decisions (see its Decisions log). Update the PRD in the same change as any behaviour change.

## Branches
- `main`: earlier version (local mode + Supabase).
- `firebase`: current work. Firestore + editor sign-in (the group PIN is the editor account's password). The Firebase project isn't created yet; setup is in `README.md`. Without `.env` the app runs in local mode.

## Commands
- `npm run dev` (add `-- --force` after installing deps; Vite's dep cache goes stale and the page goes blank)
- `npm test` (vitest), `npm run build` (tsc + vite)

## Code map
- `src/lib/rotation.ts`: all rules, pure and unit tested (stints, loss streak, records, coach career). Change rules here first, with a test.
- `src/lib/sync.ts`: Firestore layout (`club/state`, `games/{id}`, `pics/{id}`) as pure diff/join helpers. `store.ts` picks local vs Firebase hook.
- `src/lib/messages.ts`: handover wording as templates with seeded variations. Edit copy here only.
- `src/components/`: `Home`, `WeekStrip`, `Records`, `CalendarView`, `Squad`, `Coaches` (table + career), `PlayerCard`, `Ceremony` (farewell, welcome, contract, crest stamp), `Settings`.
- Theme tokens live in `src/index.css` (FC dark default, `[data-theme="classic"]` variant).

## House rules
- Say **Coach**. Ceremony label is "Comunicado Oficial" (spelling as in `messages.ts`). Use neutral pronouns (they/their) in generated text.
- Mobile first, floating pill nav at every size. Primary button is mint. Player cards follow the FC 27 Clubs layout.
- A game counts for whoever was Coach when played; league and playoff games both count toward the 3-loss rule.

## Working rules (save tokens)
- Verify with text reads or DOM queries; at most one screenshot per UI change.
- Edit files, don't rewrite them. Don't redo Mobbin research unless asked.
- Demo data in the preview lives in `localStorage` key `abantu-scheduler-v1` (and `abantu-seen-handovers`); clean it after testing.
- Commit with the Co-Authored-By line when a change is verified.

## Gotchas
- `ENOSPC` means the Mac disk is full (`df -h /`); it was at 100% once.
- No Java/Firebase CLI installed, so the Firestore emulator can't run locally.
- Repo is public: never commit `.env`, PINs or keys.
