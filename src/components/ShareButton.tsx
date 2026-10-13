import { useState } from 'react'
import { shareTitle, shareUrl, type Clip } from '../lib/goals'
import { Icon, ICONS, Sheet } from './ui'

/**
 * Opens the phone's native share sheet (WhatsApp, Messages...) with a direct link to the goal. Where the browser
 * has no native sheet (most desktops) or it fails, a share sheet of our own opens with the same options.
 */
export default function ShareButton({ clip, name, className = '' }: { clip: Clip; name: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const url = shareUrl(location.origin, clip.id)
  const title = shareTitle(clip.week)
  const text = `${title}\n${name}${clip.title ? ` - ${clip.title}` : ''}`

  const share = async () => {
    // Call share() straight from the tap: iPhones refuse it if anything is awaited first.
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title, text, url }); return } catch (e) {
        if ((e as DOMException).name === 'AbortError') return // closed the sheet
      }
    }
    setOpen(true)
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copy this link', url) }
  }
  const msg = encodeURIComponent(`${text}\n${url}`)
  const options = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${msg}` },
    { label: 'Telegram', href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { label: 'Messages', href: `sms:?&body=${msg}` },
    { label: 'Email', href: `mailto:?subject=${encodeURIComponent(title)}&body=${msg}` },
  ]

  return (
    <>
      <button onClick={share} aria-label={`Share ${name}'s goal`} className={`grid size-11 place-items-center rounded-full text-ink transition active:scale-90 ${className}`}>
        <Icon d={ICONS.share} size={26} />
      </button>
      {open && (
        <Sheet title="Share this goal" onClose={() => setOpen(false)}>
          <p className="mb-4 whitespace-pre-line text-sm text-mute">{text}</p>
          <div className="grid grid-cols-2 gap-2">
            {options.map((o) => (
              <a key={o.label} href={o.href} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center rounded-xl border border-hair bg-sand font-semibold">{o.label}</a>
            ))}
          </div>
          <button onClick={copy} className="mt-2 min-h-12 w-full rounded-xl bg-gradient-to-r from-primary-from to-primary-to font-semibold text-on-primary">{copied ? 'Link copied' : 'Copy link'}</button>
          <p className="mt-3 break-all text-xs text-mute">{url}</p>
        </Sheet>
      )}
    </>
  )
}
