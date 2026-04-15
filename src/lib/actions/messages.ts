'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getMessages(coupleId: string, limit = 100) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)')
    .eq('couple_id', coupleId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(limit)
  return data ?? []
}

export async function sendMessage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const coupleId = formData.get('coupleId') as string
  const body = (formData.get('body') as string)?.trim()

  if (!body) return { error: '訊息不能是空的' }

  const { error } = await supabase.from('messages').insert({
    couple_id: coupleId,
    sender_id: user.id,
    body,
  })

  if (error) return { error: error.message }
  revalidatePath('/board')
  return { success: true }
}

export async function deleteMessage(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/board')
  return { success: true }
}
