import { useState } from 'react'
import { STAT_LABELS, getPosition, getRating, getStats, tierOf, type Tier } from '../lib/card'
import type { Member } from '../lib/rotation'

// Pro Clubs style: bronze -> silver -> gold -> holo as the overall climbs.
const TIERS: Record<Tier, { face: string; edge: string; ink: string }> = {
  icon: { face: 'linear-gradient(135deg,#f6f7fa 0%,#e5ecf8 18%,#f6e6f2 34%,#e2f3ee 50%,#f2eefa 66%,#e4e9f2 82%,#f8f8fb 100%)', edge: '#cfd6e2', ink: '#1a1e24' },
  rare: { face: 'linear-gradient(150deg,#f3dc8d 0%,#d6a640 42%,#f0d374 58%,#b98a28 100%)', edge: '#e9cf80', ink: '#2c1f06' },
  gold: { face: 'linear-gradient(150deg,#e9d078 0%,#c9a03f 42%,#e2c463 58%,#a57c20 100%)', edge: '#dcc16a', ink: '#2c1f06' },
  silver: { face: 'linear-gradient(150deg,#eef0f3 0%,#b3bbc6 42%,#e1e5ea 58%,#8b93a0 100%)', edge: '#d3d8df', ink: '#1a1e24' },
  bronze: { face: 'linear-gradient(150deg,#e8bd97 0%,#b27a45 42%,#d6a373 58%,#84562b 100%)', edge: '#d9ac84', ink: '#2a1707' },
}

export const cardSrc = (m: Pick<Member, 'name' | 'cardImage'>) =>
  m.cardImage || `${import.meta.env.BASE_URL}cards/${m.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`

interface Props { m: Member; compact?: boolean; className?: string; dim?: boolean }

export default function PlayerCard({ m, compact = false, className = '', dim = false }: Props) {
  const src = cardSrc(m)
  const [loaded, setLoaded] = useState<string | null>(null)
  const wrap = `${className} ${dim ? 'opacity-55 saturate-50' : ''}`
  const shadow = { filter: 'drop-shadow(0 12px 20px rgba(0,0,0,.55))' }
  const hasName = m.name.trim().length > 0

  // Real card from the game wins once its file has loaded; until then (or if missing) draw one.
  if (hasName && loaded === src) {
    return <div className={wrap} style={shadow}><img src={src} alt={m.name} className="block w-full" draggable={false} /></div>
  }

  const rating = getRating(m)
  const t = TIERS[tierOf(rating)]
  const stats = getStats(m)
  const cq = (n: number) => `${n}cqw`
  const font = { fontFamily: 'var(--font-card)' }
  const holo = tierOf(rating) === 'icon'

  return (
    <div className={wrap} style={{ containerType: 'inline-size', ...shadow }}>
      {hasName && <img src={src} alt="" className="hidden" onLoad={() => setLoaded(src)} />}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '100 / 143', borderRadius: cq(5), background: t.face, boxShadow: `inset 0 0 0 ${cq(1)} ${t.edge}` }}>
        {/* sheen */}
        <div className="absolute inset-0" style={{ background: holo ? 'conic-gradient(from 210deg at 70% 30%, rgba(255,120,180,.18), rgba(120,200,255,.2), rgba(150,255,200,.2), rgba(255,230,140,.18), rgba(255,120,180,.18))' : 'linear-gradient(115deg, transparent 32%, rgba(255,255,255,.38) 47%, transparent 60%)' }} />

        {/* player render */}
        <div className="absolute" style={{ left: cq(compact ? 18 : 20), right: 0, top: cq(4), height: cq(compact ? 92 : 94) }}>
          <div className="absolute inset-x-[4%] top-[8%] bottom-[8%] rounded-full" style={{ background: `radial-gradient(circle at 50% 45%, ${m.color}, transparent 70%)` }} />
          <svg viewBox="0 0 100 120" className="absolute inset-0 size-full" aria-hidden preserveAspectRatio="xMidYMax meet">
            <circle cx="52" cy="36" r="17" fill="#15181c" opacity=".88" />
            <path d="M14 120C14 84 32 72 52 72s38 12 38 48z" fill="#15181c" opacity=".88" />
            <path d="M40 72l12 15 12-15" fill="none" stroke={m.color} strokeWidth="3" />
          </svg>
        </div>

        {/* left strip: overall, position, stats */}
        <div className="absolute inset-y-0 left-0 flex flex-col items-center" style={{ width: cq(compact ? 18 : 20), background: 'rgba(255,255,255,.22)', color: t.ink, paddingTop: cq(4), ...font }}>
          <span className="font-bold uppercase leading-none opacity-70" style={{ fontSize: cq(compact ? 4.4 : 4) }}>OVR</span>
          <span className="font-extrabold leading-[0.95]" style={{ fontSize: cq(compact ? 13 : 12) }}>{rating}</span>
          <span className="font-bold uppercase leading-none" style={{ fontSize: cq(compact ? 6.5 : 6), marginTop: cq(1) }}>{getPosition(m)}</span>
          {!compact && (
            <>
              <span className="block" style={{ width: cq(11), height: 1.5, background: 'currentColor', opacity: 0.25, margin: `${cq(3)} 0` }} />
              {stats.map((v, i) => (
                <span key={i} className="flex flex-col items-center leading-none" style={{ marginBottom: cq(2.6) }}>
                  <span className="font-extrabold" style={{ fontSize: cq(6.6) }}>{v}</span>
                  <span className="font-bold opacity-70" style={{ fontSize: cq(3.6) }}>{STAT_LABELS[i]}</span>
                </span>
              ))}
            </>
          )}
        </div>

        {/* name band */}
        <div className="absolute inset-x-0 bottom-0 flex items-center" style={{ height: cq(compact ? 24 : 27), padding: `0 ${cq(5)}`, gap: cq(4), background: 'linear-gradient(180deg, rgba(14,16,19,.82), rgba(14,16,19,.96))', ...font }}>
          <img src={`${import.meta.env.BASE_URL}crest.png`} alt="" className="shrink-0 rounded-full bg-[#234877] object-cover" style={{ width: cq(compact ? 14 : 16), height: cq(compact ? 14 : 16) }} />
          <span className="min-w-0 text-white">
            <span className="block truncate font-extrabold uppercase italic leading-none" style={{ fontSize: cq(compact ? 11.5 : 12.5) }}>{m.name || 'Player'}</span>
            {!compact && <span className="mt-[1cqw] block truncate font-semibold uppercase leading-none tracking-wider text-white/55" style={{ fontSize: cq(4.4) }}>Abantu · {getPosition(m)}</span>}
          </span>
        </div>
      </div>
    </div>
  )
}
