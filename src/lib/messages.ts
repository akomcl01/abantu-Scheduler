/**
 * Words for the handover ceremony, written as templates.
 *
 * Each slot has several alternatives in the group's own "Communicado Official" voice. The app picks
 * one per slot, seeded by the handover, so every handover reads a little differently but the same
 * handover always reads the same (including on replay). To change the voice, edit or add strings
 * below. Placeholders: {out} outgoing coach, {inn} incoming coach, {club}, {games}, {w}.
 * Pronouns are kept neutral because the squad's pronouns aren't stored.
 */
export interface FarewellCtx {
  seed: string
  out: string
  inn: string
  games: number
  w: number
  d: number
  l: number
  reason: 'season' | 'benched'
  season?: string
}

export interface WelcomeCtx {
  seed: string
  name: string
  out: string
  season?: string
  term: string
  contractNo: number
}

const CLUB = 'FC Club Abantu'

// --- tiny seeded picker -----------------------------------------------------------------------
const hash = (s: string) => {
  let h = 2166136261
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}
const rng = (seed: string) => {
  let a = hash(seed)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = (r: () => number, xs: string[]) => xs[Math.floor(r() * xs.length)]
const pickN = (r: () => number, xs: string[], n: number) => {
  const pool = [...xs]
  const out: string[] = []
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0])
  return out
}
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''))

// --- comedy send-off (benched after 3 straight losses) ----------------------------------------
const FUNNY_OPEN = [
  `After a heroic stint of service (and questionable decisions), our beloved {out} has decided to hang up the Any headset and retire from active duty. Rumor has it they're pursuing a quieter life — something about "finally getting to play without all the stress."`,
  `Breaking news from the dugout: after a stint of heroic service (and a few decisions we are still discussing), {out} has stepped down as our Any. Sources say they're chasing a calmer life — apparently "just playing, no tactics, no stress."`,
  `It is with mixed emotions (mostly laughter) that we announce {out} is hanging up the Any headset. After a heroic run in charge, and some choices history will judge, they are heading for a quieter life and a very long sit-down.`,
  `The rumours are true: {out} has left the building. After a heroic stint (and some truly questionable decisions), they have traded the Any headset for a comfy chair and a snack.`,
]
const FUNNY_SALUTE = [
  `We salute your legendary pings, your dramatic timeouts, and your ability to accidentally start chaos in record time. You'll always be remembered as the Any who kept us guessing (and sometimes panicking).`,
  `We salute your bold substitutions, your halftime speeches, and your gift for turning a quiet match into a full emergency. You'll always be the Any who kept us guessing (and occasionally praying).`,
  `Thank you for the dramatic timeouts, the surprise formations, and the group chat meltdowns. You kept us guessing as our Any, you sometimes had us panicking, and we wouldn't change a thing.`,
]
const FUNNY_WELCOME = [
  `But don't worry — the madness continues! Please welcome our newest Any, {inn}, who has bravely volunteered to control the whole team and step into the line of fire. May their comms be clear and their patience infinite.`,
  `The show goes on! Taking over the whole team is our newest Any, {inn}, who has courageously walked into the line of fire. May the lag be low and the patience endless.`,
  `Fear not — somebody has to take the hot seat, and that somebody is {inn}. Please welcome our newest Any. May their comms be crisp and their nerves be steel.`,
]
const FUNNY_SIGNOFF = [
  `Farewell, {out} — may your next role have fewer complaints and more snacks. 🎤`,
  `So long, {out} — may the sofa be soft and the complaints be few. 🎤`,
  `Farewell, {out} — may your next chapter have fewer complaints and more snacks. 🎤`,
]

// --- formal thank-you (season simply ended) ---------------------------------------------------
const FORMAL_OPEN = [
  `We extend our heartfelt gratitude to our Any, {out}, as they step down from the role.`,
  `On behalf of everyone at {club}, we express our sincere thanks to {out} as their time as our Any comes to a close.`,
  `It is with great appreciation that we acknowledge the service of {out}, who now steps down as our Any.`,
]
const FORMAL_MIDDLE = [
  `Their exemplary service, unwavering dedication, and significant contributions have left a lasting impact on our organization. Throughout their tenure, they embodied professionalism, integrity, and a true commitment to excellence.`,
  `Throughout their tenure, they led with professionalism, integrity, and a genuine commitment to excellence. Their dedication and contributions will be remembered across the club.`,
  `Their unwavering dedication and exemplary conduct set a standard for those who follow. The impact of their work will be felt at {club} for a long time.`,
]
const FORMAL_STATS = [
  `They led the squad through {games} games, with {w} wins to be proud of.`,
  `{games} games in charge and {w} victories: a record worth celebrating.`,
]
const FORMAL_CLOSE = [
  `We celebrate their achievements and wish them the very best in their future endeavors.`,
  `We wish them every success and happiness in all that lies ahead.`,
  `The club celebrates their achievements and wishes them the very best in the seasons ahead.`,
]

