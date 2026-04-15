import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function RegisterSuccessPage() {
  return (
    <div className="text-center space-y-4">
      <div className="text-5xl">📬</div>
      <h2 className="text-xl font-semibold text-zinc-800">驗證信已寄出！</h2>
      <p className="text-sm text-zinc-500 leading-relaxed">
        請到信箱點擊驗證連結，
        <br />
        完成驗證後即可登入。
      </p>
      <div className="pt-2">
        <Link href="/login">
          <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium h-10 px-6">
            前往登入
          </Button>
        </Link>
      </div>
    </div>
  )
}
