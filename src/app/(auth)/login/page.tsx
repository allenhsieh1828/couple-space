'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-zinc-800 mb-6 text-center">歡迎回來</h2>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-600 mb-1.5">
            電子郵件
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none transition focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-600 mb-1.5">
            密碼
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none transition focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
            {translateError(error)}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? '登入中…' : '登入'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        還沒有帳號？{' '}
        <Link href="/register" className="text-rose-500 font-medium hover:underline">
          立即註冊
        </Link>
      </p>
    </>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return '電子郵件或密碼錯誤'
  if (msg.includes('Email not confirmed')) return '請先驗證您的電子郵件'
  if (msg.includes('Too many requests')) return '嘗試次數過多，請稍後再試'
  return msg
}
