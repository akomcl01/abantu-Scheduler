import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const env = import.meta.env
const projectId = env.VITE_FIREBASE_PROJECT_ID as string | undefined
const apiKey = env.VITE_FIREBASE_API_KEY as string | undefined
const appId = env.VITE_FIREBASE_APP_ID as string | undefined

/** The one shared editor account. Its password is the group PIN. */
export const editorEmail = (env.VITE_FIREBASE_EDITOR_EMAIL as string | undefined) ?? ''

/** null when Firebase isn't configured: the app then runs in local mode. */
export const fb =
  projectId && apiKey && appId && editorEmail
    ? (() => {
        const app = initializeApp({ apiKey, appId, projectId, authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ?? `${projectId}.firebaseapp.com` })
        return {
          auth: getAuth(app),
          db: initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }),
        }
      })()
    : null
