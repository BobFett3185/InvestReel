import { useState } from 'react'
import { supabase } from '../supabaseClient'
import './Onboarding.css'

const CATEGORIES = [
  { id: 'tech', icon: '💻', label: 'Tech & Code' },
  { id: 'dance', icon: '💃', label: 'Dance' },
  { id: 'comedy', icon: '😂', label: 'Comedy' },
  { id: 'music', icon: '🎵', label: 'Music' },
  { id: 'outdoors', icon: '🏔️', label: 'Outdoors' },
  { id: 'gaming', icon: '🎮', label: 'Gaming' },
  { id: 'food', icon: '🍔', label: 'Food' },
  { id: 'fitness', icon: '💪', label: 'Fitness' },
]

export default function Onboarding({ session, onComplete }) {
  const [step, setStep] = useState(0)
  const [handle, setHandle] = useState('')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const toggleCategory = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleFinish = async () => {
    if (selected.length === 0) return
    setLoading(true)

    setError(null)
    try {
      const { error } = await supabase
        .from('users')
        .upsert({ 
          id: session.user.id,
          preferences: selected,
          username: handle.trim() || undefined,
          display_name: name.trim() || undefined,
          bio: bio.trim() || undefined
        })

      if (error) throw error
      onComplete()
    } catch (e) {
      console.error('Error saving preferences:', e)
      setError(e.message || 'Failed to save profile. Please try another handle.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card glass-card">
        {step === 0 ? (
          <div className="onboarding-intro animate-fade-in" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🚀</span>
            <h1 style={{ marginBottom: '12px' }}>Welcome to RealInvest</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
              RealInvest merges endless short-form scrolling with a simulated stock market.<br/><br/>
              Invest your starting <strong>$100.00</strong> portfolio into organic content before it goes viral. Watch your shares and net worth grow as videos blow up!
            </p>
            <button 
              className="finish-btn" 
              onClick={() => setStep(1)}
              style={{ padding: '14px 24px', fontSize: '16px' }}
            >
              Start Investing →
            </button>
          </div>
        ) : step === 1 ? (
          <div className="onboarding-intro animate-fade-in" style={{ textAlign: 'center' }}>
            <h1 style={{ marginBottom: '12px' }}>Personalize Profile</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Let others know who they are investing in.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  style={{ width: '100%', padding: '12px', marginTop: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Handle (@username)</label>
                <input 
                  type="text" 
                  value={handle} 
                  onChange={e => setHandle(e.target.value)}
                  placeholder="e.g. stonks_layer"
                  style={{ width: '100%', padding: '12px', marginTop: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Bio</label>
                <input 
                  type="text" 
                  value={bio} 
                  onChange={e => setBio(e.target.value)}
                  placeholder="e.g. Day trader & content creator"
                  style={{ width: '100%', padding: '12px', marginTop: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
                />
              </div>
            </div>

            <button 
              className="finish-btn" 
              onClick={() => setStep(2)}
              style={{ padding: '14px 24px', fontSize: '16px' }}
            >
              Next Step →
            </button>
          </div>
        ) : (
          <div className="animate-slide-up">
            <h1 style={{ marginBottom: '8px' }}>Personalize Your Feed</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Pick at least one topic to tune your initial market feed.</p>
            
            <div className="categories-grid">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.id}
                  className={`category-btn ${selected.includes(cat.id) ? 'selected' : ''}`}
                  onClick={() => toggleCategory(cat.id)}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-label">{cat.label}</span>
                </button>
              ))}
            </div>

            {error && <p style={{ color: '#ff4d4d', fontSize: '12px', marginTop: '12px' }}>{error}</p>}

            <button 
              className="finish-btn" 
              disabled={selected.length === 0 || loading || !handle}
              onClick={handleFinish}
              style={{ marginTop: '24px' }}
            >
              {loading ? 'Saving...' : 'Enter Market →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
