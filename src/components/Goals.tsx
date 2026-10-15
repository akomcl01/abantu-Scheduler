import { useEffect, useRef, useState } from 'react'
import { GOALS_START, MAX_CLIPS_PER_WEEK, MAX_CLIP_MB, MAX_COMMENT, MAX_TITLE, announceDay, clipsOf, commentsFor, countdown, hasStarted, startOfDay, voteBlock, voteOf, weekStart, winnerOf, type Clip, type Comment } from '../lib/goals'
import { isShared } from '../lib/store'
import { useGoals, useMe } from '../lib/goalsStore'
import { addDays, nowStr, todayStr, type Member, type ScheduleState } from '../lib/rotation'
import ShareButton from './ShareButton'
import Vault from './Vault'
import { Avatar, Btn, Card, Icon, ICONS, Pill, SectionTitle, Segmented, Sheet, fmtLong, fmtShort, fmtWeekday } from './ui'

export default function Goals({ state, sharedId, onClearShared }: { state: ScheduleState; sharedId?: string | null; onClearShared?: () => void }) {
  const today = todayStr()
  const week = weekStart(today)
  const started = hasStarted(today)
  const [, tick] = useState(0) // bumped when a countdown hits zero, so the screen moves on by itself
  const { clips, votes, comments, addClip, removeClip, castVote, addComment, error } = useGoals()
  const { me: meId, saved, verified, claim, authError } = useMe()
  const [pick, setPick] = useState(false)
  const [view, setView] = useState<'week' | 'vault'>('week')
  const players = state.members // everyone in the squad can take part, including players sitting out of the rotation
  const who = (id: string): Member => state.members.find((m) => m.id === id) ?? { id, name: 'Former player', color: '#8a8f98', active: false }
  const me = players.find((m) => m.id === meId) ?? null

  const [title, setTitle] = useState('')
  const [pct, setPct] = useState<number | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [picked, setPicked] = useState<File | null>(null) // chosen but not uploaded yet
  const [preview, setPreview] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!picked) { setPreview(null); return }
    const url = URL.createObjectURL(picked)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [picked])

  if (!clips) return <p className="py-10 text-center text-mute">Loading…</p>

  const thisWeek = clips.filter((c) => c.week === week)
  const sharedClip = sharedId ? clips.find((c) => c.id === sharedId) ?? null : null
  const mine = me ? clipsOf(clips, week, me.id) : []
  const left = MAX_CLIPS_PER_WEEK - mine.length
  const myVote = me ? voteOf(votes, week, me.id) : undefined
  const lastWeek = addDays(week, -7)
  const lastWinner = lastWeek >= GOALS_START ? winnerOf(clips, votes, lastWeek) : null
  const hadLast = lastWeek >= GOALS_START && clips.some((c) => c.week === lastWeek)
  const posts = [...thisWeek].sort((a, b) => a.at.localeCompare(b.at))

  const choose = (f: File | undefined) => {
    if (!f) return
    if (!f.type.startsWith('video/')) return setMsg('Pick a video file.')
    if (f.size > MAX_CLIP_MB * 1024 * 1024) return setMsg(`That clip is over ${MAX_CLIP_MB} MB. Trim it and try again.`)
    setMsg(null); setPicked(f)
  }
  const send = async () => {
    if (!picked || !me) return
    setMsg(null); setPct(0)
    const err = await addClip(picked, week, me.id, title, nowStr(), setPct)
    setPct(null)
    if (err) setMsg(err)
    else { setTitle(''); setPicked(null); setMsg('Uploaded. Good luck!') }
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
          {sharedId && (
            <Card className="border-gold bg-gold/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Shared goal</p>
              {sharedClip ? (
                <>
                  <div className="mt-2 flex items-center gap-3">
                    <Avatar m={who(sharedClip.playerId)} size={40} />
                    <div className="min-w-0 flex-1"><p className="truncate font-display text-2xl leading-none">{who(sharedClip.playerId).name}</p>{sharedClip.title && <p className="mt-1 truncate text-sm text-mute">{sharedClip.title}</p>}</div>
                    <ShareButton clip={sharedClip} name={who(sharedClip.playerId).name} />
                  </div>
                  <Video url={sharedClip.url} className="mt-3" />
                </>
              ) : <p className="mt-2 text-mute">That goal could not be found. It may have been removed.</p>}
              <Btn className="mt-3 w-full" onClick={onClearShared}>See this week's goals</Btn>
            </Card>
          )}

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

          {started && (
            <Card className="border-accent/40 bg-accent/10 p-4">
              <p className="font-semibold">{mine.length ? (mine.length === 1 ? 'Your goal is in.' : `Your ${mine.length} goals are in.`) : 'Goal of the week is open!'}</p>
              <p className="mt-1 text-sm text-mute">{mine.length ? 'Now upvote your favourites and drop a comment. Got another belter? You can post more. The winner is announced Sunday.' : 'Scored a belter this week? Record it, upload it and let the squad vote. The more goals, the better. Get yours in before Sunday.'}</p>
            </Card>
          )}

          <HowTo defaultOpen={!started} />

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

          {started && (
            <Card className="space-y-3 p-4">
              <p className="font-semibold">{left <= 0 ? `All ${MAX_CLIPS_PER_WEEK} goals posted` : mine.length ? `Add another goal (${mine.length} of ${MAX_CLIPS_PER_WEEK} posted)` : 'Upload your goal'}</p>
              {!me ? (
                <>
                  <p className="text-sm text-mute">{verified === 'checking' ? 'Checking this phone…' : isShared ? 'Enter your personal code first. It proves it is you, so only you can upload under your name.' : 'Pick your name first.'}</p>
                  <Btn variant="primary" className="w-full" onClick={() => setPick(true)}>{isShared && saved ? 'Verify it\'s you' : 'Who are you?'}</Btn>
                </>
              ) : left <= 0 ? (
                <p className="text-sm text-mute">You have posted your {MAX_CLIPS_PER_WEEK} goals for this week. Remove one of yours below if you want to post a different one.</p>
              ) : (
                <>
                  <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))} placeholder="Title (optional), e.g. Volley from halfway" disabled={pct !== null} className="min-h-12 w-full rounded-xl border border-hair bg-paper px-4" />
                  <input ref={file} type="file" accept="video/*" hidden onChange={(e) => { choose(e.target.files?.[0]); e.target.value = '' }} />
                  {picked ? (
                    <>
                      {preview && <video src={preview} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-black" />}
                      <p className="truncate text-sm text-mute">{picked.name} · {(picked.size / 1024 / 1024).toFixed(1)} MB</p>
                      <Btn variant="primary" className="w-full" disabled={pct !== null} onClick={send}>{pct !== null ? `Uploading ${pct}%` : 'Upload goal'}</Btn>
                      <Btn className="w-full" disabled={pct !== null} onClick={() => file.current?.click()}>Choose a different video</Btn>
                    </>
                  ) : (
                    <Btn variant="primary" className="w-full" onClick={() => file.current?.click()}>{mine.length ? 'Choose another video' : 'Choose a video'}</Btn>
                  )}
                  {pct !== null && <div className="h-2 overflow-hidden rounded-full bg-hair" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>}
                  {msg && <p className="text-sm text-mute" role="status">{msg}</p>}
                  <p className="text-xs text-mute">Up to {MAX_CLIPS_PER_WEEK} goals per player each week, up to {MAX_CLIP_MB} MB each.</p>
                </>
              )}
            </Card>
          )}

          {started && (
            <section>
              <SectionTitle aside={<span className="text-xs text-mute">Upvotes are hidden until {fmtWeekday(announceDay(week))}</span>}>Clips this week</SectionTitle>
              {posts.length === 0 ? <Card className="p-4 text-mute">No clips yet. Be the first to upload.</Card> : (
                <div className="space-y-5">
                  {posts.map((clip) => (
                    <Post key={clip.id} clip={clip} author={who(clip.playerId)} who={who} me={me} onRemove={me && clip.playerId === me.id ? () => { if (window.confirm('Remove this goal? Its comments go with it.')) removeClip(clip.id) } : undefined} picked={myVote?.clipId === clip.id} block={me ? voteBlock(clip, me.id, today) : null}
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
  clip: Clip; author: Member; who: (id: string) => Member; me: Member | null; onRemove?: () => void
  picked: boolean; block: string | null; comments: Comment[]; onVote: () => void; onComment: (text: string) => void; onNeedName: () => void
}

/** One clip, laid out like an Instagram post: player, video, upvote + comment buttons, caption, comments. */
function Post({ clip, author, who, me, onRemove, picked, block, comments, onVote, onComment, onNeedName }: PostProps) {
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
        {onRemove && <button onClick={onRemove} className="shrink-0 rounded-full px-2 text-xs font-semibold text-accent">Remove</button>}
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
          <ShareButton clip={clip} name={author.name} className="ml-auto" />
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

/** Players record on a PS5, so this walks through getting the clip from the console to here. */
function HowTo({ defaultOpen }: { defaultOpen: boolean }) {
  const steps = [
    <>Get your personal code from the Coach. They send it to you privately. Tap <b className="text-ink">Who are you?</b>, pick your name and enter it once.</>,
    <>Record your goal on your PS5. Press the <b className="text-ink">Create</b> button on your controller and choose <b className="text-ink">Save Recent Gameplay</b>, or start a new recording before the goal.</>,
    <>Download the <b className="text-ink">PlayStation App</b> on your phone and sign in with your PlayStation account.</>,
    <>In the app, open the <b className="text-ink">Captures</b> tab. Your saved video is there.</>,
    <>Download the video to your phone.</>,
    <>Come back here, tap <b className="text-ink">Choose a video</b> and pick it. Add a title if you like. Up to {MAX_CLIP_MB} MB each. You can post up to {MAX_CLIPS_PER_WEEK} goals a week.</>,
  ]
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-hair bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold [&::-webkit-details-marker]:hidden">
        How to upload your goal
        <span className="text-mute transition group-open:rotate-180"><Icon d={ICONS.down} size={18} /></span>
      </summary>
      <ol className="space-y-3 px-4 pb-4 text-sm text-mute">
        {steps.map((t, i) => (
          <li key={i} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-sand text-xs font-bold text-ink">{i + 1}</span><span className="pt-0.5">{t}</span></li>
        ))}
      </ol>
    </details>
  )
}
