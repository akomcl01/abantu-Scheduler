import { useState } from 'react'
import { pastWinners, type Clip, type Vote } from '../lib/goals'
import { todayStr, type Member } from '../lib/rotation'
import { Avatar, Card, Icon, ICONS, fmtShort } from './ui'

/** Every finished week's winning goal, newest first. Winners are worked out from the stored clips and votes, so nothing extra is saved. */
export default function Vault({ clips, votes, who }: { clips: Clip[]; votes: Vote[]; who: (id: string) => Member }) {
  const winners = pastWinners(clips, votes, todayStr())
  return (
    <section>
      <p className="mb-3 px-1 text-sm text-mute">The best goal of every week, kept for good.</p>
      {winners.length === 0 ? <Card className="p-4 text-mute">Nothing here yet. A winner is added every Sunday.</Card> : (
        <Card className="divide-y divide-hair overflow-hidden">
          {winners.map(({ week, clip, votes: n }) => <Entry key={week} week={week} url={clip.url} title={clip.title} author={who(clip.playerId)} votes={n} />)}
        </Card>
      )}
    </section>
  )
}

/** Tap to play: the video only loads when opened, so a long vault stays light. */
function Entry({ week, url, title, author, votes }: { week: string; url: string; title: string; author: Member; votes: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left">
        <Avatar m={author} size={36} />
        <div className="min-w-0 flex-1"><p className="truncate font-medium">{author.name}</p><p className="truncate text-sm text-mute">{title || 'Untitled'}</p></div>
        <span className="shrink-0 text-right text-xs text-mute">Week of {fmtShort(week)}<br />{votes} {votes === 1 ? 'upvote' : 'upvotes'}</span>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold/15 text-gold"><Icon d={open ? ICONS.up : ICONS.play} size={18} /></span>
      </button>
      {open && <video src={url} controls autoPlay playsInline className="aspect-video w-full bg-black" />}
    </div>
  )
}
