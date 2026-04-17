import { useState, useEffect } from 'react'
import { fetchUser, updateUserProfile } from '../api'
import { supabase } from '../supabaseClient'
import './Profile.css'

function ProfileEditModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.display_name || '')
  const [handle, setHandle] = useState(user.username || '')
  const [bio, setBio] = useState(user.bio || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        display_name: name,
        username: handle,
        bio: bio
      })
      onClose()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 110 }}>
      <div className="invest-modal animate-slide-up" onClick={e => e.stopPropagation()} style={{ height: 'auto', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3>Edit Profile</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '0 20px 20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Display Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} 
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Username (Handle)</label>
            <input 
              type="text" 
              value={handle} 
              onChange={e => setHandle(e.target.value)} 
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} 
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Bio</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', minHeight: '80px', fontFamily: 'inherit', resize: 'none' }} 
            />
          </div>
          
          <button type="submit" className="finish-btn" disabled={saving} style={{ width: '100%' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Profile({ session }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('reels')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      if (!session?.user?.id) return
      const data = await fetchUser(session.user.id)
      setUser(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const formatCount = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="feed-loading-spinner" />
        <p>Loading profile...</p>
      </div>
    )
  }

  if (!user) {
    return <div className="profile-loading"><p>User not found</p></div>
  }

  return (
    <div className="profile-container" id="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <img src={user.avatar} alt={user.username} className="profile-avatar" />
          <div className="profile-avatar-ring" />
        </div>
        <h2 className="profile-display-name">{user.display_name}</h2>
        <p className="profile-username">@{user.username}</p>
        <p className="profile-bio">{user.bio}</p>

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{formatCount(user.followers || 0)}</span>
            <span className="profile-stat-label">Followers</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{formatCount(user.following || 0)}</span>
            <span className="profile-stat-label">Following</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{formatCount(user.total_likes || 0)}</span>
            <span className="profile-stat-label">Likes</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="profile-edit-btn" onClick={() => setIsEditModalOpen(true)}>Edit Profile</button>
          <button className="profile-share-btn" title="Share Profile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <button className="profile-share-btn" title="Log Out" onClick={() => supabase.auth.signOut()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Portfolio card */}
      <div className="portfolio-card glass-card">
        <div className="portfolio-header">
          <span className="portfolio-icon">💰</span>
          <span className="portfolio-title">Portfolio Worth</span>
        </div>
        <div className="portfolio-value gradient-text">${user.portfolio_value?.toFixed(2)}</div>
        <div className="portfolio-meta">
          <span>Available Cash: ${(user.balance || 0).toFixed(2)}</span>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="glass-card" style={{ padding: '16px', margin: '0 16px 16px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Interested In</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(user.preferences || []).map(pref => (
            <span key={pref} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: 'var(--accent-cyan)' }}>
              #{pref}
            </span>
          ))}
          {(!user.preferences || user.preferences.length === 0) && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No preferences set.</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'reels' ? 'active' : ''}`}
          onClick={() => setActiveTab('reels')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="2" />
            <line x1="8" y1="2" x2="8" y2="22" />
            <line x1="16" y1="2" x2="16" y2="22" />
          </svg>
          Reels
        </button>
        <button
          className={`profile-tab ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
          Investments
        </button>
      </div>

      {/* Content Grid */}
      <div className="profile-grid">
        {activeTab === 'reels' && (user.reels || []).map((reel) => (
          <div key={reel.id} className="profile-grid-item" id={`profile-reel-${reel.id}`}>
            <div className="profile-grid-thumb" style={{ background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '24px' }}>▶</span>
            </div>
            <div className="profile-grid-overlay">
              <span className="grid-stat">💰 ${(reel.price || 10).toFixed(2)}</span>
            </div>
          </div>
        ))}
        {activeTab === 'investments' && (user.investments || []).map((inv) => (
          <div key={inv.id} className="profile-grid-item" style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>You hold {inv.shares_bought.toFixed(2)} shares</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Value: ${inv.current_value.toFixed(2)}</span>
            <span className={inv.return_pct >= 0 ? 'price-up' : 'price-down'} style={{ fontSize: '12px' }}>
              {inv.return_pct >= 0 ? '+' : ''}{inv.return_pct.toFixed(2)}% Return
            </span>
          </div>
        ))}
        
        {activeTab === 'reels' && (user.reels || []).length === 0 && (
          <div className="profile-empty" style={{ gridColumn: '1 / -1', padding: '20px' }}>
            <p>No reels created yet</p>
          </div>
        )}
        {activeTab === 'investments' && (user.investments || []).length === 0 && (
          <div className="profile-empty" style={{ gridColumn: '1 / -1', padding: '20px' }}>
            <p>No investments yet</p>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <ProfileEditModal 
          user={user} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={async (updates) => {
            const updated = await updateUserProfile(session.user.id, updates)
            setUser(prev => ({ ...prev, ...updated }))
          }}
        />
      )}
    </div>
  )
}

export default Profile
