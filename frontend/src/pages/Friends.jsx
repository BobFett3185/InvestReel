import { useState, useEffect } from 'react'
import { searchUsers, fetchSuggestedFriends, toggleFollow, fetchMyFollows } from '../api'
import './Friends.css'

export default function Friends({ session, onStartChat }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [suggested, setSuggested] = useState([])
  const [loading, setLoading] = useState(false)
  const [myFollows, setMyFollows] = useState(new Set())

  useEffect(() => {
    if (session?.user?.id) {
      loadInitialData()
    }
  }, [session])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch()
      } else {
        setSearchResults([])
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const currentUserId = session.user.id
      
      // Load who I follow
      const followsArr = await fetchMyFollows(currentUserId)
      setMyFollows(new Set(followsArr))

      // Load suggestions
      const suggestions = await fetchSuggestedFriends(currentUserId)
      setSuggested(suggestions || [])
    } catch (e) {
      console.error('Failed to load friends data:', e)
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async () => {
    try {
      const results = await searchUsers(searchQuery)
      setSearchResults(results || [])
    } catch (e) {
      console.error('Search failed:', e)
    }
  }

  const handleToggleFollow = async (userId) => {
    const currentlyFollowing = myFollows.has(userId)
    
    // Optimistic UI toggle
    setMyFollows(prev => {
      const next = new Set(prev)
      if (currentlyFollowing) next.delete(userId)
      else next.add(userId)
      return next
    })

    try {
      await toggleFollow(session.user.id, userId, currentlyFollowing)
    } catch (e) {
      console.error('Follow failed:', e)
      // Revert optimism if it fails
      setMyFollows(prev => {
        const next = new Set(prev)
        if (currentlyFollowing) next.add(userId)
        else next.delete(userId)
        return next
      })
    }
  }

  const UserRow = ({ user }) => {
    const isFollowing = myFollows.has(user.id)
    return (
      <div className="friend-row glass-card">
        <img src={user.avatar_url} alt="" className="friend-avatar" />
        <div className="friend-info">
          <h3>@{user.username}</h3>
        </div>
        <div className="friend-actions">
          <button
            className="message-btn"
            onClick={() => onStartChat?.(user)}
          >
            Message
          </button>
          <button 
            className={`follow-btn ${isFollowing ? 'following' : ''}`}
            onClick={() => handleToggleFollow(user.id)}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="friends-view">
      <div className="friends-header">
        <h1>Discover Friends</h1>
      </div>

      <div className="search-container">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input 
          type="text" 
          placeholder="Search usernames..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="friends-content-scroll">
        {searchQuery.trim() ? (
          <div className="section">
            <h2>Search Results</h2>
            {searchResults.length === 0 ? (
              <p className="empty-text">No users found.</p>
            ) : (
              <div className="user-list">
                {searchResults.map(user => (
                  <UserRow key={user.id} user={user} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="section">
            <h2>Suggested for You</h2>
            {loading ? (
              <div className="spinner-center"><div className="spinner" /></div>
            ) : suggested.length === 0 ? (
              <p className="empty-text">No suggestions right now. Invite your friends!</p>
            ) : (
              <div className="user-list">
                {suggested.map(user => (
                  <UserRow key={user.id} user={user} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
