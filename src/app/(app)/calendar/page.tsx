import { createClient } from '@/lib/supabase/server'
import { getMyCouple } from '@/lib/actions/couple'
import { getCalendarEvents } from '@/lib/actions/calendar'
import { CalendarClient } from './calendar-client'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const couple = await getMyCouple()
  if (!couple || !user) return null

  const events = await getCalendarEvents(couple.id)

  return <CalendarClient coupleId={couple.id} initialEvents={events} userId={user.id} />
}
