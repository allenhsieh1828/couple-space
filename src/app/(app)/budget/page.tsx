import { createClient } from '@/lib/supabase/server'
import { getMyCouple } from '@/lib/actions/couple'
import { getBudgetFund, getBudgetTransactions } from '@/lib/actions/budget'
import { BudgetClient } from './budget-client'

export default async function BudgetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const couple = await getMyCouple()
  if (!couple || !user) return null

  const [fund, transactions] = await Promise.all([
    getBudgetFund(couple.id),
    getBudgetTransactions(couple.id),
  ])

  return (
    <BudgetClient
      coupleId={couple.id}
      userId={user.id}
      initialFund={fund}
      initialTransactions={transactions}
    />
  )
}
