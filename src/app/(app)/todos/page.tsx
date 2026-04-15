import { createClient } from '@/lib/supabase/server'
import { getMyCouple } from '@/lib/actions/couple'
import { getTodos } from '@/lib/actions/todos'
import { TodoClient } from './todo-client'

export default async function TodosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const couple = await getMyCouple()
  if (!couple || !user) return null

  const todos = await getTodos(couple.id)

  return <TodoClient coupleId={couple.id} userId={user.id} initialTodos={todos} />
}
