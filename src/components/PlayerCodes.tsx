import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { newCode, showCode } from '../lib/codes'
import { fb } from '../lib/firebase'
import type { Member } from '../lib/rotation'
import { Avatar, Btn, Card, Pill, SectionTitle } from './ui'

/**
 * The Coach makes a personal code per player here and sends it to them privately. A new code also cancels the
 * player's current phone, so it is the fix for a lost phone or a leaked code. Codes live in `codes/{player}` and
 * claims in `claims/{player}`; both can only be read with the editor sign-in.
 */
export default function PlayerCodes({ members, canEdit, onNeedUnlock }: { members: Member[]; canEdit: boolean; onNeedUnlock: () => void }) {
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [claimed, setClaimed] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!fb || !canEdit) return
    const fail = (e: Error) => setError(e.message)
    const offs = [
      onSnapshot(collection(fb.db, 'codes'), (s) => setCodes(Object.fromEntries(s.docs.map((d) => [d.id, String(d.data().code ?? '')]))), fail),
      onSnapshot(collection(fb.db, 'claims'), (s) => setClaimed(new Set(s.docs.map((d) => d.id))), fail),
    ]
    return () => offs.forEach((off) => off())
  }, [canEdit])

  if (!fb) return null
  const players = members.filter((m) => m.active)

  const make = async (ids: string[]) => {
    if (!fb) return
    const batch = writeBatch(fb.db)
    ids.forEach((id) => { batch.set(doc(fb!.db, 'codes', id), { code: newCode() }); batch.delete(doc(fb!.db, 'claims', id)) })
    try { await batch.commit(); setError(null) } catch (e) { setError((e as Error).message) }
  }
  const copy = (id: string, text: string) => { navigator.clipboard?.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 1500) }
  const missing = players.filter((m) => !codes[m.id]).map((m) => m.id)

  return (
    <section>
      <SectionTitle aside={canEdit && missing.length > 0 && <button onClick={() => make(missing)} className="min-h-9 text-xs font-semibold text-gold">Make codes for {missing.length === players.length ? 'everyone' : `${missing.length} new`}</button>}>Player codes</SectionTitle>
      <Card className="divide-y divide-hair overflow-hidden">
        <p className="p-5 text-sm text-mute">Each player needs a personal code to upload, upvote and comment in Goals. Send it to them privately. It ties their name to their phone, so nobody can vote as someone else. A new code also signs their old phone out.</p>
        {!canEdit ? (
          <div className="flex items-center justify-between gap-3 p-5"><p className="text-sm text-mute">Unlock editing to see and make codes.</p><Btn variant="primary" onClick={onNeedUnlock}>Unlock</Btn></div>
        ) : (
          <>
            {error && <p className="p-5 text-sm text-accent">{error}</p>}
            {players.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar m={m} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="text-sm tabular-nums text-mute">{codes[m.id] ? showCode(codes[m.id]) : 'No code yet'}</p>
                </div>
                {codes[m.id] && (claimed.has(m.id) ? <Pill tone="accent">On a phone</Pill> : <Pill>Not used</Pill>)}
                {codes[m.id] && <Btn className="min-h-10 px-3" onClick={() => copy(m.id, showCode(codes[m.id]))}>{copied === m.id ? 'Copied' : 'Copy'}</Btn>}
                <Btn className="min-h-10 px-3" onClick={() => make([m.id])}>{codes[m.id] ? 'New' : 'Make'}</Btn>
              </div>
            ))}
          </>
        )}
      </Card>
    </section>
  )
}
