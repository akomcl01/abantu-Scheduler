import type { ReactNode } from 'react'
import type { Member } from '../lib/rotation'
import { parseDate } from '../lib/rotation'

export const initials = (n: string) => n.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?'

export function Avatar({ m, size = 40 }: { m: Pick<Member, 'name' | 'color'>; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-pitch"
      style={{ width: size, height: size, background: m.color, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(m.name)}
    </span>
  )
}

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-3xl border border-line bg-turf ${className}`}>{children}</div>
)

export const Pill = ({ children, tone = 'mute' }: { children: ReactNode; tone?: 'mute' | 'lime' }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone === 'lime' ? 'bg-lime text-pitch' : 'bg-line text-mute'}`}>
    {children}
  </span>
)

export const Btn = ({ variant = 'ghost', className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) => (
  <button
    {...p}
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-40 ${
      variant === 'primary' ? 'bg-lime text-pitch hover:brightness-110' : variant === 'danger' ? 'border border-red-400/40 text-red-300 hover:bg-red-400/10' : 'border border-line text-chalk hover:bg-line/60'
    } ${className}`}
  />
)

const f = (opts: Intl.DateTimeFormatOptions) => (s: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts }).format(parseDate(s))
export const fmtLong = f({ weekday: 'long', day: 'numeric', month: 'long' })
export const fmtShort = f({ weekday: 'short', day: 'numeric', month: 'short' })
export const fmtMonth = f({ month: 'long', year: 'numeric' })

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose} role="dialog" aria-modal aria-label={title}>
      <div className="w-full max-w-md rounded-t-3xl border border-line bg-turf p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="grid size-11 place-items-center rounded-full text-mute hover:bg-line" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
