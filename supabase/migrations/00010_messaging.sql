-- ============================================================================
-- MoveMate: Buyer ↔ seller messaging
-- ============================================================================
-- Tables: conversations, messages
--
-- A conversation is between the buyer (whoever clicked "Contact Seller") and
-- the owner of a user_listings row. One conversation per buyer per listing.
--
-- Participants reference auth.users (like contact_requests) rather than
-- profiles, since not every user is guaranteed a profiles row. Deleting a
-- user or a listing keeps the conversation so the other side keeps history.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Conversations
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID REFERENCES public.user_listings(id) ON DELETE SET NULL,
  buyer_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT conversations_buyer_not_seller CHECK (buyer_id <> seller_id),
  -- Buyer A + Listing X (and therefore Seller B) → exactly one conversation
  CONSTRAINT conversations_unique_buyer_listing UNIQUE (listing_id, buyer_id)
);

COMMENT ON TABLE public.conversations IS 'Buyer ↔ seller conversation about a user_listings row';
COMMENT ON COLUMN public.conversations.updated_at IS 'Bumped to the latest message time on every new message';

CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON public.conversations (buyer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations (seller_id, updated_at DESC);

-- ----------------------------------------------------------------------------
-- 2. Messages
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content          TEXT NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at          TIMESTAMPTZ
);

COMMENT ON TABLE public.messages IS 'Messages within a conversation; immutable for clients except read_at via mark_conversation_read()';
COMMENT ON COLUMN public.messages.read_at IS 'When the recipient opened the conversation; NULL = unread';

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages (conversation_id)
  WHERE read_at IS NULL;

-- ----------------------------------------------------------------------------
-- 3. Triggers
-- ----------------------------------------------------------------------------

-- Server owns timestamps and read state on insert, so clients can't backdate
-- a message or insert it pre-read.
CREATE OR REPLACE FUNCTION public.conversations_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.created_at := now();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_before_insert ON public.conversations;
CREATE TRIGGER conversations_before_insert
  BEFORE INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.conversations_before_insert();

CREATE OR REPLACE FUNCTION public.messages_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.created_at := now();
  NEW.read_at := NULL;
  NEW.content := btrim(NEW.content);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_before_insert ON public.messages;
CREATE TRIGGER messages_before_insert
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.messages_before_insert();

-- Bump the conversation so the inbox sorts by latest activity. SECURITY
-- DEFINER because clients have no UPDATE policy on conversations.
CREATE OR REPLACE FUNCTION public.messages_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_after_insert ON public.messages;
CREATE TRIGGER messages_after_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.messages_after_insert();

-- ============================================================================
-- 4. Row Level Security
-- ============================================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only signed-in users touch messaging, and only via SELECT/INSERT.
-- No UPDATE/DELETE grants: participants and messages can't be rewritten.
REVOKE ALL ON public.conversations FROM anon, authenticated;
REVOKE ALL ON public.messages FROM anon, authenticated;
GRANT SELECT, INSERT ON public.conversations TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;

-- --------------------------------------------------------------------------
-- 4.1 Conversations
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;
CREATE POLICY "Participants can view their conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (buyer_id, seller_id));

-- The buyer must be the caller, and the seller must be the listing's actual
-- owner — so nobody can start a conversation as someone else or attach an
-- arbitrary "seller" to a listing.
DROP POLICY IF EXISTS "Buyers can start a conversation about a listing" ON public.conversations;
CREATE POLICY "Buyers can start a conversation about a listing"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id = (SELECT auth.uid())
    AND listing_id IS NOT NULL
    AND seller_id IS NOT NULL
    -- user_listings.user_id is TEXT (loosened in 00007), so compare as text.
    AND seller_id::TEXT = (
      SELECT ul.user_id::TEXT
      FROM public.user_listings ul
      WHERE ul.id = conversations.listing_id
    )
  );

-- --------------------------------------------------------------------------
-- 4.2 Messages
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
CREATE POLICY "Participants can read messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (SELECT auth.uid()) IN (c.buyer_id, c.seller_id)
    )
  );

DROP POLICY IF EXISTS "Participants can send messages as themselves" ON public.messages;
CREATE POLICY "Participants can send messages as themselves"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (SELECT auth.uid()) IN (c.buyer_id, c.seller_id)
    )
  );

-- ============================================================================
-- 5. Functions (RPC)
-- ============================================================================

-- Marks every message the caller *received* in a conversation as read.
-- The only way read_at changes; messages are otherwise immutable.
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_count INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.messages m
  SET read_at = now()
  WHERE m.conversation_id = p_conversation_id
    AND m.read_at IS NULL
    AND m.sender_id IS DISTINCT FROM v_uid
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = p_conversation_id
        AND v_uid IN (c.buyer_id, c.seller_id)
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Inbox: the caller's conversations with the last message and unread count.
-- SECURITY INVOKER, so the RLS policies above still apply. Conversations the
-- seller hasn't received a message in yet are hidden from the seller.
CREATE OR REPLACE FUNCTION public.get_my_conversations()
RETURNS TABLE (
  id UUID,
  listing_id UUID,
  buyer_id UUID,
  seller_id UUID,
  created_at TIMESTAMPTZ,
  last_message_content TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_sender_id UUID,
  unread_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    c.id,
    c.listing_id,
    c.buyer_id,
    c.seller_id,
    c.created_at,
    lm.content,
    lm.created_at,
    lm.sender_id,
    (
      SELECT count(*)::INTEGER
      FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.read_at IS NULL
        AND m.sender_id IS DISTINCT FROM auth.uid()
    )
  FROM public.conversations c
  LEFT JOIN LATERAL (
    SELECT m.content, m.created_at, m.sender_id
    FROM public.messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE auth.uid() IN (c.buyer_id, c.seller_id)
    AND (lm.created_at IS NOT NULL OR c.buyer_id = auth.uid())
  ORDER BY coalesce(lm.created_at, c.created_at) DESC;
$$;

-- Total unread messages for the nav badge.
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT count(*)::INTEGER
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE auth.uid() IN (c.buyer_id, c.seller_id)
    AND m.read_at IS NULL
    AND m.sender_id IS DISTINCT FROM auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.mark_conversation_read(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_conversations() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_unread_message_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count() TO authenticated;

-- Trigger functions are not meant to be called directly.
REVOKE EXECUTE ON FUNCTION public.conversations_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.messages_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.messages_after_insert() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 6. Realtime
-- ============================================================================
-- Stream new messages. Realtime applies the SELECT policy above, so each
-- subscriber only receives messages from their own conversations.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
