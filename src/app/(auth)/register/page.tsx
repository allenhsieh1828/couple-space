'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    const password = formData.get('password') as string
    const confirm = formData.get('confirmPassword') as string

    if (password !== confirm) {
      setError('兩次輸入的密碼不一致')
      return
    }
    if (password.length < 6) {
      setError('密碼至少需要 6 個字元')
      return
    }

    setLoading(true)
    setError(null)
    const result = await register(formData)
    if (result?.error) {
      setError(translateError(result.error))
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-zinc-800 mb-6 text-center">建立帳號</h2>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-zinc-600 mb-1.5">
            你的名字
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            autoComplete="name"
            placeholder="例如：Allen"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none transition focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
          />
        </div>

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
            autoComplete="new-password"
            placeholder="至少 6 個字元"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none transition focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-600 mb-1.5">
            確認密碼
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="再輸入一次密碼"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none transition focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
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
          className="w-full h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? '建立中…' : '建立帳號'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        已有帳號？{' '}
        <Link href="/login" className="text-rose-500 font-medium hover:underline">
          返回登入
        </Link>
      </p>
    </>
  )
}

function translateError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already been registered')) return '此電子郵件已被註冊'
  if (msg.includes('Password should be')) return '密碼太弱，請使用更複雜的密碼'
  if (msg.includes('invalid email')) return '請輸入有效的電子郵件'
  return msg
}
