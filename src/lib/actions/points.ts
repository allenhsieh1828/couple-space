'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PointChangeType } from '@/types/database'

export async function getPointRewards(coupleId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('point_rewards')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('is_active', true)
    .order('points_required', { ascending: true })
  return data ?? []
}

export async function getPointTransactions(coupleId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('point_transactions')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

export async function getPointBalances(coupleId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('point_balances')
    .select('*')
    .eq('couple_id', coupleId)
  return data ?? []
}

export async function addPointReward(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const coupleId = formData.get('coupleId') as string
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const pointsRequired = parseInt(formData.get('pointsRequired') as string, 10)

  if (!name) return { error: '請輸入獎勵名稱' }
  if (!pointsRequired || pointsRequired <= 0) return { error: '點數必須大於 0' }

  const { error } = await supabase.from('point_rewards').insert({
    couple_id: coupleId,
    created_by: user.id,
    name,
    description,
    points_required: pointsRequired,
  })

  if (error) return { error: error.message }
  revalidatePath('/points')
  return { success: true }
}

export async function earnPoints(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const coupleId = formData.get('coupleId') as string
  const targetUserId = (formData.get('targetUserId') as string) || user.id
  const delta = parseInt(formData.get('delta') as string, 10)
  const note = (formData.get('note') as string)?.trim() || null
  const type = (formData.get('type') as PointChangeType) || 'earn'

  if (!delta || delta === 0) return { error: '點數不能為 0' }

  const { error } = await supabase.from('point_transactions').insert({
    couple_id: coupleId,
    user_id: targetUserId,
    type,
    delta,
    note,
  })

  if (error) return { error: error.message }
  revalidatePath('/points')
  return { success: true }
}

export async function redeemReward(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const coupleId = formData.get('coupleId') as string
  const rewardId = formData.get('rewardId') as string
  const pointsRequired = parseInt(formData.get('pointsRequired') as string, 10)
  const rewardName = formData.get('rewardName') as string

  // Check current balance
  const { data: balanceRow } = await supabase
    .from('point_balances')
    .select('balance')
    .eq('couple_id', coupleId)
    .eq('user_id', user.id)
    .single()

  const currentBalance = balanceRow?.balance ?? 0
  if (currentBalance < pointsRequired) {
    return { error: `點數不足！目前 ${currentBalance} 點，需要 ${pointsRequired} 點` }
  }

  const { error } = await supabase.from('point_transactions').insert({
    couple_id: coupleId,
    user_id: user.id,
    reward_id: rewardId,
    type: 'redeem' as PointChangeType,
    delta: -pointsRequired,
    note: `兌換：${rewardName}`,
  })

  if (error) return { error: error.message }
  revalidatePath('/points')
  return { success: true }
}

export async function deletePointReward(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('point_rewards')
    .update({ is_active: false })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/points')
  return { success: true }
}
