import { useRef, useState } from 'react'
import { MAX_CLIP_MB, MAX_TITLE, announceDay, clipId, isClosed, pastWinners, rank, voteBlock, voteOf, weekStart, winnerOf, type Clip } from '../lib/goals'
import { useGoals, useMe } from '../lib/goalsStore'
import { nowStr, todayStr, type Member, type ScheduleState } from '../lib/rotation'
import { Avatar, Btn, Card, Pill, SectionTitle, Sheet, fmtShort, fmtWeekday } from './ui'

export default function Goals({ state }: { state: ScheduleState }) {
  const today = todayStr()
  const week = weekStart(today)
  const closed = isClosed(week, today)
  const { clips, votes, addClip, castVote, error } = useGoals()
  const [meId, setMeId] = useMe()
  const [pick, setPick] = useState(false)
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
  const winner = winnerOf(clips, votes, week)
  const history = pastWinners(clips, votes, today).filter((w) => w.week !== week)
  const ranked = closed ? rank(clips, votes, week) : thisWeek.map((clip) => ({ clip, votes: 0 })).sort((a, b) => a.clip.at.localeCompare(b.clip.at))

  const choose = (id: string) => { setMeId(id); setPick(false) }
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">Week of {fmtShort(week)}</p>
        <h1 className="font-display text-4xl leading-[0.95]">Goal of the week</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill tone={closed ? 'gold' : 'accent'}>{closed ? 'Winner announced' : 'Voting open'}</Pill>
          {!closed && <span className="text-sm text-mute">Winner announced {fmtWeekday(announceDay(week))}</span>}
        </div>
      </section>

      {error && <p className="rounded-xl border border-accent/40 bg-card p-3 text-sm text-accent">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        {me ? <span className="flex min-w-0 items-center gap-2 text-sm"><Avatar m={me} size={28} /><span className="truncate">Playing as <b>{me.name}</b></span></span> : <span className="text-sm text-mute">Pick your name to upload and vote.</span>}
        <Btn onClick={() => setPick(true)} className="min-h-10 px-4">{me ? 'Change' : 'Who are you?'}</Btn>
      </div>

      {closed && (
        <Card className="border-gold bg-gold/10 p-4">
          {winner ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Winner</p>
              <div className="mt-2 flex items-center gap-3"><Avatar m={who(winner.clip.playerId)} size={40} /><div className="min-w-0"><p className="truncate font-display text-2xl leading-none">{who(winner.clip.playerId).name}</p><p className="mt-1 text-sm text-mute">{winner.votes} {winner.votes === 1 ? 'vote' : 'votes'}{winner.clip.title ? ` · ${winner.clip.title}` : ''}</p></div></div>
              <Video url={winner.clip.url} className="mt-3" />
            </>
          ) : (
            <p className="text-mute">{thisWeek.length ? 'Nobody voted this week, so there is no winner.' : 'No clips this week.'}</p>
          )}
        </Card>
      )}

      {!closed && me && (
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

      <section>
        <SectionTitle aside={!closed && <span className="text-xs text-mute">Votes are hidden until {fmtWeekday(announceDay(week))}</span>}>Clips this week</SectionTitle>
        {ranked.length === 0 ? <Card className="p-4 text-mute">No clips yet. Be the first to upload.</Card> : (
          <div className="space-y-4">
            {ranked.map(({ clip, votes: n }, i) => {
              const p = who(clip.playerId)
              const block = me ? voteBlock(clip, me.id, today) : closed ? 'Voting is closed' : null
              const picked = myVote?.clipId === clip.id
              return (
                <Card key={clip.id} className="p-3">
                  <div className="mb-2 flex items-center gap-3">
                    <Avatar m={p} size={32} />
                    <div className="min-w-0 flex-1"><p className="truncate font-semibold">{p.name}</p>{clip.title && <p className="truncate text-sm text-mute">{clip.title}</p>}</div>
                    {closed && <span className="shrink-0 text-sm text-mute">{i === 0 && winner ? '🏆 ' : ''}{n} {n === 1 ? 'vote' : 'votes'}</span>}
                  </div>
                  <Video url={clip.url} />
                  {!closed && (
                    <Btn variant={picked ? 'primary' : 'ghost'} className="mt-3 w-full" disabled={!!block && !picked} onClick={() => vote(clip)} aria-pressed={picked}>
                      {picked ? 'Your vote ✓' : block ?? 'Vote for this goal'}
                    </Btn>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <SectionTitle>Past winners</SectionTitle>
          <Card className="divide-y divide-hair overflow-hidden">
            {history.map(({ week: w, clip, votes: n }) => (
              <a key={w} href={clip.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3">
                <Avatar m={who(clip.playerId)} size={36} />
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{who(clip.playerId).name}</p><p className="truncate text-sm text-mute">{clip.title || 'Untitled'}</p></div>
                <span className="shrink-0 text-right text-sm text-mute">{fmtShort(w)}<br />{n} {n === 1 ? 'vote' : 'votes'}</span>
              </a>
            ))}
          </Card>
        </section>
      )}

      {pick && (
        <Sheet title="Who are you?" onClose={() => setPick(false)}>
          <div className="grid gap-2">
            {players.map((m) => (
              <button key={m.id} onClick={() => choose(m.id)} className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 text-left font-semibold ${m.id === meId ? 'border-accent bg-accent/10' : 'border-hair bg-sand'}`}><Avatar m={m} size={32} />{m.name}</button>
            ))}
          </div>
          <p className="mt-3 text-xs text-mute">Remembered on this phone. Please only pick yourself.</p>
        </Sheet>
      )}
    </div>
  )
}

/** `#t=0.1` makes iOS paint the first frame instead of a black box. */
const Video = ({ url, className = '' }: { url: string; className?: string }) => (
  <video src={`${url}#t=0.1`} controls playsInline preload="metadata" className={`aspect-video w-full rounded-xl bg-black ${className}`} />
)
