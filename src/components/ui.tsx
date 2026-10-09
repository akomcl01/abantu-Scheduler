import type { ReactNode, SVGProps } from 'react'
import type { Member } from '../lib/rotation'
import { parseDate } from '../lib/rotation'

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
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone === 'accent' ? 'bg-accent text-[#04150e]' : tone === 'dark' ? 'bg-ink text-paper' : tone === 'gold' ? 'border border-gold text-gold bg-gold/10' : 'bg-sand text-mute'}`}>
    {children}
  </span>
)

export const Btn = ({ variant = 'ghost', className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) => (
  <button
    {...p}
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-40 ${
      variant === 'primary' ? 'bg-gradient-to-r from-[#3B6BFF] to-[#7C4DFF] text-white hover:brightness-110' : variant === 'danger' ? 'bg-sand text-[#ff7a7a] hover:bg-hair' : 'border border-hair bg-sand text-ink hover:bg-hair'
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
}
