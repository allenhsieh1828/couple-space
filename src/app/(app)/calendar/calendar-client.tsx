'use client'

import { useState } from 'react'
import { addCalendarEvent, deleteCalendarEvent } from '@/lib/actions/calendar'
import { Button } from '@/components/ui/button'
import type { CalendarEvent } from '@/types/database'

const EVENT_COLORS = [
  { label: '玫瑰紅', value: '#f43f5e' },
  { label: '紫色', value: '#a855f7' },
  { label: '藍色', value: '#3b82f6' },
  { label: '綠色', value: '#22c55e' },
  { label: '橘色', value: '#f97316' },
]

function groupByMonth(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {}
  for (const e of events) {
    const key = e.start_at.slice(0, 7) // YYYY-MM
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }
  return groups
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return `${y} 年 ${parseInt(m)} 月`
}

export function CalendarClient({
  coupleId,
  initialEvents,
  userId,
}: {
  coupleId: string
  initialEvents: CalendarEvent[]
  userId: string
}) {
  const [events, setEvents] = useState(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState('#f43f5e')

  async function handleAdd(formData: FormData) {
    formData.set('coupleId', coupleId)
    formData.set('color', selectedColor)
    setLoading(true)
    setError(null)
    const result = await addCalendarEvent(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setShowForm(false)
      // Refresh will happen via revalidatePath, but we'll also update local state
      window.location.reload()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除這個行程嗎？')) return
    await deleteCalendarEvent(id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const upcoming = events.filter((e) => new Date(e.start_at) >= new Date())
  const past = events.filter((e) => new Date(e.start_at) < new Date())
  const grouped = groupByMonth(upcoming.sort((a, b) => a.start_at.localeCompare(b.start_at)))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-800">行事曆</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg h-8 px-3 text-sm"
        >
          + 新增
        </Button>
      </div>

      {/* Add event form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-800">新增行程</h2>
            <form action={handleAdd} className="space-y-3">
              <input
                name="title"
                type="text"
                required
                placeholder="行程名稱"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />
              <input
                name="startAt"
                type="datetime-local"
                required
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />
              <input
                name="endAt"
                type="datetime-local"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
                placeholder="結束時間（選填）"
              />
              <textarea
                name="description"
                placeholder="備註（選填）"
                rows={2}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100 resize-none"
              />

              {/* Color picker */}
              <div className="flex gap-2 items-center">
                <span className="text-sm text-zinc-500">顏色：</span>
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${selectedColor === c.value ? 'border-zinc-700 scale-125' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input name="isAnniversary" type="checkbox" value="true" className="rounded" />
                標記為紀念日
              </label>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-9 border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 rounded-lg text-sm"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm"
                >
                  {loading ? '儲存中…' : '儲存'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl bg-white border border-rose-100 p-8 text-center">
          <p className="text-4xl mb-2">📅</p>
          <p className="text-zinc-400 text-sm">還沒有行程，新增一個吧！</p>
        </div>
      ) : (
        Object.entries(grouped).map(([month, monthEvents]) => (
          <div key={month} className="space-y-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
              {monthLabel(month)}
            </h2>
            {monthEvents.map((e) => (
              <EventCard key={e.id} event={e} userId={userId} onDelete={handleDelete} />
            ))}
          </div>
        ))
      )}

      {/* Past events */}
      {past.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-zinc-400 cursor-pointer select-none hover:text-zinc-600">
            過去的行程 ({past.length})
          </summary>
          <div className="mt-2 space-y-2 opacity-60">
            {past.slice().reverse().map((e) => (
              <EventCard key={e.id} event={e} userId={userId} onDelete={handleDelete} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function EventCard({
  event,
  userId,
  onDelete,
}: {
  event: CalendarEvent
  userId: string
  onDelete: (id: string) => void
}) {
  const start = new Date(event.start_at)
  const isOwn = event.created_by === userId

  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-4 flex items-center gap-3 shadow-sm">
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: event.color ?? '#f43f5e' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-800 truncate">{event.title}</p>
          {event.is_anniversary && <span className="text-xs">🎉</span>}
        </div>
        <p className="text-xs text-zinc-400">
          {start.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })}
          {!event.is_all_day && ` ${start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
        {event.description && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{event.description}</p>
        )}
      </div>
      {isOwn && (
        <button
          onClick={() => onDelete(event.id)}
          className="text-zinc-300 hover:text-red-400 text-xs px-1 flex-shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  )
}
