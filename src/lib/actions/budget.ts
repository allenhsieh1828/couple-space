'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TransactionType } from '@/types/database'

export async function getBudgetFund(coupleId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('budget_funds')
    .select('*')
    .eq('couple_id', coupleId)
    .single()
  return data
}

export async function getBudgetTransactions(coupleId: string, limit = 50) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('budget_transactions')
    .select('*')
    .eq('couple_id', coupleId)
    .order('transacted_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function addTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const coupleId = formData.get('coupleId') as string
  const type = formData.get('type') as TransactionType
  const amount = parseFloat(formData.get('amount') as string)
  const category = (formData.get('category') as string)?.trim() || null
  const note = (formData.get('note') as string)?.trim() || null
  const transactedAt = (formData.get('transactedAt') as string) || new Date().toISOString()

  if (!amount || amount <= 0) return { error: '金額必須大於 0' }
  if (!type) return { error: '請選擇收入或支出' }

  const { error } = await supabase.from('budget_transactions').insert({
    couple_id: coupleId,
    created_by: user.id,
    type,
    amount,
    category,
    note,
    transacted_at: transactedAt,
  })

  if (error) return { error: error.message }
  revalidatePath('/budget')
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('budget_transactions').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/budget')
  return { success: true }
}
