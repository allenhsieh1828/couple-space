'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CoupleWithProfiles } from '@/types/database'

/** Get current user's couple (with both profiles joined) */
export async function getMyCouple(): Promise<CoupleWithProfiles | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('couples')
    .select(`
      *,
      user1:profiles!couples_user1_id_fkey(*),
      user2:profiles!couples_user2_id_fkey(*)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  return data as CoupleWithProfiles | null
}

/** Get my own profile */
export async function getMyProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

/** Create couple by entering partner's invite code */
export async function pairWithCode(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const code = (formData.get('code') as string)?.trim().toUpperCase()
  const startedAt = formData.get('startedAt') as string

  if (!code || code.length !== 6) return { error: '邀請碼必須是 6 位字元' }
  if (!startedAt) return { error: '請填寫交往日期' }

  // Find partner by invite code
  const { data: partner } = await supabase
    .from('profiles')
    .select('id')
    .eq('invite_code', code)
    .single()

  if (!partner) return { error: '找不到此邀請碼，請確認是否正確' }
  if (partner.id === user.id) return { error: '不能和自己配對 😂' }

  // Check if already paired
  const { data: existing } = await supabase
    .from('couples')
    .select('id')
    .or(`and(user1_id.eq.${user.id},user2_id.eq.${partner.id}),and(user1_id.eq.${partner.id},user2_id.eq.${user.id})`)
    .single()

  if (existing) return { error: '你們已經是情侶囉！' }

  // Create couple
  const { error: coupleError } = await supabase
    .from('couples')
    .insert({ user1_id: user.id, user2_id: partner.id, started_at: startedAt })

  if (coupleError) return { error: coupleError.message }

  // Create initial budget fund
  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .or(`and(user1_id.eq.${user.id},user2_id.eq.${partner.id}),and(user1_id.eq.${partner.id},user2_id.eq.${user.id})`)
    .single()

  if (couple) {
    await supabase.from('budget_funds').insert({ couple_id: couple.id })
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

/** Get my invite code */
export async function getMyInviteCode(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('invite_code')
    .eq('id', user.id)
    .single()

  return data?.invite_code ?? null
}
