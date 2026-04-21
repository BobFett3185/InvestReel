-- ==========================================
-- REALINVEST: Messaging Schema Update
-- ==========================================

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id
    ON public.conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id
    ON public.conversation_participants(conversation_id);
