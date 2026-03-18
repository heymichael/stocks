import { useMemo, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { isAuthorizedEmail } from './accessPolicy'
import { getAuthRuntimeConfig } from './runtimeConfig'

interface AuthGateProps {
  children: ReactNode
}

function getFirebaseAppInstance(): FirebaseApp | null {
  const runtimeConfig = getAuthRuntimeConfig()
  if (!runtimeConfig.firebaseConfig) {
    return null
  }
  if (getApps().length > 0) {
    return getApp()
  }
  return initializeApp(runtimeConfig.firebaseConfig)
}

type AuthStatus = 'loading' | 'signed_out' | 'authorized' | 'unauthorized' | 'config_error'

export function AuthGate({ children }: AuthGateProps) {
  const runtimeConfig = useMemo(() => getAuthRuntimeConfig(), [])
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (runtimeConfig.bypassAuth) {
      return 'authorized'
    }
    if (runtimeConfig.configError) {
      return 'config_error'
    }
    return 'loading'
  })
  const [authError, setAuthError] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => {
    if (runtimeConfig.bypassAuth || runtimeConfig.configError) {
      return
    }
    const app = getFirebaseAppInstance()
    if (!app) {
      setStatus('config_error')
      return
    }
    const auth = getAuth(app)
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      if (!nextUser) {
        setStatus('signed_out')
        return
      }
      if (isAuthorizedEmail(nextUser.email)) {
        setStatus('authorized')
      } else {
        setStatus('unauthorized')
      }
    })
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      setAuthError(error instanceof Error ? error.message : 'Failed to set auth persistence.')
    })
    return unsubscribe
  }, [runtimeConfig.bypassAuth, runtimeConfig.configError])

  const signIn = async () => {
    const app = getFirebaseAppInstance()
    if (!app) {
      setStatus('config_error')
      return
    }
    setAuthBusy(true)
    setAuthError(null)
    try {
      const auth = getAuth(app)
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, provider)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed.'
      setAuthError(message)
    } finally {
      setAuthBusy(false)
    }
  }

  const signOutCurrentUser = async () => {
    const app = getFirebaseAppInstance()
    if (!app) {
      setStatus('config_error')
      return
    }
    setAuthBusy(true)
    try {
      await signOut(getAuth(app))
    } finally {
      setAuthBusy(false)
    }
  }

  if (status === 'authorized') {
    return <>{children}</>
  }

  return (
    <main className="auth-gate-shell">
      <section className="auth-gate-card" aria-live="polite">
        <h1>Sign in required</h1>
        {status === 'config_error' ? (
          <p>
            Authentication is unavailable because runtime configuration is missing. Please contact
            your administrator.
          </p>
        ) : status === 'unauthorized' ? (
          <>
            <p>
              You are signed in as <strong>{user?.email || 'unknown user'}</strong>, but this account
              is not on the allow list.
            </p>
            <p>Please contact your administrator to be added to the list.</p>
          </>
        ) : (
          <>
            <p>Sign in with your Google account to continue.</p>
            <p>Please contact your administrator if you need access.</p>
          </>
        )}
        {authError ? <p className="auth-gate-error">Authentication error: {authError}</p> : null}
        <div className="auth-gate-actions">
          {status === 'unauthorized' ? (
            <button onClick={signOutCurrentUser} disabled={authBusy}>
              Sign out
            </button>
          ) : (
            <button onClick={signIn} disabled={authBusy || status === 'config_error'}>
              Sign in with Google
            </button>
          )}
        </div>
      </section>
    </main>
  )
}
