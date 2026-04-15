-- ============================================================
-- Couple Space — Supabase (PostgreSQL) Schema
-- Generated: 2026-04-15
-- ============================================================

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES
--    Mirrors auth.users; one row per authenticated user.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text        NOT NULL DEFAULT '',
    avatar_url   text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner can select"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles: owner can insert"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: owner can update"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: owner can delete"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- NOTE: "profiles: partner can select" policy is added AFTER couples table is created below.


-- ============================================================
-- 2. COUPLES
--    Represents the pairing between two users.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.couples (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at  date        NOT NULL,                  -- 交往日期
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT couples_different_users CHECK (user1_id <> user2_id),
    CONSTRAINT couples_unique_pair     UNIQUE (user1_id, user2_id)
);

CREATE TRIGGER trg_couples_updated_at
    BEFORE UPDATE ON public.couples
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_couples_user1  ON public.couples(user1_id);
CREATE INDEX IF NOT EXISTS idx_couples_user2  ON public.couples(user2_id);

-- Helper: check whether the calling user belongs to a given couple
CREATE OR REPLACE FUNCTION public.is_couple_member(p_couple_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.couples
        WHERE id = p_couple_id
          AND (user1_id = auth.uid() OR user2_id = auth.uid())
    );
$$;

-- RLS
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couples: members can select"
    ON public.couples FOR SELECT
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "couples: member can insert"
    ON public.couples FOR INSERT
    WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "couples: members can update"
    ON public.couples FOR UPDATE
    USING (user1_id = auth.uid() OR user2_id = auth.uid())
    WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "couples: members can delete"
    ON public.couples FOR DELETE
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Now safe to add cross-table policy on profiles
CREATE POLICY "profiles: partner can select"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.couples c
            WHERE (c.user1_id = auth.uid() AND c.user2_id = profiles.id)
               OR (c.user2_id = auth.uid() AND c.user1_id = profiles.id)
        )
    );


