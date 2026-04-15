import { useState, useEffect } from 'react'
import { fetchUser } from '../api'
import './Profile.css'

function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('reels')

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const data = await fetchUser(1) // Default to user 1
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
            <span className="profile-stat-value">{formatCount(user.followers)}</span>
            <span className="profile-stat-label">Followers</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{formatCount(user.following)}</span>
            <span className="profile-stat-label">Following</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{formatCount(user.total_likes)}</span>
            <span className="profile-stat-label">Likes</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="profile-edit-btn">Edit Profile</button>
          <button className="profile-share-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Portfolio card */}
      <div className="portfolio-card glass-card">
        <div className="portfolio-header">
          <span className="portfolio-icon">💰</span>
          <span className="portfolio-title">Portfolio</span>
        </div>
        <div className="portfolio-value gradient-text">${user.portfolio_value?.toFixed(2)}</div>
        <div className="portfolio-meta">
          <span>👁 {formatCount(user.total_views)} total views</span>
          <span>📹 {user.reels?.length || 0} reels</span>
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
        {(user.reels || []).map((reel) => (
          <div key={reel.id} className="profile-grid-item" id={`profile-reel-${reel.id}`}>
            <img src={reel.thumbnail} alt="" className="profile-grid-thumb" />
            <div className="profile-grid-overlay">
              <span className="grid-stat">▶ {formatCount(reel.views)}</span>
              <span className="grid-stat">💰 ${reel.price?.toFixed(2)}</span>
            </div>
          </div>
        ))}
        {(user.reels || []).length === 0 && (
          <div className="profile-empty">
            <p>No reels yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
