'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

const NAV_ITEMS = [
  { href: '/', label: '首頁', icon: '🏠' },
  { href: '/calendar', label: '行事曆', icon: '📅' },
  { href: '/budget', label: '帳本', icon: '💰' },
  { href: '/todos', label: '待辦', icon: '✅' },
  { href: '/board', label: '留言', icon: '💬' },
  { href: '/points', label: '集點', icon: '⭐' },
]

export function Navbar({ displayName }: { displayName: string }) {
  const pathname = usePathname()

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-rose-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-rose-500 font-bold text-lg">💑 Couple Space</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">{displayName}</span>
            <form action={logout}>
              <button
                type="submit"
                className="text-xs text-zinc-400 hover:text-rose-500 transition-colors"
              >
                登出
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Bottom nav (mobile-style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-rose-100">
        <div className="max-w-2xl mx-auto flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
                  isActive ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
