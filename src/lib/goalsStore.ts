import { upload } from '@vercel/blob/client'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeCode } from './codes'
import { fbPlayers } from './firebase'
import { clipId, voteId, type Clip, type Comment, type Vote } from './goals'

const LS = 'abantu-goals-v1'
const ME = 'abantu-me'

interface Data { clips: Clip[]; votes: Vote[]; comments: Comment[] }

const read = (): Data => {
  try {
    const d = JSON.parse(localStorage.getItem(LS) ?? 'null') as Partial<Data> | null
    return { clips: d?.clips ?? [], votes: d?.votes ?? [], comments: d?.comments ?? [] }
  } catch { return { clips: [], votes: [], comments: [] } }
}
const put = <T extends { id: string }>(list: T[], item: T) => [...list.filter((x) => x.id !== item.id), item]

/**
 * Clips, votes and comments. Players don't use the PIN: they write through their own device sign-in, and the
 * Firestore rules only accept a write from the device that has claimed that player's name (see useMe).
 * Local mode (no Firebase) keeps everything on the device.
 */
export function useGoals() {
  const [data, setData] = useState<Data | null>(fbPlayers ? null : read)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!fbPlayers) return
    const { db } = fbPlayers
    const fail = (e: Error) => setError(e.message)
    let clips: Clip[] | null = null
    let votes: Vote[] | null = null
    let comments: Comment[] | null = null
    const push = () => { if (clips && votes && comments) setData({ clips, votes, comments }) }
    const offs = [
      onSnapshot(collection(db, 'clips'), (s) => { clips = s.docs.map((d) => d.data() as Clip); push() }, fail),
      onSnapshot(collection(db, 'votes'), (s) => { votes = s.docs.map((d) => d.data() as Vote); push() }, fail),
      onSnapshot(collection(db, 'comments'), (s) => { comments = s.docs.map((d) => d.data() as Comment); push() }, fail),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  const save = useCallback(async (kind: 'clips' | 'votes' | 'comments', item: Clip | Vote | Comment) => {
    try {
      if (fbPlayers) await setDoc(doc(fbPlayers.db, kind, item.id), item)
      else {
        const cur = read()
        const next = { ...cur, [kind]: put(cur[kind] as { id: string }[], item) }
        localStorage.setItem(LS, JSON.stringify(next))
        setData(next)
      }
      setError(null)
    } catch (e) {
      setError((e as { code?: string }).code === 'permission-denied' ? 'This phone is not verified as you yet. Tap "Verify it\'s you" and enter your code.' : (e as Error).message)
    }
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

  const addComment = useCallback((clip: string, authorId: string, text: string, at: string) => save('comments', { id: crypto.randomUUID(), clipId: clip, authorId, text: text.trim(), at }), [save])

  return { clips: data?.clips ?? null, votes: data?.votes ?? [], comments: data?.comments ?? [], addClip, castVote, addComment, error }
}

export type Verified = 'checking' | 'yes' | 'no'

/**
 * Who this device is. In shared mode a name only counts once it is claimed: the player enters their personal code,
 * the rules compare it to the one the Coach made, and the claim ties the name to this device's sign-in. Votes,
 * clips and comments are then only accepted from this device. Entering someone else's name needs their code.
 * The remembered name is just a hint; the claim on the server is what counts. Local mode: a plain name picker.
 */
export function useMe() {
  const [saved, setSaved] = useState<string | null>(() => { try { return localStorage.getItem(ME) } catch { return null } })
  const [uid, setUid] = useState<string | null>(null)
  const [verified, setVerified] = useState<Verified>(fbPlayers ? 'checking' : 'yes')
  const [authError, setAuthError] = useState<string | null>(null)
  const justClaimed = useRef<string | null>(null) // a claim we just made needs no second check

  const remember = (id: string | null) => {
    setSaved(id)
    try { id ? localStorage.setItem(ME, id) : localStorage.removeItem(ME) } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!fbPlayers) return
    const { auth } = fbPlayers
    return onAuthStateChanged(auth, (u) => {
      if (u) setUid(u.uid)
      else signInAnonymously(auth).catch(() => setAuthError('Could not sign this phone in. The Coach needs to switch on Anonymous sign-in in Firebase.'))
    })
  }, [])

  // Is the remembered name really claimed by this device?
  useEffect(() => {
    if (!fbPlayers || !uid) return
    if (!saved) { setVerified('no'); return }
    if (justClaimed.current === saved) return
    setVerified('checking')
    let live = true
    getDoc(doc(fbPlayers.db, 'claims', saved))
      .then((s) => { if (live) setVerified(s.exists() && s.data().uid === uid ? 'yes' : 'no') })
      .catch(() => { if (live) setVerified('no') }) // not readable = not ours
    return () => { live = false }
  }, [saved, uid])

  /** Claim a name with its code. Resolves to an error message, or null on success. */
  const claim = useCallback(async (playerId: string, code: string): Promise<string | null> => {
    if (!fbPlayers) { remember(playerId); return null }
    if (!uid) return authError ?? 'Still connecting. Try again in a moment.'
    try {
      await setDoc(doc(fbPlayers.db, 'claims', playerId), { playerId, uid, code: normalizeCode(code) })
      justClaimed.current = playerId
      remember(playerId)
      setVerified('yes')
      return null
    } catch (e) {
      return (e as { code?: string }).code === 'permission-denied' ? "That code doesn't match. Ask the Coach for your code, or to make you a new one." : (e as Error).message
    }
  }, [uid, authError])

  /** `me` is only set once the name is verified. `saved` is the remembered name, for pre-filling the picker. */
  return { me: verified === 'yes' ? saved : null, saved, verified, claim, authError, forget: () => remember(null) }
}
