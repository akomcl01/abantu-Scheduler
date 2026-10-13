import { useState } from 'react'
import { shareTitle, shareUrl, type Clip } from '../lib/goals'
import { Icon, ICONS } from './ui'

/** Opens the phone's share sheet (WhatsApp, Messages...) with a direct link to the goal. Falls back to copying the link. */
export default function ShareButton({ clip, name, className = '' }: { clip: Clip; name: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = shareUrl(location.origin, clip.id)
    const title = shareTitle(clip.week)
    const text = `${title}\n${name}${clip.title ? ` - ${clip.title}` : ''}`
    try {
      if (navigator.share) { await navigator.share({ title, text, url }); return }
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return // closed the share sheet
    }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copy this link', url) }
  }
  return (
    <button onClick={share} aria-label={`Share ${name}'s goal`} className={`grid size-11 place-items-center rounded-full text-ink transition active:scale-90 ${className}`}>
      {copied ? <span className="px-2 text-xs font-semibold text-accent">Copied</span> : <Icon d={ICONS.share} size={26} />}
    </button>
  )
}
