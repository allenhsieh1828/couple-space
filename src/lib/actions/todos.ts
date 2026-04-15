'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getTodos(coupleId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('todos')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function addTodo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const coupleId = formData.get('coupleId') as string
  const title = (formData.get('title') as string)?.trim()
  const isShared = formData.get('isShared') === 'true'
  const dueAt = (formData.get('dueAt') as string) || null
  const note = (formData.get('note') as string)?.trim() || null

  if (!title) return { error: '請輸入待辦事項' }

  const { error } = await supabase.from('todos').insert({
    couple_id: coupleId,
    created_by: user.id,
    title,
    is_shared: isShared,
    due_at: dueAt,
    note,
  })

  if (error) return { error: error.message }
  revalidatePath('/todos')
  return { success: true }
}

export async function toggleTodo(id: string, isDone: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('todos')
    .update({ is_done: isDone, done_at: isDone ? new Date().toISOString() : null })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/todos')
  return { success: true }
}

export async function deleteTodo(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/todos')
  return { success: true }
}
