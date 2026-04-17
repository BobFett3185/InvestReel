import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import './Messages.css'

export default function Messages({ session }) {
  const [conversations, setConversations] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (session?.user?.id) {
      loadConversations()
    }
  }, [session])

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.conversation_id)
      
      // Subscribe to real-time messages for this conversation
      const subscription = supabase
        .channel(`chat_${activeChat.conversation_id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `conversation_id=eq.${activeChat.conversation_id}`
          }, 
          payload => {
            // Check if we need to expand reels data (this simplified version relies on full fetch or just pushes text)
            // For robustness, simply re-fetch or append
            loadMessages(activeChat.conversation_id)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [activeChat])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    setLoading(true)
    try {
      // 1. Get my conversation IDs
      const { data: myMatches } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', session.user.id)
      
      const cIds = myMatches?.map(m => m.conversation_id) || []
      
      if (cIds.length > 0) {
        // 2. Get the OTHER participants in those conversations to formulate the list
        const { data: others } = await supabase
          .from('conversation_participants')
          .select('conversation_id, users!inner(username, avatar_url, id)')
          .in('conversation_id', cIds)
          .neq('user_id', session.user.id)
        
        setConversations(others || [])
      }
    } catch (e) {
      console.error('Error loading conversations:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId) => {
    try {
      // Fetch messages AND outer join the reels if there's a reel attached
      const { data } = await supabase
        .from('messages')
        .select('*, reels(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      
      setMessages(data || [])
    } catch (e) {
      console.error('Error loading messages:', e)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    try {
      await supabase.from('messages').insert({
        conversation_id: activeChat.conversation_id,
        sender_id: session.user.id,
        content: inputText.trim()
      })
      setInputText('')
      // Message appears via real-time subscription or immediate UI update
      loadMessages(activeChat.conversation_id)
    } catch (e) {
      console.error('Failed to send message:', e)
    }
  }

  if (loading) {
    return <div className="messages-loading"><div className="spinner" /></div>
  }

  // --- RENDER CHAT VIEW ---
  if (activeChat) {
    return (
      <div className="chat-view">
        <div className="chat-header glass-card">
          <button className="back-btn" onClick={() => setActiveChat(null)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <img src={activeChat.users?.avatar_url} alt="" className="chat-avatar" />
          <span className="chat-username">@{activeChat.users?.username}</span>
        </div>

        <div className="chat-messages-area">
          {messages.map(msg => {
            const isMe = msg.sender_id === session.user.id
            return (
              <div key={msg.id} className={`message-bubble-wrapper ${isMe ? 'me' : 'them'}`}>
                <div className={`message-bubble ${isMe ? 'my-message' : 'their-message'}`}>
                  {msg.reels && (
                    <div className="shared-reel-preview">
                      <div className="reel-preview-header">
                        <span className="icon">🎬</span> Shared a Reel
                      </div>
                      <video src={msg.reels.video_url} className="mini-reel-video" muted playsInline />
                      <p className="mini-reel-caption">{msg.reels.caption}</p>
                    </div>
                  )}
                  {msg.content && <div className="message-content">{msg.content}</div>}
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <input 
            type="text" 
            placeholder="Message..." 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <button type="submit" disabled={!inputText.trim()}>Send</button>
        </form>
      </div>
    )
  }

  // --- RENDER CONVERSATIONS LIST ---
  return (
    <div className="conversations-view">
      <div className="messages-header">
        <h1>Messages</h1>
      </div>
      
      {conversations.length === 0 ? (
        <div className="no-conversations">
          No conversations yet. Go to the feed to share a reel and start chatting!
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map(chat => (
            <div 
              key={chat.conversation_id} 
              className="conversation-item"
              onClick={() => setActiveChat(chat)}
            >
              <img src={chat.users?.avatar_url} alt="" className="conv-avatar" />
              <div className="conv-info">
                <h3>@{chat.users?.username}</h3>
                <p>Tap to view chat</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
