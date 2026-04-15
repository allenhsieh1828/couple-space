import { createClient } from '@/lib/supabase/server'
import { getMyCouple } from '@/lib/actions/couple'
import { getCalendarEvents } from '@/lib/actions/calendar'
import { getTodos } from '@/lib/actions/todos'

function daysBetween(dateStr: string): number {
  const start = new Date(dateStr)
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function daysUntilNextAnniversary(dateStr: string): { days: number; date: Date } {
  const start = new Date(dateStr)
  const now = new Date()
  const thisYear = now.getFullYear()

  let next = new Date(thisYear, start.getMonth(), start.getDate())
  if (next <= now) next = new Date(thisYear + 1, start.getMonth(), start.getDate())

  now.setHours(0, 0, 0, 0)
  next.setHours(0, 0, 0, 0)
  const days = Math.round((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return { days, date: next }
}

function formatDate(date: Date) {
  return date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const couple = await getMyCouple()

  if (!couple || !user) return null

  const days = daysBetween(couple.started_at)
  const anniversary = daysUntilNextAnniversary(couple.started_at)

  const [events, todos] = await Promise.all([
    getCalendarEvents(couple.id),
    getTodos(couple.id),
  ])

  const me = couple.user1_id === user.id ? couple.user1 : couple.user2
  const partner = couple.user1_id === user.id ? couple.user2 : couple.user1

  // Upcoming events (next 30 days)
  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const upcomingEvents = events.filter((e) => {
    const d = new Date(e.start_at)
    return d >= now && d <= thirtyDaysLater
  })

  // Undone shared todos
  const sharedTodos = todos.filter((t) => t.is_shared && !t.is_done)

  return (
    <div className="space-y-5">
      {/* Days counter hero */}
      <div className="rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 p-6 text-white shadow-sm">
        <p className="text-sm opacity-80 mb-1">
          {me.display_name} & {partner.display_name}
        </p>
        <p className="text-6xl font-bold mb-1">{days}</p>
        <p className="text-lg opacity-90">天了 💕</p>
        <p className="text-xs opacity-60 mt-2">
          交往日期：{new Date(couple.started_at).toLocaleDateString('zh-TW')}
        </p>
      </div>

      {/* Anniversary countdown */}
      <div className="rounded-2xl bg-white border border-rose-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500 mb-3">紀念日倒數</h2>
        {anniversary.days === 0 ? (
          <p className="text-2xl font-bold text-rose-500">今天是紀念日！🎉</p>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-rose-500">{anniversary.days}</span>
            <span className="text-zinc-600">天後，{formatDate(anniversary.date)}</span>
          </div>
        )}
      </div>

      {/* Upcoming events */}
      <div className="rounded-2xl bg-white border border-rose-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500 mb-3">近期行程</h2>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-zinc-400">近 30 天沒有行程</p>
        ) : (
          <ul className="space-y-2">
            {upcomingEvents.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: e.color ?? '#f43f5e' }}
                />
                <span className="text-sm text-zinc-700 flex-1">{e.title}</span>
                <span className="text-xs text-zinc-400">
                  {new Date(e.start_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Shared todos */}
      <div className="rounded-2xl bg-white border border-rose-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500 mb-3">共同待辦</h2>
        {sharedTodos.length === 0 ? (
          <p className="text-sm text-zinc-400">沒有待辦事項 🎉</p>
        ) : (
          <ul className="space-y-2">
            {sharedTodos.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm text-zinc-700">
                <span className="text-base">□</span>
                <span>{t.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
