import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fb, editorEmail } from './firebase'
import { todayStr, type Game, type ScheduleState } from './rotation'
import { diffState, joinState, type Config, type Pic } from './sync'

export const isShared = !!fb

const LS = 'abantu-scheduler-v1'

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
  recordPics: {},
})

/** Fill in fields that older saved data doesn't have. */
const normalize = (raw: (Partial<ScheduleState> & { results?: Record<string, 'W' | 'D' | 'L'> }) | null | undefined): ScheduleState => {
  const base = seed()
  const r = raw ?? {}
  const legacy = Object.entries(r.results ?? {}).map(([date, result]) => ({ id: crypto.randomUUID(), date, at: `${date}T12:00:00`, result }))
  return { ...base, ...r, members: r.members ?? base.members, startDate: r.startDate ?? base.startDate, seasons: r.seasons ?? [], benches: r.benches ?? [], games: r.games ?? legacy, events: r.events ?? [], recordPics: r.recordPics ?? {} }
}

const readLocal = (): ScheduleState => {
  try {
    const raw = localStorage.getItem(LS)
    if (raw) return normalize(JSON.parse(raw))
  } catch { /* ignore */ }
  return seed()
}

/** Local mode: everything lives on this device. */
function useLocalSchedule() {
  const [state, setState] = useState<ScheduleState | null>(readLocal)
  const [error, setError] = useState<string | null>(null)
  const save = useCallback(async (next: ScheduleState) => {
    setState(next)
    try { localStorage.setItem(LS, JSON.stringify(next)); setError(null) } catch { setError('Could not save: this device is out of storage. Try a smaller screenshot.') }
  }, [])
  const unlock = useCallback(async (p: string | null) => p !== null, [])
  return { state, save, canEdit: true, unlock, error }
}

/** Shared mode: live data from Firestore. Reading is public; writing needs the editor sign-in (the group PIN). */
function useFirebaseSchedule() {
  const { db, auth } = fb!
  const [config, setConfig] = useState<Partial<Config> | null | undefined>(undefined) // undefined = still loading
  const [games, setGames] = useState<Game[] | null>(null)
  const [pics, setPics] = useState<Pic[]>([])
  const [editor, setEditor] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fail = (e: Error) => setError(e.message)
    const offs = [
      onSnapshot(doc(db, 'club', 'state'), (s) => setConfig(s.exists() ? (s.data() as Partial<Config>) : null), fail),
      onSnapshot(collection(db, 'games'), (s) => setGames(s.docs.map((d) => d.data() as Game)), fail),
      onSnapshot(collection(db, 'pics'), (s) => setPics(s.docs.map((d) => d.data() as Pic)), fail),
      onAuthStateChanged(auth, (u) => setEditor(!!u)),
    ]
    return () => offs.forEach((off) => off())
  }, [db, auth])

  const state = useMemo(() => (config === undefined || games === null ? null : joinState(config, games, pics, seed())), [config, games, pics])
  const current = useRef(state)
  current.current = state

  const save = useCallback(async (next: ScheduleState) => {
    const prev = current.current
    if (!prev) return
    const d = diffState(prev, next)
    const batch = writeBatch(db)
    if (d.config) batch.set(doc(db, 'club', 'state'), d.config)
    d.gamesSet.forEach((g) => batch.set(doc(db, 'games', g.id), g))
    d.gamesDel.forEach((id) => batch.delete(doc(db, 'games', id)))
    d.picsSet.forEach((p) => batch.set(doc(db, 'pics', p.id), p))
    d.picsDel.forEach((id) => batch.delete(doc(db, 'pics', id)))
    try {
      await batch.commit()
      setError(null)
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === 'permission-denied') { setError('Editing is locked. Enter the group PIN to make changes.'); await signOut(auth) }
      else setError((e as Error).message)
    }
  }, [db, auth])

  const unlock = useCallback(async (p: string | null): Promise<boolean> => {
    if (p === null) { await signOut(auth); return false }
    try { await signInWithEmailAndPassword(auth, editorEmail, p); setError(null); return true } catch { return false }
  }, [auth])

  return { state, save, canEdit: editor, unlock, error }
}

export const useSchedule = fb ? useFirebaseSchedule : useLocalSchedule

