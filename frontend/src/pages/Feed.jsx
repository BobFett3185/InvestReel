import { useState, useEffect, useRef } from 'react'
import { fetchFollowingReels, toggleSupabaseLike } from '../api'
import InvestModal from '../components/InvestModal'
import './Feed.css'

function Feed({ session }) {
  const [reels, setReels] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [likeAnimations, setLikeAnimations] = useState({})
  const [investReel, setInvestReel] = useState(null)
  
  const containerRef = useRef(null)
  const videoRefs = useRef({})

  useEffect(() => {
    if (session?.user?.id) {
      loadReels()
    }
  }, [session])

  useEffect(() => {
    // Pause all videos except current for performance & UX
    Object.entries(videoRefs.current).forEach(([idx, video]) => {
      if (video) {
        if (parseInt(idx) === currentIndex) {
          video.play().catch(() => {})
        } else {
          video.pause()
          // Reset video to start to save memory or keep clean state
          video.currentTime = 0 
        }
      }
    })
  }, [currentIndex])

  const loadReels = async () => {
    try {
      setLoading(true)
      let data = await fetchFollowingReels(session.user.id)
      
      // Fallback to discovery feed if user follows nobody
      if (!data || data.length === 0) {
        import('../api').then(async (api) => {
          const discoveryData = await api.fetchDiscoveryReels()
          setReels(discoveryData || [])
          setLoading(false)
        })
        return
      }

      setReels(data)
    } catch (e) {
      console.error('Error fetching reels:', e)
    } finally {
      // If we didn't return early due to async fallback
      setLoading(false)
    }
  }

  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return
    const scrollTop = container.scrollTop
    const height = container.clientHeight
    const newIndex = Math.round(scrollTop / height)
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
    }
  }

  const handleLike = async (reel) => {
    const isLiked = reel.likes?.some(like => like.user_id === session?.user?.id)
    const newLikeCount = isLiked ? Math.max(0, reel.like_count - 1) : reel.like_count + 1
    
    // Optimistic UI update
    setReels(prev => prev.map(r => {
      if (r.id === reel.id) {
        const nextLikesArr = isLiked 
          ? (r.likes || []).filter(l => l.user_id !== session.user.id)
          : [...(r.likes || []), { user_id: session.user.id }]
          
        return {
          ...r,
          like_count: newLikeCount,
          likes: nextLikesArr
        }
      }
      return r
    }))

    if (!isLiked) {
      setLikeAnimations(prev => ({ ...prev, [reel.id]: true }))
      setTimeout(() => {
        setLikeAnimations(prev => ({ ...prev, [reel.id]: false }))
      }, 600)
    }

    try {
      await toggleSupabaseLike(session.user.id, reel.id, isLiked)
    } catch (e) {
      console.error('Failed to toggle like:', e)
      // On failure, revert data
      loadReels()
    }
  }

  const formatCount = (n) => {
    if (!n) return '0'
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  if (loading) {
    return (
      <div className="feed-loading">
        <div className="feed-loading-spinner" />
        <p>Loading your feed...</p>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="feed-loading">
        <p>You aren't following anyone with reels yet.</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Discover creators in the Market tab!</p>
      </div>
    )
  }

  return (
    <div className="feed-container" id="feed-container">
      <div className="feed-scroll" ref={containerRef} onScroll={handleScroll}>
        {reels.map((reel, index) => {
          const isLiked = reel.likes?.some(like => like.user_id === session?.user?.id);
          
          return (
          <div key={reel.id} className="reel-slide" id={`reel-${reel.id}`}>
            {/* Video */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              className="reel-video"
              src={reel.video_url}
              loop
              muted={false} /* Consider muting by default on load, then unmute on interaction */
              playsInline
              preload={Math.abs(index - currentIndex) <= 1 ? 'auto' : 'none'}
              onClick={(e) => {
                const vid = e.target
                vid.paused ? vid.play() : vid.pause()
              }}
            />

            {/* Gradient overlay */}
            <div className="reel-gradient-overlay" />

            {/* Like animation */}
            {likeAnimations[reel.id] && (
              <div className="reel-heart-burst">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="var(--accent-pink)">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
            )}

            {/* Bottom info overlay */}
            <div className="reel-info">
              <div className="reel-user-row">
                {reel.users?.avatar_url && (
                  <img src={reel.users.avatar_url} alt="" className="reel-user-avatar" />
                )}
                <span className="reel-username">@{reel.users?.username}</span>
              </div>
              <p className="reel-caption">{reel.caption}</p>
            </div>

            {/* Right action bar */}
            <div className="reel-actions">
              <button
                className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
                onClick={() => handleLike(reel)}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill={isLiked ? 'var(--accent-pink)' : 'none'} stroke={isLiked ? 'var(--accent-pink)' : 'white'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="action-count">{formatCount(reel.like_count)}</span>
              </button>

              <button
                className="action-btn invest-btn"
                onClick={() => setInvestReel(reel)}
              >
                <div className="invest-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <span className="action-label">Invest</span>
                <span className="action-price">${(reel.price || 10.00).toFixed(2)}</span>
              </button>

              <button
                className="action-btn"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Reel by @${reel.users?.username}`,
                      url: window.location.href,
                    }).catch(() => {})
                  }
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </div>
          </div>
        )})}
      </div>

      {investReel && (
        <InvestModal 
          session={session}
          reel={investReel} 
          onClose={() => {
            setInvestReel(null)
            loadReels() // reload feed so price changes reflect visually
          }} 
        />
      )}
    </div>
  )
}

export default Feed
