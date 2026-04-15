import { useState, useEffect, useRef } from 'react'
import { fetchReels, toggleLike, investInReel } from '../api'
import InvestModal from '../components/InvestModal'
import CommentSheet from '../components/CommentSheet'
import './Feed.css'

function Feed() {
  const [reels, setReels] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [investReel, setInvestReel] = useState(null)
  const [commentReelId, setCommentReelId] = useState(null)
  const [likeAnimations, setLikeAnimations] = useState({})
  const containerRef = useRef(null)
  const videoRefs = useRef({})

  useEffect(() => {
    loadReels()
  }, [])

  useEffect(() => {
    // Pause all videos except current
    Object.entries(videoRefs.current).forEach(([idx, video]) => {
      if (video) {
        if (parseInt(idx) === currentIndex) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      }
    })
  }, [currentIndex])

  const loadReels = async () => {
    try {
      const data = await fetchReels(1, 10)
      setReels(data.reels || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
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
    try {
      const res = await toggleLike(reel.id)
      setReels((prev) =>
        prev.map((r) =>
          r.id === reel.id
            ? { ...r, likes: res.likes, liked_by: res.liked ? [...r.liked_by, 'guest_user'] : r.liked_by.filter((u) => u !== 'guest_user'), price: res.price }
            : r
        )
      )
      if (res.liked) {
        setLikeAnimations((prev) => ({ ...prev, [reel.id]: true }))
        setTimeout(() => {
          setLikeAnimations((prev) => ({ ...prev, [reel.id]: false }))
        }, 600)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleInvest = async (reelId, amount) => {
    const res = await investInReel(reelId, 'guest_user', amount)
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId
          ? { ...r, price: res.new_price, investments: res.investments }
          : r
      )
    )
    return res
  }

  const handleShare = (reel) => {
    if (navigator.share) {
      navigator.share({
        title: `Check out this reel by @${reel.username}`,
        text: reel.caption,
        url: window.location.href,
      }).catch(() => {})
    }
  }

  const formatCount = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  if (loading) {
    return (
      <div className="feed-loading">
        <div className="feed-loading-spinner" />
        <p>Loading reels...</p>
      </div>
    )
  }

  return (
    <div className="feed-container" id="feed-container">
      <div className="feed-scroll" ref={containerRef} onScroll={handleScroll}>
        {reels.map((reel, index) => (
          <div key={reel.id} className="reel-slide" id={`reel-${reel.id}`}>
            {/* Video */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              className="reel-video"
              src={reel.video_url}
              loop
              muted
              playsInline
              preload={index <= 2 ? 'auto' : 'none'}
              poster={reel.thumbnail}
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
                <img src={reel.user_avatar} alt={reel.username} className="reel-user-avatar" />
                <span className="reel-username">@{reel.username}</span>
                <button className="follow-btn">Follow</button>
              </div>
              <p className="reel-caption">{reel.caption}</p>
              <div className="reel-song">
                <span className="song-icon">♫</span>
                <span className="song-text">{reel.song}</span>
              </div>
              <div className="reel-price-tag glass-card">
                <span className="price-label">💰</span>
                <span className="price-value">${reel.price?.toFixed(2)}</span>
              </div>
            </div>

            {/* Right action bar */}
            <div className="reel-actions">
              <button
                className={`action-btn like-btn ${reel.liked_by?.includes('guest_user') ? 'liked' : ''}`}
                id={`like-btn-${reel.id}`}
                onClick={() => handleLike(reel)}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill={reel.liked_by?.includes('guest_user') ? 'var(--accent-pink)' : 'none'} stroke={reel.liked_by?.includes('guest_user') ? 'var(--accent-pink)' : 'white'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="action-count">{formatCount(reel.likes)}</span>
              </button>

              <button
                className="action-btn"
                id={`comment-btn-${reel.id}`}
                onClick={() => setCommentReelId(reel.id)}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="action-count">{formatCount(reel.comments_count)}</span>
              </button>

              <button
                className="action-btn"
                id={`share-btn-${reel.id}`}
                onClick={() => handleShare(reel)}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span className="action-count">{formatCount(reel.shares)}</span>
              </button>

              <button
                className="action-btn invest-btn"
                id={`invest-btn-${reel.id}`}
                onClick={() => setInvestReel(reel)}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#invest-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="invest-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--accent-cyan)" />
                      <stop offset="100%" stopColor="var(--accent-purple)" />
                    </linearGradient>
                  </defs>
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span className="action-count gradient-text">${reel.price?.toFixed(2)}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {investReel && (
        <InvestModal
          reel={investReel}
          onClose={() => setInvestReel(null)}
          onInvest={(amount) => handleInvest(investReel.id, amount)}
        />
      )}
      {commentReelId && (
        <CommentSheet
          reelId={commentReelId}
          onClose={() => setCommentReelId(null)}
        />
      )}
    </div>
  )
}

export default Feed
