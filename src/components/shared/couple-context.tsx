'use client'

import { createContext, useContext } from 'react'
import type { CoupleWithProfiles, Profile } from '@/types/database'

interface CoupleContextValue {
  couple: CoupleWithProfiles
  me: Profile
  partner: Profile
}

const CoupleContext = createContext<CoupleContextValue | null>(null)

export function CoupleProvider({
  couple,
  userId,
  children,
}: {
  couple: CoupleWithProfiles
  userId: string
  children: React.ReactNode
}) {
  const me = couple.user1_id === userId ? couple.user1 : couple.user2
  const partner = couple.user1_id === userId ? couple.user2 : couple.user1

  return (
    <CoupleContext.Provider value={{ couple, me, partner }}>
      {children}
    </CoupleContext.Provider>
  )
}

export function useCouple() {
  const ctx = useContext(CoupleContext)
  if (!ctx) throw new Error('useCouple must be used inside CoupleProvider')
  return ctx
}
