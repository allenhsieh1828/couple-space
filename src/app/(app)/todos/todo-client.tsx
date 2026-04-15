'use client'

import { useState } from 'react'
import { addTodo, toggleTodo, deleteTodo } from '@/lib/actions/todos'
import { Button } from '@/components/ui/button'
import type { Todo } from '@/types/database'

export function TodoClient({
  coupleId,
  userId,
  initialTodos,
}: {
  coupleId: string
  userId: string
  initialTodos: Todo[]
}) {
  const [todos, setTodos] = useState(initialTodos)
  const [tab, setTab] = useState<'shared' | 'mine'>('shared')
  const [showForm, setShowForm] = useState(false)
  const [isShared, setIsShared] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sharedTodos = todos.filter((t) => t.is_shared)
  const myTodos = todos.filter((t) => !t.is_shared && t.created_by === userId)
  const displayed = tab === 'shared' ? sharedTodos : myTodos

  async function handleAdd(formData: FormData) {
    formData.set('coupleId', coupleId)
    formData.set('isShared', isShared ? 'true' : 'false')
    setLoading(true)
    setError(null)
    const result = await addTodo(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setShowForm(false)
      window.location.reload()
    }
    setLoading(false)
  }

  async function handleToggle(id: string, current: boolean) {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, is_done: !current } : t))
    await toggleTodo(id, !current)
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除嗎？')) return
    await deleteTodo(id)
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const done = displayed.filter((t) => t.is_done)
  const undone = displayed.filter((t) => !t.is_done)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-800">待辦事項</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg h-8 px-3 text-sm"
        >
          + 新增
        </Button>
      </div>

      {/* Tab */}
      <div className="flex rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
        <button
          onClick={() => setTab('shared')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'shared' ? 'bg-rose-500 text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          共同 ({sharedTodos.filter((t) => !t.is_done).length})
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'mine' ? 'bg-rose-500 text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          我的 ({myTodos.filter((t) => !t.is_done).length})
        </button>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-800">新增待辦</h2>

            <div className="flex rounded-lg overflow-hidden border border-zinc-200">
              <button
                type="button"
                onClick={() => setIsShared(true)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${isShared ? 'bg-rose-500 text-white' : 'bg-white text-zinc-500'}`}
              >
                共同
              </button>
              <button
                type="button"
                onClick={() => setIsShared(false)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${!isShared ? 'bg-rose-500 text-white' : 'bg-white text-zinc-500'}`}
              >
                個人
              </button>
            </div>

            <form action={handleAdd} className="space-y-3">
              <input
                name="title"
                type="text"
                required
                placeholder="待辦事項"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />
              <input
                name="dueAt"
                type="date"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />
              <input
                name="note"
                type="text"
                placeholder="備註（選填）"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => { setShowForm(false); setError(null) }}
                  className="flex-1 h-9 border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 rounded-lg text-sm"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm"
                >
                  {loading ? '新增中…' : '新增'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Todo list */}
      {displayed.length === 0 ? (
        <div className="rounded-2xl bg-white border border-rose-100 p-8 text-center">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-zinc-400 text-sm">沒有待辦事項！</p>
        </div>
      ) : (
        <div className="space-y-2">
          {undone.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              userId={userId}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
          {done.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-600 select-none">
                已完成 ({done.length})
              </summary>
              <div className="mt-2 space-y-2 opacity-50">
                {done.map((t) => (
                  <TodoItem
                    key={t.id}
                    todo={t}
                    userId={userId}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function TodoItem({
  todo,
  userId,
  onToggle,
  onDelete,
}: {
  todo: Todo
  userId: string
  onToggle: (id: string, current: boolean) => void
  onDelete: (id: string) => void
}) {
  const isOverdue = todo.due_at && !todo.is_done && new Date(todo.due_at) < new Date()

  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-4 flex items-center gap-3 shadow-sm">
      <button
        onClick={() => onToggle(todo.id, todo.is_done)}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          todo.is_done
            ? 'bg-rose-500 border-rose-500'
            : 'border-zinc-300 hover:border-rose-400'
        }`}
      >
        {todo.is_done && <span className="text-white text-xs">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${todo.is_done ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>
          {todo.title}
        </p>
        {(todo.due_at || todo.note) && (
          <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500' : 'text-zinc-400'}`}>
            {todo.due_at && `截止：${new Date(todo.due_at).toLocaleDateString('zh-TW')}`}
            {todo.note && (todo.due_at ? ` · ${todo.note}` : todo.note)}
          </p>
        )}
      </div>
      {(todo.created_by === userId || todo.is_shared) && (
        <button
          onClick={() => onDelete(todo.id)}
          className="text-zinc-300 hover:text-red-400 text-xs px-1 flex-shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  )
}
