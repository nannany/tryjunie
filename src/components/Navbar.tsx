import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { LogIn, LogOut, Key } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      const { data } = await supabase.auth.getUser()
      setIsAuthenticated(!!data.user)
      setIsLoading(false)
    }

    // 初回レンダリング時に認証状態をチェック
    checkAuth()

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.href = '/login'
  }

  return (
    <nav className="border-b bg-background px-4 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">
          タスクマネージャー
        </Link>
        <div className="flex items-center gap-4">
          {isLoading ? (
            // ローディング中は何も表示しない、またはローディングインジケーターを表示
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="flex items-center gap-1 mr-2">
                <Link to="/integration-keys">
                  <Key className="h-4 w-4" />
                  インテグレーションキー
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                ログアウト
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/login" className="flex items-center gap-1">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
