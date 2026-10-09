import { createClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { todayStr, type ScheduleState } from './rotation'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const sb = url && key ? createClient(url, key) : null
export const isShared = !!sb

const LS = 'abantu-scheduler-v1'
const PIN_KEY = 'abantu-pin'

export const COLORS = ['#E9B44C', '#D98A6C', '#9DB58A', '#8FB0C9', '#B79BC4', '#E7A5B0', '#7FB7A8', '#C9B38C']

export const newMember = (i: number, name = '') => ({
  id: crypto.randomUUID(),
  name,
  color: COLORS[i % COLORS.length],
  active: true,
})

const seed = (): ScheduleState => ({
  members: [newMember(0, 'Player 1'), newMember(1, 'Player 2'), newMember(2, 'Player 3'), newMember(3, 'Player 4')],
  startDate: todayStr(),
  seasons: [],
  benches: [],
  games: [],
  events: [],
})

/** Fill in fields that older saved data doesn't have. */
const normalize = (raw: (Partial<ScheduleState> & { results?: Record<string, 'W' | 'D' | 'L'> }) | null | undefined): ScheduleState => {
  const base = seed()
  const r = raw ?? {}
  const legacy = Object.entries(r.results ?? {}).map(([date, result]) => ({ id: crypto.randomUUID(), date, at: `${date}T12:00:00`, result }))
  return { ...base, ...r, members: r.members ?? base.members, startDate: r.startDate ?? base.startDate, seasons: r.seasons ?? [], benches: r.benches ?? [], games: r.games ?? legacy, events: r.events ?? [] }
}

const readLocal = (): ScheduleState => {
  try {
    const raw = localStorage.getItem(LS)
    if (raw) return normalize(JSON.parse(raw))
  } catch { /* ignore */ }
  return seed()
}

export function useSchedule() {
  const [state, setState] = useState<ScheduleState | null>(isShared ? null : readLocal())
  const [pin, setPin] = useState<string | null>(() => {
    try { return sessionStorage.getItem(PIN_KEY) } catch { return null }
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sb) return
    let alive = true
    const load = async () => {
      const { data, error } = await sb.from('schedule_state').select('data').eq('id', 1).maybeSingle()
      if (!alive) return
      if (error) setError(error.message)
      setState(normalize(data?.data))
    }
    load()
    const ch = sb.channel('schedule').on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_state' }, load).subscribe()
    return () => { alive = false; sb.removeChannel(ch) }
  }, [])

  // Local mode needs no PIN; shared mode needs a verified one.
  const canEdit = !isShared || !!pin

  const save = useCallback(async (next: ScheduleState) => {
    setState(next)
    if (!sb) { try { localStorage.setItem(LS, JSON.stringify(next)) } catch { /* ignore */ } return }
    const { error } = await sb.rpc('save_state', { p_pin: pin, p_data: next })
    if (error) { setError(error.message); if (/pin/i.test(error.message)) unlock(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  const unlock = useCallback(async (p: string | null): Promise<boolean> => {
    if (p === null) { try { sessionStorage.removeItem(PIN_KEY) } catch { /* */ } setPin(null); return false }
    if (!sb) return true
    const { data } = await sb.rpc('check_pin', { p_pin: p })
    if (data === true) { try { sessionStorage.setItem(PIN_KEY, p) } catch { /* */ } setPin(p); setError(null); return true }
    return false
  }, [])

  return { state, save, canEdit, unlock, error }
}
