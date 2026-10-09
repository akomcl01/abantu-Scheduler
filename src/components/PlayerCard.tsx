import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { STAT_LABELS, getPosition, getRating, getStats, tierOf, type Tier } from '../lib/card'
import type { Member } from '../lib/rotation'

// Pro Clubs style: bronze -> silver -> gold -> holo as the overall climbs.
const TIERS: Record<Tier, { face: string; plate: string; rim: string; rimHi: string; ink: string; foil: number }> = {
  icon: { face: 'linear-gradient(150deg,#fbfbfd 0%,#e3eaf7 22%,#f5e3f0 40%,#ddf2ea 58%,#efe9fb 76%,#dfe5ef 100%)', plate: '#cfd6e2', rim: '#9aa4b5', rimHi: '#ffffff', ink: '#14171c', foil: 0.75 },
  rare: { face: 'linear-gradient(150deg,#f8e19a 0%,#e0b04c 34%,#f4d57c 56%,#c99a35 80%,#a27620 100%)', plate: '#b9944a', rim: '#8e6a1c', rimHi: '#fff1bd', ink: '#2a1d04', foil: 0.5 },
  gold: { face: 'linear-gradient(150deg,#f0dc98 0%,#d6b45e 34%,#ecd38a 56%,#c3a050 80%,#9c7c34 100%)', plate: '#b39558', rim: '#8a6c28', rimHi: '#fbeab0', ink: '#2a1d04', foil: 0.32 },
  silver: { face: 'linear-gradient(150deg,#f6f7f9 0%,#c3c9d2 34%,#e6e9ed 56%,#a5adb8 80%,#7f8792 100%)', plate: '#9ca4af', rim: '#6f7783', rimHi: '#ffffff', ink: '#171a1f', foil: 0.28 },
  bronze: { face: 'linear-gradient(150deg,#f0c9a4 0%,#c38c5a 34%,#ddae80 56%,#a06c3c 80%,#7a4f26 100%)', plate: '#9c6d43', rim: '#6e4520', rimHi: '#ffd9b3', ink: '#25150a', foil: 0.25 },
}

// PlayStyle-style pentagon, pointing out of the card's left edge. viewBox 0 0 40 40.
const PENTA = 'M20 2L37 14.5L30.5 35H9.5L3 14.5Z'

export const cardSrc = (m: Pick<Member, 'name' | 'cardImage'>) =>
  m.cardImage || `${import.meta.env.BASE_URL}cards/${m.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`

interface Props { m: Member; compact?: boolean; className?: string; dim?: boolean }

const REST = { '--rx': '0deg', '--ry': '0deg', '--mx': '50%', '--my': '30%', '--glare': '0' } as CSSProperties
const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Follows the pointer: tilts the card in 3D and moves the light across it. Writes CSS vars, no re-renders. */
function useTilt() {
  const ref = useRef<HTMLDivElement>(null)
  const set = (vars: Record<string, string>) => { for (const k in vars) ref.current?.style.setProperty(k, vars[k]) }
  return {
    ref,
    onPointerMove: (e: PointerEvent) => {
      if (!ref.current || still()) return
      const r = ref.current.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      set({ '--rx': `${(0.5 - y) * 16}deg`, '--ry': `${(x - 0.5) * 20}deg`, '--mx': `${x * 100}%`, '--my': `${y * 100}%`, '--glare': '1' })
    },
    onPointerLeave: () => set(REST as Record<string, string>),
  }
}

