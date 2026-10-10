import { useEffect, useRef, useState } from 'react'
import { GOALS_START, MAX_CLIP_MB, MAX_COMMENT, MAX_TITLE, announceDay, clipId, commentsFor, countdown, hasStarted, startOfDay, voteBlock, voteOf, weekStart, winnerOf, type Clip, type Comment } from '../lib/goals'
import { isShared } from '../lib/store'
import { useGoals, useMe } from '../lib/goalsStore'
import { addDays, nowStr, todayStr, type Member, type ScheduleState } from '../lib/rotation'
import Vault from './Vault'
import { Avatar, Btn, Card, Icon, ICONS, Pill, SectionTitle, Segmented, Sheet, fmtLong, fmtShort, fmtWeekday } from './ui'

export default function Goals({ state }: { state: ScheduleState }) {
  const today = todayStr()
  const week = weekStart(today)
  const started = hasStarted(today)
  const [, tick] = useState(0) // bumped when a countdown hits zero, so the screen moves on by itself
  const { clips, votes, comments, addClip, castVote, addComment, error } = useGoals()
  const { me: meId, saved, verified, claim, authError } = useMe()
  const [pick, setPick] = useState(false)
  const [view, setView] = useState<'week' | 'vault'>('week')
  const players = state.members.filter((m) => m.active)
  const who = (id: string): Member => state.members.find((m) => m.id === id) ?? { id, name: 'Former player', color: '#8a8f98', active: false }
  const me = players.find((m) => m.id === meId) ?? null

  const [title, setTitle] = useState('')
  const [pct, setPct] = useState<number | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  if (!clips) return <p className="py-10 text-center text-mute">Loading…</p>

  const thisWeek = clips.filter((c) => c.week === week)
  const mine = me ? thisWeek.find((c) => c.id === clipId(week, me.id)) : undefined
  const myVote = me ? voteOf(votes, week, me.id) : undefined
  const lastWeek = addDays(week, -7)
  const lastWinner = lastWeek >= GOALS_START ? winnerOf(clips, votes, lastWeek) : null
  const hadLast = lastWeek >= GOALS_START && clips.some((c) => c.week === lastWeek)
  const posts = [...thisWeek].sort((a, b) => a.at.localeCompare(b.at))

  const onFile = async (f: File | undefined) => {
    if (!f || !me) return
    if (!f.type.startsWith('video/')) return setMsg('Pick a video file.')
    if (f.size > MAX_CLIP_MB * 1024 * 1024) return setMsg(`That clip is over ${MAX_CLIP_MB} MB. Trim it and try again.`)
    setMsg(null); setPct(0)
    const err = await addClip(f, week, me.id, title, nowStr(), setPct)
    setPct(null)
    if (err) setMsg(err)
    else { setTitle(''); setMsg('Uploaded. Good luck!') }
    if (file.current) file.current.value = ''
  }
  const vote = (c: Clip) => (me ? castVote(week, me.id, c.id) : setPick(true))

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">{view === 'vault' ? 'Best of the best' : started ? `Week of ${fmtShort(week)}` : 'Coming soon'}</p>
        <h1 className="font-display text-4xl leading-[0.95]">Goal of the week</h1>
      </section>

      <Segmented label="Goals view" value={view} onChange={setView} options={[{ id: 'week', label: 'This week' }, { id: 'vault', label: 'The Vault' }]} />

      {view === 'vault' ? <Vault clips={clips} votes={votes} who={who} /> : (
        <>
          {!started ? (
            <Card className="border-gold bg-gold/10 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Kicks off {fmtLong(GOALS_START)}</p>
              <Countdown to={GOALS_START} onDone={() => tick((n) => n + 1)} big />
              <ol className="mt-5 space-y-2 text-left text-sm text-mute">
                <li><b className="text-ink">1.</b> Upload your best goal of the week.</li>
                <li><b className="text-ink">2.</b> Upvote your favourites. Not your own!</li>
                <li><b className="text-ink">3.</b> The winner is announced every Sunday and goes into the Vault.</li>
              </ol>
            </Card>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Pill tone="accent">Voting open</Pill>
              <span className="text-sm text-mute">Winner in <Countdown to={announceDay(week)} onDone={() => tick((n) => n + 1)} /></span>
            </div>
          )}

          {error && <p className="rounded-xl border border-accent/40 bg-card p-3 text-sm text-accent">{error}</p>}

          {authError && <p className="rounded-xl border border-accent/40 bg-card p-3 text-sm text-accent">{authError}</p>}

          <div className="flex items-center justify-between gap-3">
            {me ? <span className="flex min-w-0 items-center gap-2 text-sm"><Avatar m={me} size={28} /><span className="truncate">Playing as <b>{me.name}</b></span></span>
              : <span className="text-sm text-mute">{verified === 'checking' ? 'Checking this phone…' : isShared ? 'Enter your personal code to upload, upvote and comment.' : 'Pick your name to upload and vote.'}</span>}
            <Btn onClick={() => setPick(true)} className="min-h-10 shrink-0 px-4">{me ? 'Change' : isShared && saved ? 'Verify it\'s you' : 'Who are you?'}</Btn>
          </div>

          {started && hadLast && (
            <Card className="border-gold bg-gold/10 p-4">
              {lastWinner ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Last week's winner</p>
                  <div className="mt-2 flex items-center gap-3"><Avatar m={who(lastWinner.clip.playerId)} size={40} /><div className="min-w-0"><p className="truncate font-display text-2xl leading-none">{who(lastWinner.clip.playerId).name}</p><p className="mt-1 text-sm text-mute">{lastWinner.votes} {lastWinner.votes === 1 ? 'upvote' : 'upvotes'}{lastWinner.clip.title ? ` · ${lastWinner.clip.title}` : ''}</p></div></div>
                  <Video url={lastWinner.clip.url} className="mt-3" />
                </>
              ) : <p className="text-mute">Nobody voted last week, so there was no winner.</p>}
            </Card>
          )}

          {started && me && (
            <Card className="space-y-3 p-4">
              <p className="font-semibold">{mine ? 'Your clip is in. Replace it?' : 'Upload your goal'}</p>
              <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))} placeholder="Title (optional), e.g. Volley from halfway" disabled={pct !== null} className="min-h-12 w-full rounded-xl border border-hair bg-paper px-4" />
              <input ref={file} type="file" accept="video/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              <Btn variant="primary" className="w-full" disabled={pct !== null} onClick={() => file.current?.click()}>{pct !== null ? `Uploading ${pct}%` : mine ? 'Choose a new video' : 'Choose a video'}</Btn>
              {pct !== null && <div className="h-2 overflow-hidden rounded-full bg-hair" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>}
              {msg && <p className="text-sm text-mute" role="status">{msg}</p>}
              <p className="text-xs text-mute">One clip per player each week, up to {MAX_CLIP_MB} MB.</p>
            </Card>
          )}

          {started && (
            <section>
              <SectionTitle aside={<span className="text-xs text-mute">Upvotes are hidden until {fmtWeekday(announceDay(week))}</span>}>Clips this week</SectionTitle>
              {posts.length === 0 ? <Card className="p-4 text-mute">No clips yet. Be the first to upload.</Card> : (
                <div className="space-y-5">
                  {posts.map((clip) => (
                    <Post key={clip.id} clip={clip} author={who(clip.playerId)} who={who} me={me} picked={myVote?.clipId === clip.id} block={me ? voteBlock(clip, me.id, today) : null}
                      comments={commentsFor(comments, clip.id)} onVote={() => vote(clip)} onComment={(t) => (me ? addComment(clip.id, me.id, t, nowStr()) : setPick(true))} onNeedName={() => setPick(true)} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {pick && <IdentitySheet players={players} start={saved} claim={claim} onClose={() => setPick(false)} />}
    </div>
  )
}

/** `#t=0.1` makes iOS paint the first frame instead of a black box. */
const Video = ({ url, className = '' }: { url: string; className?: string }) => (
  <video src={`${url}#t=0.1`} controls playsInline preload="metadata" className={`aspect-video w-full rounded-xl bg-black ${className}`} />
)

interface PostProps {
  clip: Clip; author: Member; who: (id: string) => Member; me: Member | null
  picked: boolean; block: string | null; comments: Comment[]; onVote: () => void; onComment: (text: string) => void; onNeedName: () => void
}

/** One clip, laid out like an Instagram post: player, video, upvote + comment buttons, caption, comments. */
function Post({ clip, author, who, me, picked, block, comments, onVote, onComment, onNeedName }: PostProps) {
  const [all, setAll] = useState(false)
  const [text, setText] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const shown = all ? comments : comments.slice(-2)
  const disabled = !!block && !picked
  const send = () => { if (!text.trim()) return; onComment(text); setText('') }

  return (
    <article className="overflow-hidden rounded-2xl border border-hair bg-card">
      <header className="flex items-center gap-3 p-3">
        <Avatar m={author} size={32} />
        <p className="min-w-0 flex-1 truncate font-semibold">{author.name}</p>
        <span className="shrink-0 text-xs text-mute">{fmtWeekday(clip.at.slice(0, 10))}</span>
      </header>
      <Video url={clip.url} className="rounded-none" />
      <div className="px-3 pb-3 pt-1">
        <div className="flex items-center gap-1">
          <button onClick={onVote} disabled={disabled} aria-pressed={picked} aria-label={picked ? 'Remove your upvote by choosing another clip' : block ?? 'Upvote this goal'} title={block ?? undefined}
            className={`grid size-11 place-items-center rounded-full transition active:scale-90 disabled:opacity-40 ${picked ? 'text-accent' : 'text-ink'}`}>
            <Icon d={ICONS.upvote} size={28} fill={picked ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => (me ? input.current?.focus() : onNeedName())} aria-label="Comment" className="grid size-11 place-items-center rounded-full text-ink active:scale-90"><Icon d={ICONS.chat} size={26} /></button>
          {block && !picked && <span className="ml-1 text-sm text-mute">{block}</span>}
          {picked && <span className="ml-1 text-sm text-accent">Your upvote</span>}
        </div>
        {clip.title && <p className="mt-1 text-sm"><b>{author.name}</b> {clip.title}</p>}
        {comments.length > 2 && !all && <button onClick={() => setAll(true)} className="mt-1 min-h-8 text-sm text-mute">View all {comments.length} comments</button>}
        {shown.map((c) => <p key={c.id} className="mt-1 break-words text-sm"><b>{who(c.authorId).name}</b> {c.text}</p>)}
        <form className="mt-2 flex items-center gap-2 border-t border-hair pt-2" onSubmit={(e) => { e.preventDefault(); send() }}>
          <input ref={input} value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_COMMENT))} onFocus={(e) => { if (!me) { e.currentTarget.blur(); onNeedName() } }}
            placeholder="Add a comment…" aria-label={`Comment on ${author.name}'s goal`} className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute" />
          <button type="submit" disabled={!text.trim()} className="min-h-11 px-2 text-sm font-semibold text-accent disabled:opacity-40">Post</button>
        </form>
      </div>
    </article>
  )
}

const two = (n: number) => String(n).padStart(2, '0')

/** Counts down to the start of a day. `big` shows four tiles, otherwise a single line. Calls onDone once it reaches zero. */
function Countdown({ to, big = false, onDone }: { to: string; big?: boolean; onDone: () => void }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  const t = countdown(startOfDay(to) - now)
  useEffect(() => { if (t.done) onDone() }, [t.done])
  const label = `${t.d} days, ${t.h} hours, ${t.m} minutes and ${t.s} seconds left`
  if (!big) return <b className="tabular-nums text-ink" role="timer" aria-label={label}>{t.d}d {two(t.h)}h {two(t.m)}m {two(t.s)}s</b>
  return (
    <div className="mt-4 grid grid-cols-4 gap-2" role="timer" aria-label={label}>
      {([['d', 'Days', t.d], ['h', 'Hours', t.h], ['m', 'Mins', t.m], ['s', 'Secs', t.s]] as const).map(([k, name, n]) => (
        <div key={k} className="rounded-xl bg-paper/60 py-3">
          <p className="font-display text-4xl leading-none tabular-nums">{two(n)}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">{name}</p>
        </div>
      ))}
    </div>
  )
}

/** Pick your name, then (when the data is shared) enter the personal code the Coach sent you. */
function IdentitySheet({ players, start, claim, onClose }: { players: Member[]; start: string | null; claim: (id: string, code: string) => Promise<string | null>; onClose: () => void }) {
  const [chosen, setChosen] = useState<Member | null>(() => (isShared ? players.find((m) => m.id === start) ?? null : null))
  const [code, setCode] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (m: Member, c: string) => {
    setBusy(true); setErr(null)
    const e = await claim(m.id, c)
    setBusy(false)
    if (e) setErr(e); else onClose()
  }
  if (!chosen) {
    return (
      <Sheet title="Who are you?" onClose={onClose}>
        <div className="grid gap-2">
          {players.map((m) => (
            <button key={m.id} onClick={() => (isShared ? setChosen(m) : submit(m, ''))} className="flex min-h-14 items-center gap-3 rounded-xl border border-hair bg-sand px-4 text-left font-semibold"><Avatar m={m} size={32} />{m.name}</button>
          ))}
        </div>
        <p className="mt-3 text-xs text-mute">{isShared ? 'Next you enter your personal code.' : 'Remembered on this phone. Please only pick yourself.'}</p>
      </Sheet>
    )
  }
  return (
    <Sheet title={`Hi ${chosen.name}`} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (code.trim()) submit(chosen, code) }}>
        <p className="text-sm text-mute">Enter the personal code the Coach sent you. It ties your name to this phone, so nobody else can upvote or comment as you.</p>
        <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC-DEF" autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-label="Personal code" className="min-h-12 w-full rounded-xl border border-hair bg-paper px-4 text-center font-display text-2xl tracking-[0.2em]" />
        {err && <p className="text-sm text-accent" role="alert">{err}</p>}
        <Btn type="submit" variant="primary" className="w-full" disabled={busy || !code.trim()}>{busy ? 'Checking…' : 'Verify'}</Btn>
        <button type="button" onClick={() => { setChosen(null); setCode(''); setErr(null) }} className="min-h-10 w-full text-sm text-mute underline">Not {chosen.name}?</button>
      </form>
    </Sheet>
  )
}
