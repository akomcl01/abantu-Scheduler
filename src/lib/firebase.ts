import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const env = import.meta.env
const projectId = env.VITE_FIREBASE_PROJECT_ID as string | undefined
const apiKey = env.VITE_FIREBASE_API_KEY as string | undefined
const appId = env.VITE_FIREBASE_APP_ID as string | undefined

/** The one shared editor account. Its password is the group PIN. */
export const editorEmail = (env.VITE_FIREBASE_EDITOR_EMAIL as string | undefined) ?? ''

const options = projectId && apiKey && appId && editorEmail
  ? { apiKey, appId, projectId, authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ?? `${projectId}.firebaseapp.com` }
  : null

/** null when Firebase isn't configured: the app then runs in local mode. */
export const fb = options
  ? (() => {
      const app = initializeApp(options)
      return {
        auth: getAuth(app),
        db: initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }),
      }
    })()
  : null

/**
 * Goal-of-the-week players use a second Firebase app: its own anonymous sign-in per device, kept apart from the
 * editor's PIN sign-in so the two never replace each other. A player's device is tied to their name by a claim.
 */
export const fbPlayers = options
  ? (() => {
      const app = initializeApp(options, 'players')
      return { auth: getAuth(app), db: getFirestore(app) }
    })()
  : null
