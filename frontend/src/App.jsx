import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'
import Feed from './pages/Feed'
import Market from './pages/Market'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import Friends from './pages/Friends'
import BottomNav from './components/BottomNav'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    // Get currently active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) setLoading(false)
    })

    // Listen to auth state changes recursively
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Check preferences when session is established
  useEffect(() => {
    if (session?.user) {
      checkPreferences(session.user.id)
    }
  }, [session])

  const checkPreferences = async (userId) => {
    setIsChecking(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No user row yet, definitely needs onboarding
          setHasOnboarded(false)
        } else {
          throw error
        }
      } else {
        // If preferences array exists and has items, they've onboarded
        if (data?.preferences && Array.isArray(data.preferences) && data.preferences.length > 0) {
          setHasOnboarded(true)
        } else {
          setHasOnboarded(false)
        }
      }
    } catch (e) {
      console.error('Error fetching preferences:', e)
      setHasOnboarded(false) 
    } finally {
      setIsChecking(false)
      setLoading(false)
    }
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <Feed session={session} />
      case 'friends':
        return <Friends session={session} />
      case 'market':
        return <Market session={session} />
      case 'messages':
        return <Messages session={session} />
      case 'profile':
        return <Profile session={session} />
      default:
        return <Feed session={session} />
    }
  }

  // Show a blank or loading state while checking session originally
  if (loading || isChecking) {
    return (
      <div className="app-container" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="feed-loading-spinner" />
      </div>
    )
  }

  // Redirect to Auth if no active session
  if (!session) {
    return <Auth />
  }

  // Show Onboarding if user hasn't set preferences yet
  if (!hasOnboarded) {
    return <Onboarding session={session} onComplete={() => setHasOnboarded(true)} />
  }

  return (
    <div className="app-container">
      <div className="page-content">
        {renderPage()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
