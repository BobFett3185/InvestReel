-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    preferences JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 2. REELS TABLE
-- ==========================================
CREATE TABLE reels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    caption TEXT,
    like_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for fetching a user's reels quickly, sorted by newest
CREATE INDEX idx_reels_user_created ON reels(user_id, created_at DESC);

-- ==========================================
-- 3. LIKES TABLE
-- ==========================================
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    -- Prevent a user from liking the same reel multiple times
    UNIQUE(user_id, reel_id)
);

-- Index for getting all likes for a reel, or all reels a user liked
CREATE INDEX idx_likes_reel_id ON likes(reel_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- ==========================================
-- 4. FOLLOWS TABLE
-- ==========================================
CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    -- Prevent users from following themselves
    CONSTRAINT check_not_self_follow CHECK (follower_id != following_id)
);

-- Index to quickly find who a user is following, and who their followers are
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);

-- ==========================================
-- 5. CONVERSATIONS TABLE
-- ==========================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Note: In a real app, you typically also want a `conversation_participants` 
-- table to map which users are in which conversations. For example:
-- CREATE TABLE conversation_participants (
--     conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
--     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--     PRIMARY KEY (conversation_id, user_id)
-- );

-- ==========================================
-- 6. MESSAGES TABLE
-- ==========================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    reel_id UUID REFERENCES reels(id) ON DELETE SET NULL, -- Nullable, used if sharing a reel
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure a message has either text content or a shared reel (or both)
    CONSTRAINT check_message_content CHECK (content IS NOT NULL OR reel_id IS NOT NULL)
);

-- Index for fetching messages in a chat, sorted by time
CREATE INDEX idx_messages_conversation_time ON messages(conversation_id, created_at ASC);
-- Index to quickly find messages sent by a user
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- ==========================================
-- RLS (Row Level Security) - Optional setup
-- ==========================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
