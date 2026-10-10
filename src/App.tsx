import { useEffect, useState } from 'react'
import CalendarView from './components/CalendarView'
import Home from './components/Home'
import Settings from './components/Settings'
import Ceremony, { latestHandover } from './components/Ceremony'
import Squad from './components/Squad'
import { Btn, Icon, ICONS, Sheet } from './components/ui'
import { isShared, useSchedule } from './lib/store'

const tabs = [
  { id: 'home', label: 'Next up', icon: ICONS.home },
  { id: 'calendar', label: 'Calendar', icon: ICONS.cal },
  { id: 'squad', label: 'Squad', icon: ICONS.users },
  { id: 'settings', label: 'Settings', icon: ICONS.gear },
] as const
type Tab = (typeof tabs)[number]['id']

type Theme = 'fc' | 'classic'
const readTheme = (): Theme => { try { return localStorage.getItem('abantu-theme') === 'classic' ? 'classic' : 'fc' } catch { return 'fc' } }

export default function App() {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  const setTheme = (t: Theme) => { setThemeState(t); try { localStorage.setItem('abantu-theme', t) } catch { /* ignore */ } }
  const { state, save, canEdit, unlock, error } = useSchedule()
  const [tab, setTab] = useState<Tab>('home')
  const [askPin, setAskPin] = useState(false)
  const [replay, setReplay] = useState(false)
  const [pin, setPin] = useState('')
  const [bad, setBad] = useState(false)

  if (!state) return <div className="grid min-h-dvh place-items-center text-mute">Loading…</div>
  const need = () => (isShared ? setAskPin(true) : undefined)

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 sm:px-6">
      <header className="flex items-center gap-4 pt-5 sm:gap-8 sm:pt-7">
        <img src={`${import.meta.env.BASE_URL}crest.png`} alt="Abantu FC" className="size-11 shrink-0 rounded-lg bg-[#234877] object-cover" />
        <p className="font-display text-xl leading-none">Abantu</p>
      </header>

      <main className="pb-32 pt-8 sm:pt-10">
        {error && <p className="mb-4 rounded-xl border border-accent/40 bg-card p-3 text-sm text-accent">{error}</p>}
        {tab === 'home' && <Home state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} />}
        {tab === 'calendar' && <CalendarView state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} />}
        {tab === 'squad' && <Squad state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} />}
        {tab === 'settings' && <Settings state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} onLock={() => unlock(null)} theme={theme} onTheme={setTheme} onReplay={latestHandover(state) ? () => setReplay(true) : undefined} />}
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Nav tab={tab} setTab={setTab} mobile />
      </div>

      <Ceremony state={state} replay={replay} onReplayDone={() => setReplay(false)} />

      {askPin && (
        <Sheet title="Group PIN" onClose={() => setAskPin(false)}>
          <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); const ok = await unlock(pin); setBad(!ok); if (ok) { setAskPin(false); setPin('') } }}>
            <input autoFocus type="password" inputMode="text" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN" className="min-h-12 w-full rounded-xl border border-hair bg-paper px-4" />
            {bad && <p className="text-sm text-accent">Wrong PIN.</p>}
            <Btn type="submit" variant="primary" className="w-full">Unlock editing</Btn>
          </form>
        </Sheet>
      )}
    </div>
  )
}

function Nav({ tab, setTab, mobile = false }: { tab: Tab; setTab: (t: Tab) => void; mobile?: boolean }) {
  return (
    <nav aria-label="Main" className={mobile ? 'pointer-events-auto flex gap-1 rounded-full border border-hair bg-card/90 p-1.5 shadow-[0_10px_34px_rgba(0,0,0,0.35)] backdrop-blur-xl' : 'flex gap-7'}>
      {tabs.map((t) => {
        const on = tab === t.id
        return (
          <button key={t.id} onClick={() => setTab(t.id)} aria-current={on ? 'page' : undefined} aria-label={t.label}
            className={mobile
              ? `flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${on ? 'bg-ink text-paper' : 'text-mute'}`
              : `relative min-h-11 text-[15px] font-semibold transition ${on ? 'text-ink' : 'text-mute hover:text-ink'}`}>
            {mobile && <Icon d={t.icon} size={21} />}
            {(!mobile || on) && t.label}
            {on && !mobile && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-ink" />}
          </button>
        )
      })}
    </nav>
  )
}
