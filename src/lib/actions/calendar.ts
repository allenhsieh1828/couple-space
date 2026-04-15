'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getCalendarEvents(coupleId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('couple_id', coupleId)
    .order('start_at', { ascending: true })
  return data ?? []
}

export async function addCalendarEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const coupleId = formData.get('coupleId') as string
  const title = (formData.get('title') as string)?.trim()
  const startAt = formData.get('startAt') as string
  const endAt = (formData.get('endAt') as string) || null
  const isAllDay = formData.get('isAllDay') === 'true'
  const isAnniversary = formData.get('isAnniversary') === 'true'
  const color = (formData.get('color') as string) || '#f43f5e'
  const description = (formData.get('description') as string)?.trim() || null

  if (!title) return { error: '請輸入標題' }
  if (!startAt) return { error: '請選擇日期' }

  const { error } = await supabase.from('calendar_events').insert({
    couple_id: coupleId,
    created_by: user.id,
    title,
    description,
    start_at: startAt,
    end_at: endAt,
    is_all_day: isAllDay,
    is_anniversary: isAnniversary,
    color,
  })

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { success: true }
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { success: true }
}
