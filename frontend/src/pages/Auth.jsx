import { useState } from 'react'
import { supabase } from '../supabaseClient'
import './Auth.css'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      if (isSignUp) {
        console.log('Attempting signup for:', email)
        // 1. Sign up user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error
        console.log('Signup successful, user ID:', data.user?.id)

        // 2. Automatically create their profile in `users` table
        if (data?.user) {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              username: email.split('@')[0], // fallback to email root
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email.split('@')[0]}`,
            })
          
          if (profileError) {
            console.error('Error creating profile in "users" table:', profileError)
            setErrorMsg(`Signup worked, but profile creation failed: ${profileError.message}`)
          } else {
            console.log('Profile created successfully')
          }
        }
      } else {
        console.log('Attempting login for:', email)
        // Log in user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        console.log('Login successful')
      }
    } catch (error) {
      console.error('Auth error:', error)
      setErrorMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <h1 className="auth-title">
          <span className="gradient-text">RealInvest</span>
        </h1>
        <p className="auth-subtitle">
          {isSignUp ? 'Create an account to start investing' : 'Log in to your account'}
        </p>

        <form onSubmit={handleAuth} className="auth-form">

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {errorMsg && <div className="auth-error">{errorMsg}</div>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="auth-toggle">
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg(null)
            }}
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  )
}
