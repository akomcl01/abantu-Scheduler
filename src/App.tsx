import { useEffect, useState } from 'react'
import CalendarView from './components/CalendarView'
import Home from './components/Home'
import Settings from './components/Settings'
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
  const [pin, setPin] = useState('')
  const [bad, setBad] = useState(false)

  if (!state) return <div className="grid min-h-screen place-items-center text-mute">Loading…</div>
  const need = () => (isShared ? setAskPin(true) : undefined)

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 sm:px-6">
      <header className="flex items-center gap-4 pt-5 sm:gap-8 sm:pt-7">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-hair bg-card font-display text-2xl leading-none text-accent">A</span>
        <p className="font-display text-xl leading-none sm:hidden">Abantu</p>
        <div className="hidden sm:block"><Nav tab={tab} setTab={setTab} /></div>
      </header>

      <main className="pb-32 pt-8 sm:pb-24 sm:pt-10">
        {error && <p className="mb-4 rounded-xl border border-accent/40 bg-card p-3 text-sm text-accent">{error}</p>}
        {tab === 'home' && <Home state={state} />}
        {tab === 'calendar' && <CalendarView state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} />}
        {tab === 'squad' && <Squad state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} />}
        {tab === 'settings' && <Settings state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} onLock={() => unlock(null)} theme={theme} onTheme={setTheme} />}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <Nav tab={tab} setTab={setTab} mobile />
      </div>

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
    <nav aria-label="Main" className={mobile ? 'grid grid-cols-4' : 'flex gap-7'}>
      {tabs.map((t) => {
        const on = tab === t.id
        return (
          <button key={t.id} onClick={() => setTab(t.id)} aria-current={on ? 'page' : undefined}
            className={mobile
              ? `flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${on ? 'text-ink' : 'text-mute'}`
              : `relative min-h-11 text-[15px] font-semibold transition ${on ? 'text-ink' : 'text-mute hover:text-ink'}`}>
            {mobile && <Icon d={t.icon} size={22} className={on ? 'text-accent' : ''} />}
            {t.label}
            {on && !mobile && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-ink" />}
            {on && mobile && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
          </button>
        )
      })}
    </nav>
  )
}
