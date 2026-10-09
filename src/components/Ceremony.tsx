import { useEffect, useMemo, useState } from 'react'
import { addDays, buildStints, seasonOn, stintOn, tally, todayStr, type Member, type ScheduleState } from '../lib/rotation'
import { farewell, welcome } from '../lib/messages'
import PlayerCard from './PlayerCard'
import { Btn, fmtShort } from './ui'

const SEEN = 'abantu-seen-handovers'
const readSeen = (): string[] => { try { return JSON.parse(localStorage.getItem(SEEN) ?? '[]') } catch { return [] } }
const markSeen = (k: string) => { try { localStorage.setItem(SEEN, JSON.stringify([...readSeen(), k].slice(-30))) } catch { /* ignore */ } }

/** The latest handover (not the very first coach), with what the ceremony needs. */
export function latestHandover(state: ScheduleState) {
  const stints = buildStints(state)
  const on = stintOn(state, todayStr())
  const i = stints.findIndex((x) => x.at === on?.at && x.memberId === on?.memberId)
  const cur = stints[i]
  if (!cur) return null
  const prev = stints[i - 1]
  if (!prev || cur.reason === 'start') return null
  const out = state.members.find((m) => m.id === prev.memberId)
  const inn = state.members.find((m) => m.id === cur.memberId)
  if (!out || !inn) return null
  const games = state.games.filter((g) => g.at >= prev.at && g.at < cur.at)
  const season = seasonOn(state, cur.from)
  return { out, inn, reason: cur.reason as 'season' | 'benched', games: tally(games), count: games.length, season, key: `${cur.memberId}@${cur.at}`, from: cur.from, no: i + 1 }
}

interface Props { state: ScheduleState; replay: boolean; onReplayDone: () => void }

export default function Ceremony({ state, replay, onReplayDone }: Props) {
  const info = useMemo(() => latestHandover(state), [state])
  const [dismissed, setDismissed] = useState<string | null>(null)
  const fresh = !!info && info.from >= addDays(todayStr(), -7) && !readSeen().includes(info.key) && dismissed !== info.key
  const open = !!info && (fresh || replay)
  if (!open || !info) return null
  const close = () => { markSeen(info.key); setDismissed(info.key); onReplayDone() }
  return <Screens key={info.key} info={info} onClose={close} />
}

function Screens({ info, onClose }: { info: NonNullable<ReturnType<typeof latestHandover>>; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [signed, setSigned] = useState(false)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const f = farewell({ seed: info.key, out: info.out.name, inn: info.inn.name, games: info.count, ...info.games, reason: info.reason, season: info.season?.name })
  const w = welcome({ seed: info.key, name: info.inn.name, out: info.out.name, season: info.season?.name, term: info.season ? `${fmtShort(info.from)} to ${fmtShort(info.season.end)}` : 'until further notice', contractNo: info.no })

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-paper" role="dialog" aria-modal aria-label="Handover">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-5 py-8">
        {step === 0 ? <Farewell f={f} out={info.out} stats={{ games: info.count, ...info.games }} onNext={() => setStep(1)} /> : <Contract w={w} coach={info.inn} signed={signed} onSign={() => setSigned(true)} onClose={onClose} />}
      </div>
    </div>
  )
}