-- ============================================================
-- 3. CALENDAR_EVENTS
--    Shared calendar for a couple.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id   uuid        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    created_by  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    title       text        NOT NULL,
    description text,
    start_at    timestamptz NOT NULL,
    end_at      timestamptz,
    is_all_day  boolean     NOT NULL DEFAULT false,
    color       text,                                  -- hex colour string
    is_anniversary boolean  NOT NULL DEFAULT false,    -- 標記為紀念日
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_calendar_events_updated_at
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_couple  ON public.calendar_events(couple_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start   ON public.calendar_events(start_at);

-- RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events: couple members can select"
    ON public.calendar_events FOR SELECT
    USING (public.is_couple_member(couple_id));

CREATE POLICY "calendar_events: couple members can insert"
    ON public.calendar_events FOR INSERT
    WITH CHECK (public.is_couple_member(couple_id) AND created_by = auth.uid());

CREATE POLICY "calendar_events: couple members can update"
    ON public.calendar_events FOR UPDATE
    USING (public.is_couple_member(couple_id))
    WITH CHECK (public.is_couple_member(couple_id));

CREATE POLICY "calendar_events: couple members can delete"
    ON public.calendar_events FOR DELETE
    USING (public.is_couple_member(couple_id));


-- ============================================================
-- 4. BUDGET_FUNDS
--    One fund per couple (current balance).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budget_funds (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id   uuid        NOT NULL UNIQUE REFERENCES public.couples(id) ON DELETE CASCADE,
    balance     numeric(12, 2) NOT NULL DEFAULT 0.00,
    currency    char(3)     NOT NULL DEFAULT 'TWD',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_budget_funds_updated_at
    BEFORE UPDATE ON public.budget_funds
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_funds_couple ON public.budget_funds(couple_id);

-- RLS
ALTER TABLE public.budget_funds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_funds: couple members can select"
    ON public.budget_funds FOR SELECT
    USING (public.is_couple_member(couple_id));

CREATE POLICY "budget_funds: couple members can insert"
    ON public.budget_funds FOR INSERT
    WITH CHECK (public.is_couple_member(couple_id));

CREATE POLICY "budget_funds: couple members can update"
    ON public.budget_funds FOR UPDATE
    USING (public.is_couple_member(couple_id))
    WITH CHECK (public.is_couple_member(couple_id));

CREATE POLICY "budget_funds: couple members can delete"
    ON public.budget_funds FOR DELETE
    USING (public.is_couple_member(couple_id));


-- ============================================================
-- 5. BUDGET_TRANSACTIONS
--    Income / expense entries linked to a couple's fund.
-- ============================================================
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');

CREATE TABLE IF NOT EXISTS public.budget_transactions (
    id              uuid                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id       uuid                    NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    created_by      uuid                    NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    type            public.transaction_type NOT NULL,
    amount          numeric(12, 2)          NOT NULL CHECK (amount > 0),
    category        text,
    note            text,
    transacted_at   timestamptz             NOT NULL DEFAULT now(),
    created_at      timestamptz             NOT NULL DEFAULT now(),
    updated_at      timestamptz             NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_budget_transactions_updated_at
    BEFORE UPDATE ON public.budget_transactions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_tx_couple       ON public.budget_transactions(couple_id);
CREATE INDEX IF NOT EXISTS idx_budget_tx_transacted   ON public.budget_transactions(transacted_at);
CREATE INDEX IF NOT EXISTS idx_budget_tx_type         ON public.budget_transactions(type);

-- Trigger: maintain budget_funds.balance automatically
CREATE OR REPLACE FUNCTION public.apply_budget_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.budget_funds
        SET balance = balance + CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END
        WHERE couple_id = NEW.couple_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.budget_funds
        SET balance = balance - CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END
        WHERE couple_id = OLD.couple_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Reverse old, apply new
        UPDATE public.budget_funds
        SET balance = balance
            - CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END
            + CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END
        WHERE couple_id = NEW.couple_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_budget_tx_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.budget_transactions
    FOR EACH ROW EXECUTE FUNCTION public.apply_budget_transaction();

-- RLS
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_transactions: couple members can select"
    ON public.budget_transactions FOR SELECT
    USING (public.is_couple_member(couple_id));

CREATE POLICY "budget_transactions: couple members can insert"
    ON public.budget_transactions FOR INSERT
    WITH CHECK (public.is_couple_member(couple_id) AND created_by = auth.uid());

CREATE POLICY "budget_transactions: couple members can update"
    ON public.budget_transactions FOR UPDATE
    USING (public.is_couple_member(couple_id))
    WITH CHECK (public.is_couple_member(couple_id));

CREATE POLICY "budget_transactions: couple members can delete"
    ON public.budget_transactions FOR DELETE
    USING (public.is_couple_member(couple_id));


-- ============================================================
-- 6. TODOS
--    Personal or shared to-do items.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.todos (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id   uuid        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    created_by  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_to uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    title       text        NOT NULL,
    note        text,
    is_shared   boolean     NOT NULL DEFAULT false,  -- false = personal, true = shared
    is_done     boolean     NOT NULL DEFAULT false,
    due_at      timestamptz,
    done_at     timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_todos_updated_at
    BEFORE UPDATE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_todos_couple      ON public.todos(couple_id);
CREATE INDEX IF NOT EXISTS idx_todos_created_by  ON public.todos(created_by);
CREATE INDEX IF NOT EXISTS idx_todos_is_shared   ON public.todos(is_shared);
CREATE INDEX IF NOT EXISTS idx_todos_is_done     ON public.todos(is_done);

-- RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Shared todos: both partners can see
CREATE POLICY "todos: shared visible to couple"
    ON public.todos FOR SELECT
    USING (
        public.is_couple_member(couple_id)
        AND (is_shared = true OR created_by = auth.uid() OR assigned_to = auth.uid())
    );

CREATE POLICY "todos: couple members can insert"
    ON public.todos FOR INSERT
    WITH CHECK (public.is_couple_member(couple_id) AND created_by = auth.uid());

-- Only creator (or assignee for done-toggle) can update
CREATE POLICY "todos: creator or assignee can update"
    ON public.todos FOR UPDATE
    USING (
        public.is_couple_member(couple_id)
        AND (created_by = auth.uid() OR assigned_to = auth.uid() OR is_shared = true)
    )
    WITH CHECK (public.is_couple_member(couple_id));

CREATE POLICY "todos: creator can delete"
    ON public.todos FOR DELETE
    USING (created_by = auth.uid());


-- ============================================================
-- 7. MESSAGES
--    Real-time message board for a couple.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id   uuid        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    sender_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body        text        NOT NULL,
    media_url   text,                                  -- optional image / attachment
    is_deleted  boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_couple     ON public.messages(couple_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages: couple members can select"
    ON public.messages FOR SELECT
    USING (public.is_couple_member(couple_id));

CREATE POLICY "messages: couple members can insert"
    ON public.messages FOR INSERT
    WITH CHECK (public.is_couple_member(couple_id) AND sender_id = auth.uid());

-- Only sender can update (e.g. soft-delete own message)
CREATE POLICY "messages: sender can update"
    ON public.messages FOR UPDATE
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages: sender can delete"
    ON public.messages FOR DELETE
    USING (sender_id = auth.uid());


-- ============================================================
-- 8. POINT_REWARDS
--    Reward definitions (name, required points, description).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.point_rewards (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id       uuid        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    created_by      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name            text        NOT NULL,
    description     text,
    points_required int         NOT NULL CHECK (points_required > 0),
    is_active       boolean     NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_point_rewards_updated_at
    BEFORE UPDATE ON public.point_rewards
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_point_rewards_couple ON public.point_rewards(couple_id);

-- RLS
ALTER TABLE public.point_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "point_rewards: couple members can select"
    ON public.point_rewards FOR SELECT
    USING (public.is_couple_member(couple_id));

CREATE POLICY "point_rewards: couple members can insert"
    ON public.point_rewards FOR INSERT
    WITH CHECK (public.is_couple_member(couple_id) AND created_by = auth.uid());

CREATE POLICY "point_rewards: creator can update"
    ON public.point_rewards FOR UPDATE
    USING (public.is_couple_member(couple_id))
    WITH CHECK (public.is_couple_member(couple_id));

CREATE POLICY "point_rewards: creator can delete"
    ON public.point_rewards FOR DELETE
    USING (public.is_couple_member(couple_id) AND created_by = auth.uid());


-- ============================================================
-- 9. POINT_TRANSACTIONS
--    Point earn / redeem log per user within a couple.
-- ============================================================
CREATE TYPE public.point_change_type AS ENUM ('earn', 'redeem', 'adjust');

CREATE TABLE IF NOT EXISTS public.point_transactions (
    id          uuid                        PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id   uuid                        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    user_id     uuid                        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_id   uuid                        REFERENCES public.point_rewards(id) ON DELETE SET NULL,
    type        public.point_change_type    NOT NULL,
    delta       int                         NOT NULL,           -- positive = earn, negative = redeem/adjust
    note        text,
    created_at  timestamptz                 NOT NULL DEFAULT now(),
    updated_at  timestamptz                 NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_point_transactions_updated_at
    BEFORE UPDATE ON public.point_transactions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_point_tx_couple  ON public.point_transactions(couple_id);
CREATE INDEX IF NOT EXISTS idx_point_tx_user    ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_tx_type    ON public.point_transactions(type);

-- RLS
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "point_transactions: couple members can select"
    ON public.point_transactions FOR SELECT
    USING (public.is_couple_member(couple_id));

CREATE POLICY "point_transactions: couple members can insert"
    ON public.point_transactions FOR INSERT
    WITH CHECK (public.is_couple_member(couple_id));

CREATE POLICY "point_transactions: couple members can update"
    ON public.point_transactions FOR UPDATE
    USING (public.is_couple_member(couple_id))
    WITH CHECK (public.is_couple_member(couple_id));

CREATE POLICY "point_transactions: couple members can delete"
    ON public.point_transactions FOR DELETE
    USING (public.is_couple_member(couple_id));


-- ============================================================
-- CONVENIENCE VIEW: current point balance per user per couple
-- ============================================================
CREATE OR REPLACE VIEW public.point_balances AS
SELECT
    couple_id,
    user_id,
    SUM(delta) AS balance
FROM public.point_transactions
GROUP BY couple_id, user_id;


-- ============================================================
-- AUTO-CREATE profile on user sign-up
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- END OF SCHEMA
-- ============================================================
