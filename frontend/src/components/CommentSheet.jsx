import { useState, useEffect, useRef } from 'react'
import { fetchComments, addComment } from '../api'
import './CommentSheet.css'

function CommentSheet({ reelId, onClose }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => {
    loadComments()
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [reelId])

  const loadComments = async () => {
    try {
      const data = await fetchComments(reelId)
      setComments(data.comments || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    try {
      const newComment = await addComment(reelId, 'guest_user', text.trim())
      setComments((prev) => [newComment, ...prev])
      setText('')
    } catch (e) {
      console.error(e)
    }
  }

  const timeAgo = (timestamp) => {
    const diff = Math.floor(Date.now() / 1000 - timestamp)
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="comment-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="comment-header">
          <h3>Comments ({comments.length})</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="comment-list">
          {loading ? (
            <div className="comment-loading">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="comment-empty">No comments yet. Be the first!</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar-wrapper">
                  <div className="comment-avatar">
                    {comment.username[0].toUpperCase()}
                  </div>
                </div>
                <div className="comment-content">
                  <div className="comment-meta">
                    <span className="comment-author">@{comment.username}</span>
                    <span className="comment-time">{timeAgo(comment.timestamp)}</span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form className="comment-input-area" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            id="comment-input"
            type="text"
            className="comment-input"
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
          />
          <button
            id="send-comment-btn"
            type="submit"
            className="comment-send"
            disabled={!text.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

export default CommentSheet
