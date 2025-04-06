import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, AlertCircle, PlusCircle, Trash2 } from 'lucide-react'
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

// 編集中のフィールドの型
interface EditingField {
  taskId: string;
  field: 'title' | 'estimated_minutes';
}

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [editingField, setEditingField] = useState<EditingField | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const { toast } = useToast()

  // タスクを取得
  useEffect(() => {
    fetchTasks()
  }, [])

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

  // 編集モードを開始
  const handleEditStart = (taskId: string, field: 'title' | 'estimated_minutes', value: string) => {
    setEditingField({ taskId, field })
    setEditValue(value)
  }

  // 編集内容の変更
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
  }

  // 編集内容を保存
  const handleEditSave = async () => {
    if (!editingField) return
    
    const { taskId, field } = editingField
    
    // バリデーション
    if (field === 'title' && !editValue.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    const updateData: any = {}
    if (field === 'title') {
      updateData.title = editValue
    } else if (field === 'estimated_minutes') {
      updateData.estimated_minutes = editValue ? parseInt(editValue) : null
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)

    if (error) {
      toast({
        title: "Error",
        description: `Failed to update ${field}`,
        variant: "destructive",
      })
      console.error('Error updating task:', error)
    } else {
      // ローカル状態で更新したタスクの値を更新
      setTasks(currentTasks => 
        currentTasks.map(task => 
          task.id === taskId ? { ...task, ...updateData } : task
        )
      )
    }

    // 編集モードを終了
    setEditingField(null)
  }

  // キーボードイベント処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditSave()
    } else if (e.key === 'Escape') {
      setEditingField(null)
    }
  }

  // タスクを削除
  const handleDelete = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
      console.error('Error deleting task:', error)
    } else {
      // ローカル状態から削除したタスクを除外
      setTasks(currentTasks => 
        currentTasks.filter(task => task.id !== taskId)
      )
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
        duration: 2000
      })
    }
  }

  // クイックタスク追加
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Task title is required",
        variant: "destructive",
      })
      return
    }

    setIsAddingTask(true)

    // ユーザー情報を取得
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      })
      setIsAddingTask(false)
      return
    }

    // 新しいタスクを作成
    const newTask = {
      title: newTaskTitle,
      description: '',
      status: 'pending',
      user_id: userId,
      estimated_minutes: null
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      })
      console.error('Error adding task:', error)
    } else {
      // 新しく追加されたタスクをリストの先頭に追加
      setTasks(currentTasks => [data[0] as Task, ...currentTasks])
      
      toast({
        title: "Success",
        description: "Task added successfully",
        duration: 2000
      })

      // 入力フィールドをリセット
      setNewTaskTitle('')
    }

    setIsAddingTask(false)
  }

  // キー入力イベントを処理
  const handleNewTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks</p>
        </div>
      </div>

      {/* クイックタスク追加フォーム */}
      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Enter a new task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleNewTaskKeyDown}
              disabled={isAddingTask}
              className="flex-1"
            />
            <Button 
              onClick={handleAddTask} 
              disabled={isAddingTask || !newTaskTitle.trim()}
            >
              {isAddingTask ? 'Adding...' : 'Quick Add'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
                        {/* タイトルフィールド */}
                        {editingField?.taskId === task.id && editingField?.field === 'title' ? (
                          <Input
                            value={editValue}
                            onChange={handleEditChange}
                            onBlur={handleEditSave}
                            onKeyDown={handleKeyDown}
                            className="font-medium mb-2"
                            autoFocus
                          />
                        ) : (
                          <p 
                            className="font-medium mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                            onClick={() => handleEditStart(task.id, 'title', task.title)}
                          >
                            {task.title}
                          </p>
                        )}
                        
                        <div className="flex gap-3 text-sm text-muted-foreground">
                          {/* due_dateの表示を削除 */}
                          
                          {/* 見積もり時間フィールド */}
                          {editingField?.taskId === task.id && editingField?.field === 'estimated_minutes' ? (
                            <div className="flex items-center">
                              <span>Est: </span>
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={handleEditChange}
                                onBlur={handleEditSave}
                                onKeyDown={handleKeyDown}
                                className="w-16 h-6 text-xs mx-1"
                                autoFocus
                              />
                              <span>m</span>
                            </div>
                          ) : (
                            <p 
                              className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                              onClick={() => 
                                handleEditStart(
                                  task.id, 
                                  'estimated_minutes', 
                                  task.estimated_minutes ? task.estimated_minutes.toString() : ''
                                )
                              }
                            >
                              Est: {formatEstimatedTime(task.estimated_minutes) || '0m (click to set)'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => handleDelete(task.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
