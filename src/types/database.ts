// ============================================================
// Database Type Definitions for Couple Space
// Matches actual Supabase schema exactly
// ============================================================

// ------------------------------------------------------------
// profiles (id = auth.uid)
// ------------------------------------------------------------
export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  invite_code: string | null
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// couples
// ------------------------------------------------------------
export interface Couple {
  id: string
  user1_id: string
  user2_id: string
  started_at: string      // date string YYYY-MM-DD
  created_at: string
  updated_at: string
}

// With joined profiles
export interface CoupleWithProfiles extends Couple {
  user1: Profile
  user2: Profile
}

// ------------------------------------------------------------
// calendar_events
// ------------------------------------------------------------
export interface CalendarEvent {
  id: string
  couple_id: string
  created_by: string
  title: string
  description: string | null
  start_at: string
  end_at: string | null
  is_all_day: boolean
  color: string | null
  is_anniversary: boolean
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// budget_funds
// ------------------------------------------------------------
export interface BudgetFund {
  id: string
  couple_id: string
  balance: number
  currency: string
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// budget_transactions
// ------------------------------------------------------------
export type TransactionType = 'income' | 'expense'

export interface BudgetTransaction {
  id: string
  couple_id: string
  created_by: string
  type: TransactionType
  amount: number
  category: string | null
  note: string | null
  transacted_at: string
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// todos
// ------------------------------------------------------------
export interface Todo {
  id: string
  couple_id: string
  created_by: string
  assigned_to: string | null
  title: string
  note: string | null
  is_shared: boolean
  is_done: boolean
  due_at: string | null
  done_at: string | null
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// messages
// ------------------------------------------------------------
export interface Message {
  id: string
  couple_id: string
  sender_id: string
  body: string
  media_url: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

// With sender profile joined
export interface MessageWithSender extends Message {
  sender: Profile
}

// ------------------------------------------------------------
// point_rewards
// ------------------------------------------------------------
export interface PointReward {
  id: string
  couple_id: string
  created_by: string
  name: string
  description: string | null
  points_required: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// point_transactions
// ------------------------------------------------------------
export type PointChangeType = 'earn' | 'redeem' | 'adjust'

export interface PointTransaction {
  id: string
  couple_id: string
  user_id: string
  reward_id: string | null
  type: PointChangeType
  delta: number
  note: string | null
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// point_balances (view)
// ------------------------------------------------------------
export interface PointBalance {
  couple_id: string
  user_id: string
  balance: number
}
