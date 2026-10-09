import type { ReactNode, SVGProps } from 'react'
import type { Member } from '../lib/rotation'
import { parseDate, type Result } from '../lib/rotation'

export const initials = (n: string) => n.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?'

export function Avatar({ m, size = 40, ring = false }: { m: Pick<Member, 'name' | 'color'>; size?: number; ring?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-[#14181c] ${ring ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : ''}`}
      style={{ width: size, height: size, background: m.color, fontSize: Math.max(10, size * 0.36) }}
      aria-hidden
    >
      {initials(m.name)}
    </span>
  )
}

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-hair bg-card ${className}`}>{children}</div>
)

export const Pill = ({ children, tone = 'mute' }: { children: ReactNode; tone?: 'mute' | 'accent' | 'dark' | 'gold' }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone === 'accent' ? 'bg-accent text-on-accent' : tone === 'dark' ? 'bg-ink text-paper' : tone === 'gold' ? 'border border-gold text-gold bg-gold/10' : 'bg-sand text-mute'}`}>
    {children}
  </span>
)

export const Btn = ({ variant = 'ghost', className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) => (
  <button
    {...p}
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-40 ${
      variant === 'primary' ? 'bg-gradient-to-r from-primary-from to-primary-to text-on-primary hover:brightness-110' : variant === 'danger' ? 'bg-sand text-accent hover:bg-hair' : 'border border-hair bg-sand text-ink hover:bg-hair'
    } ${className}`}
  />
)

export const SectionTitle = ({ children, aside }: { children: ReactNode; aside?: ReactNode }) => (
  <div className="mb-3 flex items-baseline justify-between px-1">
    <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">{children}</h2>
    {aside}
  </div>
)

const f = (opts: Intl.DateTimeFormatOptions) => (s: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts }).format(parseDate(s))
export const fmtLong = f({ weekday: 'long', day: 'numeric', month: 'long' })
export const fmtShort = f({ weekday: 'short', day: 'numeric', month: 'short' })
export const fmtMonth = f({ month: 'long' })
export const fmtYear = f({ year: 'numeric' })
export const fmtDay = f({ day: 'numeric' })
export const fmtMon = f({ month: 'short' })
export const fmtWeekday = f({ weekday: 'long' })

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 sm:items-center" onClick={onClose} role="dialog" aria-modal aria-label={title}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-hair sm:hidden" />
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-3xl leading-tight">{title}</h2>
          <button onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-mute hover:bg-hair" aria-label="Close"><Icon d="M6 6l12 12M18 6L6 18" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Icon({ d, size = 20, ...p }: { d: string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d={d} />
    </svg>
  )
}
export const ICONS = {
  home: 'M4 11l8-7 8 7M6 10v9h12v-9',
  cal: 'M5 6h14v13H5zM5 10h14M9 4v4M15 4v4',
  users: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 19c0-3 3-5 6-5s6 2 6 5M16 5.5a3 3 0 010 5.5M18 14c2 .6 3 2.2 3 5',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-1-3-2 .3-1.5-1.5L16.8 5l-3-1-1 2h-2l-1-2-3 1 .3 2.8L5.7 9.3 3.5 9l-1 3 2 1v2l-2 1 1 3 2.2-.3 1.5 1.5L7.2 22l3-1 1-2h2l1 2 3-1-.3-2.2 1.5-1.5 2.2.3 1-3-2-1z',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  up: 'M6 14l6-6 6 6',
  down: 'M6 10l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  trophy: 'M8 4h8v5a4 4 0 01-8 0V4zM8 6H5a3 3 0 003 3M16 6h3a3 3 0 01-3 3M12 13v4M9 20h6M10 17h4',
}

const RES: Record<Result, string> = { W: 'bg-win/15 text-win', D: 'bg-sand text-mute', L: 'bg-loss/15 text-loss' }
export const ResultChip = ({ r, size = 32 }: { r: Result; size?: number }) => (
  <span className={`grid shrink-0 place-items-center rounded-lg text-xs font-bold ${RES[r]}`} style={{ width: size, height: size }}>{r}</span>
)

export function ResultButtons({ value, onPick, onClear }: { value?: Result; onPick: (r: Result) => void; onClear?: () => void }) {
  const label: Record<Result, string> = { W: 'Win', D: 'Draw', L: 'Loss' }
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {(['W', 'D', 'L'] as const).map((r) => (
          <button key={r} type="button" onClick={() => onPick(r)} aria-pressed={value === r}
            className={`min-h-14 rounded-xl border text-sm font-bold transition ${value === r ? `${RES[r]} border-current` : 'border-hair bg-sand text-ink hover:bg-hair'}`}>{label[r]}</button>
        ))}
      </div>
      {value && onClear && <button type="button" onClick={onClear} className="mt-3 min-h-10 text-sm text-mute underline">Clear result</button>}
    </div>
  )
}

/** Proportional win / draw / loss bar (FotMob head-to-head style). */
export function RecordBar({ w, d, l }: { w: number; d: number; l: number }) {
  const n = w + d + l
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-hair" role="img" aria-label={`${w} wins, ${d} draws, ${l} losses`}>
      {n > 0 && <><span className="bg-win" style={{ width: `${(w / n) * 100}%` }} /><span className="bg-mute/60" style={{ width: `${(d / n) * 100}%` }} /><span className="bg-loss" style={{ width: `${(l / n) * 100}%` }} /></>}
    </div>
  )
}

/** Win-rate chip, coloured like a FotMob rating. */
export const RateChip = ({ pct }: { pct: number | null }) => (
  <span className={`inline-grid min-w-12 place-items-center rounded-lg px-2 py-1 text-xs font-bold ${pct === null ? 'bg-sand text-mute' : pct >= 60 ? 'bg-win/20 text-win' : pct >= 40 ? 'bg-gold/20 text-gold' : 'bg-loss/20 text-loss'}`}>{pct === null ? '–' : `${pct}%`}</span>
)

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex gap-1 rounded-full bg-sand p-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} aria-pressed={value === o.id} className={`min-h-9 flex-1 rounded-full px-4 text-sm font-semibold transition ${value === o.id ? 'bg-ink text-paper' : 'text-mute'}`}>{o.label}</button>
      ))}
    </div>
  )
}
