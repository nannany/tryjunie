import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Task型の定義
interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  due_date: string | null
}

// 統計情報の型
interface Stats {
  total: number
  completed: number
  inProgress: number
  pending: number
}

const initialStats: Stats = {
  total: 0,
  completed: 0,
  inProgress: 0,
  pending: 0
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Supabaseからタスクを取得
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true)
      
      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsLoading(false)
        return
      }
      
      // タスクを取得
      const { data: taskData, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching tasks:', error)
        setIsLoading(false)
        return
      }
      
      if (taskData) {
        setTasks(taskData as Task[])
        
        // 統計情報を計算
        const completed = taskData.filter(task => task.status === 'completed').length
        const inProgress = taskData.filter(task => task.status === 'in_progress').length
        const pending = taskData.filter(task => task.status === 'pending').length
        
        setStats({
          total: taskData.length,
          completed,
          inProgress,
          pending
        })
      }
      
      setIsLoading(false)
    }
    
    fetchTasks()
  }, [supabase])

  // 日付をフォーマット
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Due today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Due tomorrow'
    } else {
      // 日付が3日以内かチェック
      const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diff > 0 && diff <= 3) {
        return `Due in ${diff} days`
      } else {
        return `Due on ${date.toLocaleDateString()}`
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your tasks</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <div className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Tasks being worked on</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Tasks not started</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your most recent tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground">Loading tasks...</p>
              ) : tasks.length > 0 ? (
                <>
                  {tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center justify-between rounded-md border p-4">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(task.due_date)}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/tasks/${task.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-center text-muted-foreground">No tasks found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
