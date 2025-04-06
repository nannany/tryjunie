import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, AlertCircle, PlusCircle, PencilIcon, Save, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

const supabase = createClient()

// Task型の定義
interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  due_date: string | null
  estimated_minutes: number | null
}

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<{
    title: string;
    estimated_minutes: string;
  }>({
    title: '',
    estimated_minutes: '',
  })
  const { toast } = useToast()

  // タスクを取得
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true)
      const { data, error } = await supabase.from('tasks').select('*')
      
      if (error) {
        console.error('Error fetching tasks:', error)
      } else if (data) {
        setTasks(data as Task[])
      }
      
      setIsLoading(false)
    }
    
    fetchTasks()
  }, [])

  // Filter tasks based on status
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter)

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // 見積もり時間をフォーマット
  const formatEstimatedTime = (minutes: number | null) => {
    if (!minutes) return null;
    return `${minutes}m`;
  }

  // 編集モードの開始
  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id)
    setEditFormData({
      title: task.title,
      estimated_minutes: task.estimated_minutes ? task.estimated_minutes.toString() : '',
    })
  }

  // 編集フォームの入力処理
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 編集の保存
  const handleSave = async (taskId: string) => {
    // バリデーション
    if (!editFormData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    const { error } = await supabase
      .from('tasks')
      .update({
        title: editFormData.title,
        estimated_minutes: editFormData.estimated_minutes ? parseInt(editFormData.estimated_minutes) : null,
      })
      .eq('id', taskId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
      console.error('Error updating task:', error)
      return
    }

    // 成功メッセージ
    toast({
      title: "Success",
      description: "Task updated successfully",
    })

    // タスク一覧を再読み込み
    const { data } = await supabase.from('tasks').select('*')
    if (data) {
      setTasks(data as Task[])
    }

    // 編集モードを終了
    setEditingTaskId(null)
  }

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditingTaskId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks</p>
        </div>
        <Button asChild>
          <Link to="/tasks/create" className="flex items-center gap-1">
            <PlusCircle className="h-4 w-4" />
            New Task
          </Link>
        </Button>
      </div>

      <div className="flex space-x-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button 
          variant={filter === 'pending' ? 'default' : 'outline'} 
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button 
          variant={filter === 'in_progress' ? 'default' : 'outline'} 
          onClick={() => setFilter('in_progress')}
        >
          In Progress
        </Button>
        <Button 
          variant={filter === 'completed' ? 'default' : 'outline'} 
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
          <CardDescription>
            {filter === 'all' ? 'All tasks' : `${filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')} tasks`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading tasks...</p>
          ) : (
            <div className="space-y-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div className="flex items-center gap-4 flex-grow">
                      {getStatusIcon(task.status)}
                      <div className="flex-grow">
                        {editingTaskId === task.id ? (
                          // 編集モード
                          <div className="space-y-2">
                            <Input
                              name="title"
                              value={editFormData.title}
                              onChange={handleEditChange}
                              className="font-medium"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Est:</span>
                              <Input
                                name="estimated_minutes"
                                type="number"
                                min="0"
                                placeholder="Minutes"
                                value={editFormData.estimated_minutes}
                                onChange={handleEditChange}
                                className="w-24 h-7 text-sm"
                              />
                              <span className="text-sm text-muted-foreground">minutes</span>
                            </div>
                          </div>
                        ) : (
                          // 表示モード
                          <>
                            <p className="font-medium">{task.title}</p>
                            <div className="flex gap-3 text-sm text-muted-foreground">
                              <p>Due: {formatDate(task.due_date)}</p>
                              {task.estimated_minutes && 
                                <p>• Est: {formatEstimatedTime(task.estimated_minutes)}</p>}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {editingTaskId === task.id ? (
                        // 編集モードのボタン
                        <>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            onClick={() => handleSave(task.id)}
                            className="h-8 w-8"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            onClick={handleCancelEdit}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        // 表示モードのボタン
                        <>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            onClick={() => handleEdit(task)}
                            className="h-8 w-8"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/tasks/${task.id}`}>View</Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No tasks found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TaskList
