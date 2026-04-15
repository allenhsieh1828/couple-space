'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { pairWithCode, getMyInviteCode } from '@/lib/actions/couple'
import { Button } from '@/components/ui/button'

export default function PairPage() {
  const router = useRouter()
  const [myCode, setMyCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getMyInviteCode().then(setMyCode)
  }, [])

  function copyCode() {
    if (!myCode) return
    navigator.clipboard.writeText(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await pairWithCode(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">💑</div>
          <h1 className="text-2xl font-bold text-rose-500">配對</h1>
          <p className="text-sm text-zinc-400 mt-1">邀請你的另一半，一起建立你們的小天地</p>
        </div>

        {/* My invite code */}
        <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-500 mb-3">我的邀請碼</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-rose-50 rounded-lg py-3 text-center">
              <span className="text-3xl font-mono font-bold text-rose-500 tracking-widest">
                {myCode ?? '------'}
              </span>
            </div>
            <Button
              type="button"
              onClick={copyCode}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg h-12 px-4 text-sm"
            >
              {copied ? '已複製！' : '複製'}
            </Button>
          </div>
          <p className="text-xs text-zinc-400 mt-2">把這個碼分享給你的另一半</p>
        </div>

        {/* Enter partner code */}
        <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-500 mb-4">輸入另一半的邀請碼</h2>
          <form action={handleSubmit} className="space-y-4">
            <div>
              <input
                name="code"
                type="text"
                required
                maxLength={6}
                placeholder="6 位邀請碼"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none transition focus:border-rose-300 focus:ring-3 focus:ring-rose-100 font-mono uppercase tracking-widest text-center text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">
                交往日期
              </label>
              <input
                name="startedAt"
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium"
            >
              {loading ? '配對中…' : '確認配對 💕'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
