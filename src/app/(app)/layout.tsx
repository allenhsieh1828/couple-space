import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyCouple } from '@/lib/actions/couple'
import { Navbar } from '@/components/shared/navbar'
import { CoupleProvider } from '@/components/shared/couple-context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const couple = await getMyCouple()
  if (!couple) redirect('/pair')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <CoupleProvider couple={couple} userId={user.id}>
      <div className="min-h-screen bg-gradient-to-br from-rose-50/40 via-white to-pink-50/40">
        <Navbar displayName={profile?.display_name ?? ''} />
        <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
          {children}
        </main>
      </div>
    </CoupleProvider>
  )
}
