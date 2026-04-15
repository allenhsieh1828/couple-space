'use client'

import { useState } from 'react'
import { addTransaction, deleteTransaction } from '@/lib/actions/budget'
import { Button } from '@/components/ui/button'
import type { BudgetFund, BudgetTransaction } from '@/types/database'

const CATEGORIES = ['餐飲', '交通', '娛樂', '購物', '旅遊', '日常', '其他']

function formatTWD(amount: number) {
  return `NT$ ${amount.toLocaleString('zh-TW', { minimumFractionDigits: 0 })}`
}

export function BudgetClient({
  coupleId,
  userId,
  initialFund,
  initialTransactions,
}: {
  coupleId: string
  userId: string
  initialFund: BudgetFund | null
  initialTransactions: BudgetTransaction[]
}) {
  const [fund] = useState(initialFund)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [showForm, setShowForm] = useState(false)
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(formData: FormData) {
    formData.set('coupleId', coupleId)
    formData.set('type', txType)
    setLoading(true)
    setError(null)
    const result = await addTransaction(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setShowForm(false)
      window.location.reload()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除這筆記錄嗎？')) return
    await deleteTransaction(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    window.location.reload()
  }

  const balance = fund?.balance ?? 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-800">共同帳本</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg h-8 px-3 text-sm"
        >
          + 新增
        </Button>
      </div>

      {/* Balance card */}
      <div
        className={`rounded-2xl p-6 text-white shadow-sm ${balance >= 0 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-rose-400 to-pink-500'}`}
      >
        <p className="text-sm opacity-80 mb-1">共同基金餘額</p>
        <p className="text-4xl font-bold">{formatTWD(balance)}</p>
        <p className="text-xs opacity-60 mt-2">TWD</p>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-800">新增記錄</h2>

            {/* Type toggle */}
            <div className="flex rounded-lg overflow-hidden border border-zinc-200">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${txType === 'expense' ? 'bg-rose-500 text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${txType === 'income' ? 'bg-emerald-500 text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
              >
                收入
              </button>
            </div>

            <form action={handleAdd} className="space-y-3">
              <input
                name="amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="金額"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />

              <select
                name="category"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              >
                <option value="">分類（選填）</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <input
                name="note"
                type="text"
                placeholder="備註（選填）"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />

              <input
                name="transactedAt"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
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
                  {loading ? '儲存中…' : '儲存'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-500">收支記錄</h2>
        {transactions.length === 0 ? (
          <div className="rounded-2xl bg-white border border-rose-100 p-8 text-center">
            <p className="text-4xl mb-2">💰</p>
            <p className="text-zinc-400 text-sm">還沒有記錄，新增第一筆吧！</p>
          </div>
        ) : (
          transactions.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-zinc-100 p-4 flex items-center gap-3 shadow-sm"
            >
              <span className="text-2xl">{t.type === 'income' ? '💚' : '🔴'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p
                    className={`text-base font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {t.type === 'income' ? '+' : '-'}{formatTWD(t.amount)}
                  </p>
                  {t.category && (
                    <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">
                      {t.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  {new Date(t.transacted_at).toLocaleDateString('zh-TW')}
                  {t.note && ` · ${t.note}`}
                </p>
              </div>
              {t.created_by === userId && (
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-zinc-300 hover:text-red-400 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
