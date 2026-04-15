import { createClient } from '@/lib/supabase/server'
import { getMyCouple } from '@/lib/actions/couple'
import { getPointRewards, getPointTransactions, getPointBalances } from '@/lib/actions/points'
import { PointsClient } from './points-client'

export default async function PointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const couple = await getMyCouple()
  if (!couple || !user) return null

  const [rewards, transactions, balances] = await Promise.all([
    getPointRewards(couple.id),
    getPointTransactions(couple.id),
    getPointBalances(couple.id),
  ])

  const me = couple.user1_id === user.id ? couple.user1 : couple.user2
  const partner = couple.user1_id === user.id ? couple.user2 : couple.user1

  return (
    <PointsClient
      coupleId={couple.id}
      userId={user.id}
      me={me}
      partner={partner}
      initialRewards={rewards}
      initialTransactions={transactions}
      initialBalances={balances}
    />
  )
}
