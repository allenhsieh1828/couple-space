'use client'

import { useState } from 'react'
import { addPointReward, earnPoints, redeemReward, deletePointReward } from '@/lib/actions/points'
import { Button } from '@/components/ui/button'
import type { PointReward, PointTransaction, PointBalance, Profile } from '@/types/database'

export function PointsClient({
  coupleId,
  userId,
  me,
  partner,
  initialRewards,
  initialTransactions,
  initialBalances,
}: {
  coupleId: string
  userId: string
  me: Profile
  partner: Profile
  initialRewards: PointReward[]
  initialTransactions: PointTransaction[]
  initialBalances: PointBalance[]
}) {
  const [rewards, setRewards] = useState(initialRewards)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [balances, setBalances] = useState(initialBalances)
  const [showEarnForm, setShowEarnForm] = useState(false)
  const [showRewardForm, setShowRewardForm] = useState(false)
  const [earnTarget, setEarnTarget] = useState<'me' | 'partner'>('me')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const myBalance = balances.find((b) => b.user_id === userId)?.balance ?? 0
  const partnerBalance = balances.find((b) => b.user_id === partner.id)?.balance ?? 0

  async function handleEarn(formData: FormData) {
    formData.set('coupleId', coupleId)
    formData.set('targetUserId', earnTarget === 'me' ? userId : partner.id)
    formData.set('type', 'earn')
    setLoading(true)
    setError(null)
    const result = await earnPoints(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setShowEarnForm(false)
      window.location.reload()
    }
    setLoading(false)
  }

  async function handleRedeem(reward: PointReward) {
    if (!confirm(`確定要兌換「${reward.name}」（${reward.points_required} 點）嗎？`)) return
    const fd = new FormData()
    fd.set('coupleId', coupleId)
    fd.set('rewardId', reward.id)
    fd.set('pointsRequired', reward.points_required.toString())
    fd.set('rewardName', reward.name)
    setLoading(true)
    const result = await redeemReward(fd)
    if (result.error) alert(result.error)
    else window.location.reload()
    setLoading(false)
  }

  async function handleAddReward(formData: FormData) {
    formData.set('coupleId', coupleId)
    setLoading(true)
    setError(null)
    const result = await addPointReward(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setShowRewardForm(false)
      window.location.reload()
    }
    setLoading(false)
  }

  async function handleDeleteReward(id: string) {
    if (!confirm('確定要刪除這個獎勵嗎？')) return
    await deletePointReward(id)
    setRewards((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-zinc-800">集點卡</h1>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 p-4 text-white shadow-sm">
          <p className="text-xs opacity-80 mb-1">{me.display_name}</p>
          <p className="text-3xl font-bold">{myBalance}</p>
          <p className="text-xs opacity-60">點</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-purple-400 to-fuchsia-500 p-4 text-white shadow-sm">
          <p className="text-xs opacity-80 mb-1">{partner.display_name}</p>
          <p className="text-3xl font-bold">{partnerBalance}</p>
          <p className="text-xs opacity-60">點</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowEarnForm(true)}
          className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg h-9 text-sm"
        >
          ⭐ 給點
        </Button>
        <Button
          onClick={() => setShowRewardForm(true)}
          className="flex-1 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg h-9 text-sm"
        >
          + 新增獎勵
        </Button>
      </div>

      {/* Earn points modal */}
      {showEarnForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-800">給點數</h2>

            <div className="flex rounded-lg overflow-hidden border border-zinc-200">
              <button
                type="button"
                onClick={() => setEarnTarget('me')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${earnTarget === 'me' ? 'bg-rose-500 text-white' : 'bg-white text-zinc-500'}`}
              >
                給我自己
              </button>
              <button
                type="button"
                onClick={() => setEarnTarget('partner')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${earnTarget === 'partner' ? 'bg-rose-500 text-white' : 'bg-white text-zinc-500'}`}
              >
                給{partner.display_name}
              </button>
            </div>

            <form action={handleEarn} className="space-y-3">
              <input
                name="delta"
                type="number"
                required
                min="1"
                placeholder="點數"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />
              <input
                name="note"
                type="text"
                placeholder="原因（選填）"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => { setShowEarnForm(false); setError(null) }}
                  className="flex-1 h-9 border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 rounded-lg text-sm"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm"
                >
                  確認
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add reward modal */}
      {showRewardForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-800">新增獎勵</h2>
            <form action={handleAddReward} className="space-y-3">
              <input
                name="name"
                type="text"
                required
                placeholder="獎勵名稱"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />
              <input
                name="pointsRequired"
                type="number"
                required
                min="1"
                placeholder="需要點數"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />
              <textarea
                name="description"
                placeholder="描述（選填）"
                rows={2}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100 resize-none"
              />

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => { setShowRewardForm(false); setError(null) }}
                  className="flex-1 h-9 border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 rounded-lg text-sm"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm"
                >
                  新增
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rewards list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-500">可兌換獎勵</h2>
        {rewards.length === 0 ? (
          <div className="rounded-2xl bg-white border border-rose-100 p-6 text-center">
            <p className="text-3xl mb-2">🎁</p>
            <p className="text-zinc-400 text-sm">還沒有獎勵，新增一個吧！</p>
          </div>
        ) : (
          rewards.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-zinc-100 p-4 flex items-center gap-3 shadow-sm">
              <span className="text-2xl">🎁</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800">{r.name}</p>
                {r.description && <p className="text-xs text-zinc-400 mt-0.5">{r.description}</p>}
                <p className="text-xs text-rose-500 font-semibold mt-1">{r.points_required} 點</p>
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  onClick={() => handleRedeem(r)}
                  disabled={loading || myBalance < r.points_required}
                  className="h-7 px-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-30 text-white rounded-lg text-xs"
                >
                  兌換
                </Button>
                <button
                  onClick={() => handleDeleteReward(r.id)}
                  className="text-zinc-300 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent transactions */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-500">最近記錄</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">還沒有記錄</p>
        ) : (
          transactions.slice(0, 20).map((t) => {
            const isMe = t.user_id === userId
            const name = isMe ? me.display_name : partner.display_name
            return (
              <div key={t.id} className="bg-white rounded-xl border border-zinc-100 p-3 flex items-center gap-3 shadow-sm">
                <span className="text-base">{t.type === 'earn' ? '⭐' : t.type === 'redeem' ? '🎁' : '🔧'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-700">
                    <span className="font-medium">{name}</span>
                    {t.type === 'earn' ? ' 獲得 ' : t.type === 'redeem' ? ' 兌換 ' : ' 調整 '}
                    <span className={`font-semibold ${t.delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.delta > 0 ? '+' : ''}{t.delta}
                    </span> 點
                  </p>
                  {t.note && <p className="text-xs text-zinc-400 truncate">{t.note}</p>}
                </div>
                <span className="text-xs text-zinc-300">
                  {new Date(t.created_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
