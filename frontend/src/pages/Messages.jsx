import { useEffect, useRef, useState } from 'react'
import {
  fetchConversationMessages,
  fetchConversations,
  getOrCreateConversation,
  sendConversationMessage,
} from '../api'
import { supabase } from '../supabaseClient'
import './Messages.css'

export default function Messages({ session, chatTarget, onChatTargetHandled }) {
  const [conversations, setConversations] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (session?.user?.id) {
      loadConversations({ showSpinner: true })
    }
  }, [session])

  useEffect(() => {
    if (!session?.user?.id || !chatTarget?.id) return

    let cancelled = false

    const openConversation = async () => {
      try {
        const conversation = await getOrCreateConversation(session.user.id, chatTarget.id)
        if (cancelled) return

        const nextChat = {
          conversation_id: conversation.conversation_id,
          other_user: chatTarget,
        }

        setActiveChat(nextChat)
        await loadConversations({
          preferredConversationId: conversation.conversation_id,
          preferredChat: nextChat,
          showSpinner: false,
        })
      } catch (e) {
        console.error('Failed to open conversation:', e)
      } finally {
        onChatTargetHandled?.()
      }
    }

    openConversation()

    return () => {
      cancelled = true
    }
  }, [chatTarget, session])

  useEffect(() => {
    if (!activeChat?.conversation_id) return

    loadMessages(activeChat.conversation_id)

    const subscription = supabase
      .channel(`chat_${activeChat.conversation_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeChat.conversation_id}`,
        },
        () => {
          loadMessages(activeChat.conversation_id)
          loadConversations({
            preferredConversationId: activeChat.conversation_id,
            preferredChat: activeChat,
            showSpinner: false,
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [activeChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async ({
    preferredConversationId = null,
    preferredChat = null,
    showSpinner = false,
  } = {}) => {
    if (showSpinner) {
      setLoading(true)
    }
    try {
      const data = await fetchConversations(session.user.id)
      setConversations(data)

      if (preferredConversationId) {
        const matched = data.find((chat) => chat.conversation_id === preferredConversationId)
        if (matched) {
          setActiveChat(matched)
        } else if (preferredChat) {
          setActiveChat(preferredChat)
        }
      }
    } catch (e) {
      console.error('Error loading conversations:', e)
    } finally {
      if (showSpinner) {
        setLoading(false)
      }
    }
  }

  const loadMessages = async (conversationId) => {
    try {
      const data = await fetchConversationMessages(conversationId)
      setMessages(data || [])
    } catch (e) {
      console.error('Error loading messages:', e)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const content = inputText.trim()
    if (!content || !activeChat?.conversation_id || sending) return

    setSending(true)
    try {
      await sendConversationMessage(activeChat.conversation_id, session.user.id, content)
      setInputText('')
      await loadMessages(activeChat.conversation_id)
      await loadConversations({
        preferredConversationId: activeChat.conversation_id,
        preferredChat: activeChat,
        showSpinner: false,
      })
    } catch (e) {
      console.error('Failed to send message:', e)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="messages-loading"><div className="spinner" /></div>
  }

  if (activeChat) {
    const otherUser = activeChat.other_user

    return (
      <div className="chat-view">
        <div className="chat-header glass-card">
          <button className="back-btn" onClick={() => setActiveChat(null)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <img src={otherUser?.avatar_url} alt="" className="chat-avatar" />
          <span className="chat-username">@{otherUser?.username}</span>
        </div>

        <div className="chat-messages-area">
          {messages.map((msg) => {
            const isMe = msg.sender_id === session.user.id
            return (
              <div key={msg.id} className={`message-bubble-wrapper ${isMe ? 'me' : 'them'}`}>
                <div className={`message-bubble ${isMe ? 'my-message' : 'their-message'}`}>
                  {msg.reel && (
                    <div className="shared-reel-preview">
                      <div className="reel-preview-header">
                        <span className="icon">🎬</span> Shared a Reel
                      </div>
                      <video src={msg.reel.video_url} className="mini-reel-video" muted playsInline />
                      <p className="mini-reel-caption">{msg.reel.caption}</p>
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
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" disabled={!inputText.trim() || sending}>
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="conversations-view">
      <div className="messages-header">
        <h1>Messages</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="no-conversations">
          No conversations yet. Start one from the Friends tab.
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map((chat) => (
            <div
              key={chat.conversation_id}
              className="conversation-item"
              onClick={() => setActiveChat(chat)}
            >
              <img src={chat.other_user?.avatar_url} alt="" className="conv-avatar" />
              <div className="conv-info">
                <h3>@{chat.other_user?.username}</h3>
                <p>{chat.last_message?.content || (chat.last_message?.reel_id ? 'Shared a reel' : 'Tap to view chat')}</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