export const farewell = (c: FarewellCtx) => {
  const r = rng(`farewell:${c.seed}`)
  const v = { out: c.out, inn: c.inn, club: CLUB, games: c.games, w: c.w }
  if (c.reason === 'benched') {
    return {
      kicker: '📣 Communicado Official',
      headline: `Farewell, ${c.out}`,
      paragraphs: [FUNNY_OPEN, FUNNY_SALUTE, FUNNY_WELCOME, FUNNY_SIGNOFF].map((pool) => fill(pick(r, pool), v)),
      sign: CLUB,
    }
  }
  const paragraphs = [fill(pick(r, FORMAL_OPEN), v), fill(pick(r, FORMAL_MIDDLE), v)]
  if (c.games > 0) paragraphs.push(fill(pick(r, FORMAL_STATS), v))
  paragraphs.push(fill(pick(r, FORMAL_CLOSE), v))
  return { kicker: '📣 Communicado Official', headline: `Thank you, ${c.out}`, paragraphs, sign: CLUB }
}

// --- welcome contract -------------------------------------------------------------------------
const WELCOME_INTRO = [
  `We are delighted to welcome {name} to {club}. Their arrival marks an exciting new chapter for our team as we continue to strengthen our squad and uphold our commitment to excellence both on and off the field. We look forward to the skill, energy, and passion {name} will bring to the club and wish them great success in the seasons ahead.`,
  `A warm welcome to {name}, our new Any at {club}. Their arrival opens an exciting new chapter as we keep building the squad and holding ourselves to a high standard on and off the pitch. We look forward to the skill, energy, and passion {name} brings, and wish them great success ahead.`,
  `{club} is proud to announce {name} as our new Any, in full control of the whole team. We expect big things: skill, energy, and plenty of passion. Welcome aboard, and may the seasons ahead be kind.`,
]
const CLAUSE_CONTROL = [`The Any shall have full control of the whole Abantu team{season}, on Wednesdays and Sundays alike.`]
const CLAUSE_DISMISSAL = [
  `Three (3) consecutive defeats shall result in immediate dismissal. The board is not sentimental.`,
  `Three (3) defeats in a row shall end this agreement at once. No appeals, no excuses.`,
]
const CLAUSE_FUN = [
  `The Any shall not blame lag, the referee, the controller, or a teammate's internet.`,
  `Remuneration shall be paid in bragging rights, due in full on the final whistle.`,
  `Victories shall be celebrated humbly and, in the group chat, loudly.`,
  `Excuses shall be limited to one (1) per match, and a doctor's note is required.`,
  `Timeouts shall be called in genuine emergencies only, and never regretted afterwards.`,
  `Criticism from the sofa shall be accepted with grace and a straight face.`,
  `Snacks shall be provided at the Any's own expense.`,
  `Mic discipline: pings are encouraged, screaming is a last resort.`,
]

export const welcome = (c: WelcomeCtx) => {
  const r = rng(`welcome:${c.seed}`)
  const v = { name: c.name, out: c.out, club: CLUB }
  const [fun1, fun2] = pickN(r, CLAUSE_FUN, 2)
  return {
    kicker: 'Communicado Official',
    club: CLUB,
    title: 'Any contract',
    intro: fill(pick(r, WELCOME_INTRO), v),
    clauses: [
      fill(pick(r, CLAUSE_CONTROL), { season: c.season ? ` for ${c.season}` : '' }),
      fun1,
      pick(r, CLAUSE_DISMISSAL),
      fun2,
    ],
    term: c.term,
    contractNo: c.contractNo,
    coachLine: 'The Any',
    clubLine: 'For the Club',
    signCta: 'Sign contract',
    doneCta: "Let's go",
    signedNote: 'Signed and sealed. Welcome to Abantu.',
  }
}