export default function PlayerCard({ m, compact = false, className = '', dim = false }: Props) {
  const src = cardSrc(m)
  const [missing, setMissing] = useState<string | null>(null)
  const tilt = useTilt()
  const hasPic = m.name.trim().length > 0 && missing !== src
  const rating = getRating(m)
  const tier = tierOf(rating)
  const t = TIERS[tier]
  const stats = getStats(m)
  const pos = getPosition(m)
  const best = stats.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]).slice(0, 3)
  const cq = (n: number) => `${n}cqw`
  const font = { fontFamily: 'var(--font-card)', color: t.ink }
  // A lighter, frosted panel cut into the face, like the crest and LEVEL boxes in the game.
  const panel = { background: 'linear-gradient(160deg, rgba(255,255,255,.42), rgba(255,255,255,.14))', boxShadow: `inset 0 ${cq(0.4)} 0 rgba(255,255,255,.5), inset 0 -${cq(0.4)} 0 rgba(0,0,0,.08)` }

  return (
    <div className={`${className} ${dim ? 'opacity-55 saturate-50' : ''}`} style={{ perspective: 700 }}>
      <div ref={tilt.ref} onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave} className="card-tilt" style={{ ...REST, containerType: 'inline-size' }}>
        {/* rim: bright bevelled outer frame */}
        <div className="relative w-full" style={{ aspectRatio: '100 / 134', borderRadius: cq(5), padding: cq(2.2), background: `linear-gradient(145deg, ${t.rimHi}, ${t.rim} 30%, ${t.rimHi} 55%, ${t.rim} 80%, ${t.rimHi})` }}>
          <div className="relative size-full overflow-hidden" style={{ borderRadius: cq(3.2), background: t.face, boxShadow: `inset 0 0 0 ${cq(0.5)} rgba(0,0,0,.28)` }}>
            {/* face texture: diagonal light bands and target rings behind the player */}
            <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(135deg, rgba(255,255,255,.16) 0 9cqw, transparent 9cqw 18cqw)' }} />
            <div className="absolute inset-0" style={{ background: 'repeating-radial-gradient(circle at 56% 48%, transparent 0 7cqw, rgba(255,255,255,.22) 7cqw 7.5cqw)', WebkitMaskImage: 'radial-gradient(circle at 56% 48%, #000 25%, transparent 62%)', maskImage: 'radial-gradient(circle at 56% 48%, #000 25%, transparent 62%)' }} />
            <div className="absolute inset-0" style={{ background: `radial-gradient(50% 40% at 56% 48%, ${m.color}55, transparent 70%), radial-gradient(100% 40% at 50% 0%, rgba(255,255,255,.4), transparent 65%)` }} />

            {/* player picture (uploaded), sits on the face and fades into the name plate */}
            <div className="absolute inset-x-0 top-0" style={{ bottom: cq(22) }}>
              {hasPic ? (
                <img src={src} alt={m.name} draggable={false} onError={() => setMissing(src)} className="size-full select-none object-cover object-top"
                  style={{ WebkitMaskImage: 'linear-gradient(180deg, #000 82%, transparent)', maskImage: 'linear-gradient(180deg, #000 82%, transparent)' }} />
              ) : (
                <svg viewBox="0 0 100 100" className="absolute inset-x-[12%] bottom-0 top-[18%]" preserveAspectRatio="xMidYMax meet" aria-hidden>
                  <defs><linearGradient id={`kit-${m.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a2f36" /><stop offset="1" stopColor="#0c0e11" /></linearGradient></defs>
                  <ellipse cx="50" cy="30" rx="15" ry="17" fill={`url(#kit-${m.id})`} />
                  <path d="M6 100C6 70 26 58 50 58s44 12 44 42z" fill={`url(#kit-${m.id})`} />
                  <path d="M38 58l12 13 12-13" fill="none" stroke={m.color} strokeWidth="3.5" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            {/* top panels: crest left, overall right */}
            <div className="absolute grid place-items-center" style={{ left: 0, top: 0, width: cq(compact ? 24 : 18), height: cq(compact ? 24 : 22), borderBottomRightRadius: cq(2), ...panel }}>
              <img src={`${import.meta.env.BASE_URL}crest.png`} alt="" className="rounded-[20%] object-cover" style={{ width: cq(compact ? 15 : 11), height: cq(compact ? 15 : 11) }} />
            </div>
            <div className="absolute flex flex-col items-end leading-none" style={{ right: 0, top: 0, padding: `${cq(3)} ${cq(4)} ${cq(2.5)} ${cq(6)}`, clipPath: `polygon(${cq(5)} 0, 100% 0, 100% 100%, 0 100%, 0 ${cq(5)})`, ...panel, ...font }}>
              <span className="font-bold uppercase tracking-wide opacity-75" style={{ fontSize: cq(compact ? 7 : 5.4) }}>OVR</span>
              <span className="font-extrabold" style={{ fontSize: cq(compact ? 20 : 15), textShadow: `0 ${cq(0.4)} 0 rgba(255,255,255,.45)` }}>{rating}</span>
            </div>

            {/* PlayStyle pentagons poking out of the left edge: the player's three best stats */}
            {!compact && (
              <div className="absolute flex flex-col" style={{ left: cq(-4.5), top: cq(38), gap: cq(2), ...font }}>
                {best.map(([v, i]) => (
                  <span key={i} className="relative grid place-items-center leading-none" style={{ width: cq(18), height: cq(18) }}>
                    <svg viewBox="0 0 40 40" className="absolute inset-0 size-full -rotate-90 drop-shadow" aria-hidden>
                      <path d={PENTA} fill={t.plate} stroke={t.rimHi} strokeOpacity=".8" strokeWidth="1.6" />
                    </svg>
                    <span className="relative flex flex-col items-center" style={{ paddingLeft: cq(3) }}>
                      <span className="font-extrabold" style={{ fontSize: cq(6) }}>{v}</span>
                      <span className="font-bold opacity-75" style={{ fontSize: cq(3.2) }}>{STAT_LABELS[i]}</span>
                    </span>
                  </span>
                ))}
              </div>
            )}
            {/* signature diamond on the right edge */}
            {!compact && (
              <span className="absolute grid rotate-45 place-items-center drop-shadow" style={{ right: cq(4), top: cq(56), width: cq(8.5), height: cq(8.5), borderRadius: cq(1), background: `linear-gradient(135deg, ${t.rimHi}, ${t.plate})`, boxShadow: `inset 0 0 0 ${cq(0.4)} rgba(255,255,255,.6)` }}>
                <span className="block" style={{ width: cq(3), height: cq(3), background: m.color, borderRadius: cq(0.4) }} />
              </span>
            )}

            {/* name plate */}
            <div className="absolute inset-x-0 bottom-0 flex items-center overflow-hidden" style={{ height: cq(22), padding: `0 ${cq(5)}`, gap: cq(3.5), background: `linear-gradient(180deg, ${t.plate}f2, ${t.plate})`, boxShadow: `inset 0 ${cq(0.5)} 0 rgba(255,255,255,.45), 0 -${cq(0.6)} ${cq(1.5)} rgba(0,0,0,.18)`, ...font }}>
              <span className="pointer-events-none absolute inset-y-0 right-0 w-1/2" style={{ background: 'repeating-linear-gradient(120deg, transparent 0 3cqw, rgba(255,255,255,.18) 3cqw 3.6cqw)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000)', maskImage: 'linear-gradient(90deg, transparent, #000)' }} />
              {!compact && (
                <span className="relative grid shrink-0 place-items-center rounded-full font-extrabold" style={{ width: cq(12), height: cq(12), fontSize: cq(4.2), boxShadow: `inset 0 0 0 ${cq(0.7)} currentColor` }}>{pos}</span>
              )}
              <span className={`relative min-w-0 leading-none ${compact ? 'w-full text-center' : ''}`}>
                <span className="block truncate font-extrabold uppercase" style={{ fontSize: cq(compact ? 12 : 9.5), color: 'rgba(255,255,255,.96)', textShadow: `0 ${cq(0.4)} ${cq(0.8)} rgba(0,0,0,.3)` }}>{m.name || 'Player'}</span>
                {!compact && <span className="mt-[1.2cqw] block truncate font-bold uppercase tracking-wider opacity-80" style={{ fontSize: cq(4.2) }}>Abantu · {pos}</span>}
              </span>
            </div>

            {/* light: foil drifting with the pointer, hotspot glare, and an idle sweep so it never reads as flat print */}
            <div className="card-foil pointer-events-none absolute inset-0" style={{ opacity: tier === 'icon' ? t.foil : `calc(${t.foil} * (0.35 + var(--glare) * 0.65))` }} />
            <div className="pointer-events-none absolute inset-0 mix-blend-overlay" style={{ background: 'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,.75), rgba(255,255,255,.12) 32%, transparent 60%)', opacity: 'calc(.25 + var(--glare) * .75)' }} />
            {!dim && <div className="card-sweep pointer-events-none absolute inset-0" />}
          </div>
        </div>
      </div>
    </div>
  )
}