function Farewell({ f, out, stats, onNext }: { f: ReturnType<typeof farewell>; out: Member; stats: { games: number; w: number; d: number; l: number }; onNext: () => void }) {
  return (
    <>
      <p className="rise-in text-center text-xs font-semibold uppercase tracking-[0.22em] text-gold">{f.kicker}</p>
      <h1 className="rise-in mt-3 break-words text-center font-display text-5xl leading-[0.95]" style={{ animationDelay: '80ms' }}>{f.headline}</h1>
      <PlayerCard m={out} className="rise-in mx-auto mt-7 w-40" dim />
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed">
        {f.paragraphs.map((p, i) => <p key={i} className="rise-in text-mute" style={{ animationDelay: `${200 + i * 120}ms` }}>{p}</p>)}
      </div>
      {stats.games > 0 && (
        <div className="rise-in mt-6 grid grid-cols-4 gap-2 text-center" style={{ animationDelay: '600ms' }}>
          {([['Games', stats.games, ''], ['Wins', stats.w, 'text-win'], ['Draws', stats.d, ''], ['Losses', stats.l, 'text-loss']] as const).map(([k, v, c]) => (
            <div key={k} className="rounded-xl border border-hair bg-card py-3"><p className={`font-display text-3xl leading-none ${c}`}>{v}</p><p className="mt-1 text-[11px] uppercase tracking-wider text-mute">{k}</p></div>
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-sm italic text-mute">{f.sign}</p>
      <Btn variant="primary" className="mt-auto w-full pt-0" onClick={onNext} style={{ marginTop: '2rem' }}>Next</Btn>
    </>
  )
}

function Contract({ w, coach, signed, onSign, onClose }: { w: ReturnType<typeof welcome>; coach: Member; signed: boolean; onSign: () => void; onClose: () => void }) {
  const ink = '#2b2217'
  return (
    <>
      <div className="rise-in relative rotate-[-0.6deg] rounded-sm p-3 sm:p-4" style={{ color: ink, background: '#F7F1E1', backgroundImage: 'repeating-linear-gradient(0deg, rgba(120,90,40,.04) 0 2px, transparent 2px 5px), radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,.7), transparent 60%)', boxShadow: '0 30px 60px rgba(0,0,0,.45), inset 0 0 0 1px #d9cca9' }}>
        <div className="relative overflow-hidden border-[3px] border-double p-5" style={{ borderColor: 'rgba(160,130,70,.65)' }}>
          <img src={`${import.meta.env.BASE_URL}crest.png`} alt="" className="pointer-events-none absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 opacity-[0.1] grayscale" style={{ maskImage: 'radial-gradient(circle, #000 38%, transparent 66%)', WebkitMaskImage: 'radial-gradient(circle, #000 38%, transparent 66%)' }} />
          <div className="relative">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: '#8a6d2f' }}>{w.kicker}</p>
            <h1 className="mt-2 text-center text-[2.6rem] leading-none" style={{ fontFamily: 'Instrument Serif, Georgia, serif' }}>{w.title}</h1>
            <p className="mt-2 text-center text-xs" style={{ fontFamily: 'Special Elite, monospace', color: '#7a6a4c' }}>{w.club} · No. {String(w.contractNo).padStart(3, '0')}</p>

            <p className="mt-5 text-[13px] leading-relaxed" style={{ fontFamily: 'Special Elite, monospace' }}>{w.intro}</p>
            <ol className="mt-4 space-y-3 text-[13px] leading-relaxed" style={{ fontFamily: 'Special Elite, monospace' }}>
              {w.clauses.map((c, i) => <li key={i} className="flex gap-3"><span className="shrink-0 font-bold">{i + 1}.</span><span>{c}</span></li>)}
            </ol>
            <p className="mt-4 text-[13px]" style={{ fontFamily: 'Special Elite, monospace' }}><b>Term:</b> {w.term}</p>

            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <p className="h-10 text-3xl leading-none" style={{ fontFamily: 'Caveat, cursive', fontWeight: 600, color: '#27408b' }}>Abantu FC</p>
                <div className="border-t" style={{ borderColor: ink }} /><p className="mt-1 text-[11px] uppercase tracking-wider" style={{ color: '#7a6a4c' }}>{w.clubLine}</p>
              </div>
              <div className="relative">
                <p className={`h-10 truncate text-3xl leading-none ${signed ? 'sign-reveal' : 'invisible'}`} style={{ fontFamily: 'Caveat, cursive', fontWeight: 600, color: '#27408b' }}>{coach.name}</p>
                <div className="border-t" style={{ borderColor: ink }} /><p className="mt-1 text-[11px] uppercase tracking-wider" style={{ color: '#7a6a4c' }}>{w.coachLine}</p>
                {signed && <span className="stamp-in absolute -right-5 -top-12 grid size-[4.5rem] rotate-[-14deg] place-items-center rounded-full border-[3px] text-center text-[10px] font-extrabold uppercase leading-tight tracking-wider" style={{ borderColor: '#b3261e', color: '#b3261e' }}>Signed<br />{w.club}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {signed ? (
          <>
            <p className="rise-in mb-3 text-center text-sm text-mute" style={{ animationDelay: '1200ms' }}>{w.signedNote}</p>
            <Btn variant="primary" className="rise-in w-full" style={{ animationDelay: '1300ms' }} onClick={onClose}>{w.doneCta}</Btn>
          </>
        ) : (
          <Btn variant="primary" className="w-full" onClick={onSign}>{w.signCta}</Btn>
        )}
      </div>
    </>
  )
}
