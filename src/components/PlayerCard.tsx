import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { Member } from '../lib/rotation'

/**
 * The card is only a frame: an exact outline for the player's real FC card picture.
 * Crop the picture to the card's edge and it fills the frame edge to edge. Nothing on it is editable.
 * CARD_ASPECT is width / height of that outline; change it here if the game's card shape differs.
 */
export const CARD_ASPECT = '100 / 134'
const RADIUS = 4 // corner radius, % of card width

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
  const [loaded, setLoaded] = useState<string | null>(null)
  const tilt = useTilt()
  const hasName = m.name.trim().length > 0
  const hasPic = hasName && loaded === src
  const cq = (n: number) => `${n}cqw`

  return (
    <div className={`${className} ${dim ? 'opacity-55 saturate-50' : ''}`} style={{ perspective: 700 }}>
      <div ref={tilt.ref} onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave} className="card-tilt" style={{ ...REST, containerType: 'inline-size' }}>
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: CARD_ASPECT, borderRadius: cq(RADIUS) }}>
          {/* loads quietly; the picture only replaces the placeholder once it exists */}
          {hasName && <img src={src} alt="" className="hidden" onLoad={() => setLoaded(src)} />}

          {hasPic ? (
            <img src={src} alt={m.name} draggable={false} className="absolute inset-0 size-full select-none object-cover" />
          ) : (
            /* empty frame: same outline, so you can see exactly where the card goes */
            <div className="absolute inset-0 flex flex-col items-center justify-end" style={{ background: 'linear-gradient(165deg,#1d232a,#0e1215)', boxShadow: `inset 0 0 0 ${cq(0.8)} rgba(255,255,255,.2)`, borderRadius: cq(RADIUS) }}>
              <svg viewBox="0 0 100 100" className="absolute inset-x-[14%] bottom-[22%] top-[10%]" preserveAspectRatio="xMidYMax meet" aria-hidden>
                <ellipse cx="50" cy="30" rx="15" ry="17" fill="#2b323a" />
                <path d="M6 100C6 70 26 58 50 58s44 12 44 42z" fill="#2b323a" />
                <path d="M38 58l12 13 12-13" fill="none" stroke={m.color} strokeWidth="3.5" strokeLinejoin="round" />
              </svg>
              <div className="relative w-full text-center leading-none" style={{ padding: `${cq(4)} ${cq(4)} ${cq(5)}`, background: 'linear-gradient(180deg, transparent, rgba(0,0,0,.7))', fontFamily: 'var(--font-card)' }}>
                <span className="block truncate font-extrabold uppercase italic text-white" style={{ fontSize: cq(compact ? 12 : 10.5) }}>{m.name || 'Player'}</span>
                {!compact && <span className="mt-[1.5cqw] block uppercase tracking-wider text-white/50" style={{ fontSize: cq(4.2) }}>Add card picture</span>}
              </div>
            </div>
          )}

          {/* light: glare follows the pointer; an idle sweep keeps it from reading as flat print */}
          <div className="pointer-events-none absolute inset-0 mix-blend-overlay" style={{ background: 'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,.6), rgba(255,255,255,.1) 32%, transparent 60%)', opacity: 'calc(.15 + var(--glare) * .6)' }} />
          {!dim && <div className="card-sweep pointer-events-none absolute inset-0" />}
        </div>
      </div>
    </div>
  )
}
