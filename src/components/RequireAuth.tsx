import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      setIsAuthenticated(!!data.user)
    }

    checkAuth()

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // 認証状態チェック中は何も表示しない
  if (isAuthenticated === null) {
    return null
  }

  // 未認証の場合はログインページにリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 認証済みの場合は子コンポーネントを表示
  return <>{children}</>
}

export default RequireAuth 