import { createClient } from '@/lib/supabase/server'
import { getMyCouple } from '@/lib/actions/couple'
import { getMessages } from '@/lib/actions/messages'
import { BoardClient } from './board-client'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const couple = await getMyCouple()
  if (!couple || !user) return null

  const messages = await getMessages(couple.id)

  return (
    <BoardClient
      coupleId={couple.id}
      userId={user.id}
      initialMessages={messages}
    />
  )
}
