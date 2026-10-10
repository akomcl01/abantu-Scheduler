import { upload } from '@vercel/blob/client'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { fb } from './firebase'
import { clipId, voteId, type Clip, type Vote } from './goals'

const LS = 'abantu-goals-v1'
const ME = 'abantu-me'

interface Data { clips: Clip[]; votes: Vote[] }

const read = (): Data => {
  try {
    const d = JSON.parse(localStorage.getItem(LS) ?? 'null') as Partial<Data> | null
    return { clips: d?.clips ?? [], votes: d?.votes ?? [] }
  } catch { return { clips: [], votes: [] } }
}
const put = <T extends { id: string }>(list: T[], item: T) => [...list.filter((x) => x.id !== item.id), item]

/**
 * Clips and votes. Players don't need the PIN, so these have their own collections and writes
 * (the Firestore rules accept well-formed `clips` and `votes` documents from anyone).
 * Local mode (no Firebase) keeps them on the device.
 */
export function useGoals() {
  const [data, setData] = useState<Data | null>(fb ? null : read)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!fb) return
    const { db } = fb
    const fail = (e: Error) => setError(e.message)
    let clips: Clip[] | null = null
    let votes: Vote[] | null = null
    const push = () => { if (clips && votes) setData({ clips, votes }) }
    const offs = [
      onSnapshot(collection(db, 'clips'), (s) => { clips = s.docs.map((d) => d.data() as Clip); push() }, fail),
      onSnapshot(collection(db, 'votes'), (s) => { votes = s.docs.map((d) => d.data() as Vote); push() }, fail),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  const save = useCallback(async (kind: 'clips' | 'votes', item: Clip | Vote) => {
    try {
      if (fb) await setDoc(doc(fb.db, kind, item.id), item)
      else {
        const cur = read()
        const next = kind === 'clips' ? { ...cur, clips: put(cur.clips, item as Clip) } : { ...cur, votes: put(cur.votes, item as Vote) }
        localStorage.setItem(LS, JSON.stringify(next))
        setData(next)
      }
      setError(null)
    } catch (e) { setError((e as Error).message) }
  }, [])

  /** Upload the video to Vercel Blob, then record it. Resolves to an error message, or null on success. */
  const addClip = useCallback(async (file: File, week: string, playerId: string, title: string, at: string, onProgress: (pct: number) => void): Promise<string | null> => {
    const ext = (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
    try {
      const blob = await upload(`goals/${week}/${playerId}.${ext.length >= 2 && ext.length <= 5 ? ext : 'mp4'}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        multipart: true,
        onUploadProgress: (p) => onProgress(Math.round(p.percentage)),
      })
      await save('clips', { id: clipId(week, playerId), week, playerId, title: title.trim(), url: blob.url, at })
      return null
    } catch (e) {
      return `Upload failed: ${(e as Error).message}. Uploads only work on the deployed app.`
    }
  }, [save])

  const castVote = useCallback((week: string, voterId: string, clip: string) => save('votes', { id: voteId(week, voterId), week, voterId, clipId: clip }), [save])

  return { clips: data?.clips ?? null, votes: data?.votes ?? [], addClip, castVote, error }
}

/** Who this device belongs to ("Playing as…"). Remembered on the device, not the PIN. */
export function useMe() {
  const [me, setMe] = useState<string | null>(() => { try { return localStorage.getItem(ME) } catch { return null } })
  const choose = (id: string | null) => {
    setMe(id)
    try { id ? localStorage.setItem(ME, id) : localStorage.removeItem(ME) } catch { /* ignore */ }
  }
  return [me, choose] as const
}
