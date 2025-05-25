import React from 'react';
import { Navigate } from 'react-router-dom'
import { useSupabaseUser } from '@/lib/supabase/hooks/useSupabaseUser'

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useSupabaseUser()

  // 認証状態チェック中は何も表示しない
  if (isLoading) {
    return null
  }

  // 未認証の場合はログインページにリダイレクト
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 認証済みの場合は子コンポーネントを表示
  return <>{children}</>
}

export default RequireAuth 