import { useMemo, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signOut,
  type User,
} from 'firebase/auth'
import { fetchUserRoles, hasAppAccess } from './accessPolicy'
import { getAuthRuntimeConfig } from './runtimeConfig'

const PLATFORM_SIGN_IN_URL = '/'
const APP_PATH = '/stocks/'

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

type AuthStatus = 'loading' | 'redirecting' | 'authorized' | 'unauthorized' | 'config_error'

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
        setStatus('redirecting')
        window.location.replace(
          `${PLATFORM_SIGN_IN_URL}?returnTo=${encodeURIComponent(APP_PATH)}`,
        )
        return
      }
      setStatus('loading')
      fetchUserRoles(app, nextUser.email ?? '').then((roles) => {
        if (hasAppAccess(roles)) {
          setStatus('authorized')
        } else {
          setStatus('unauthorized')
        }
      })
    })
    setPersistence(auth, browserLocalPersistence).catch(() => {})
    return unsubscribe
  }, [runtimeConfig.bypassAuth, runtimeConfig.configError])

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

  if (status === 'loading' || status === 'redirecting') {
    return null
  }

  return (
    <main className="auth-gate-shell">
      <section className="auth-gate-card" aria-live="polite">
        {status === 'config_error' ? (
          <>
            <h1>Unavailable</h1>
            <p>
              Authentication is unavailable because runtime configuration is missing. Please contact
              your administrator.
            </p>
          </>
        ) : (
          <>
            <h1>Access denied</h1>
            <p>
              You are signed in as <strong>{user?.email || 'unknown user'}</strong>, but your
              account does not have access to this application.
            </p>
            <p>Please contact your administrator to be granted access.</p>
            <div className="auth-gate-actions">
              <button onClick={signOutCurrentUser} disabled={authBusy}>
                Sign out
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
