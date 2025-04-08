import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

const supabase = createClient()

// Task型の定義
interface Task {
  id: string
  title: string
  description: string
  estimated_minute: number | null
  start_time: string | null
  end_time: string | null
  created_at: string
  task_date: string
}

// 編集中のフィールドの型
interface EditingField {
  taskId: string;
  field: 'title' | 'estimated_minute' | 'start_time' | 'end_time';
}

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingField, setEditingField] = useState<EditingField | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { toast } = useToast()

  // タスクを取得
  useEffect(() => {
    if (selectedDate) {
      fetchTasks(selectedDate)
    }
  }, [selectedDate])

  const fetchTasks = async (date: Date) => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('task_date', convertDateStringToDate(date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }).split(' ')[0]))
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching tasks:', error)
    } else if (data) {
      setTasks(data as Task[])
    }
    
    setIsLoading(false)
  }

  // 見積もり時間をフォーマット
  const formatEstimatedTime = (minutes: number | null) => {
    if (!minutes) return null;
    return `${minutes}m`;
  }
  
  // 2025/4/4 のような文字列をpostgresのdate型として扱える文字列(2025-04-04)に変換
  const convertDateStringToDate = (dateString: string) => {
    const [year, month, day] = dateString.split('/')
    const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return formatted
  }

  // 日時をフォーマット
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 編集モードを開始
  const handleEditStart = (taskId: string, field: 'title' | 'estimated_minute' | 'start_time' | 'end_time', value: string) => {
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
    } else if (field === 'estimated_minute') {
      updateData.estimated_minute = editValue ? parseInt(editValue) : null
    } else if (field === 'start_time' || field === 'end_time') {
      updateData[field] = editValue ? new Date(editValue).toISOString() : null
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

    if (!selectedDate) {
      toast({
        title: "Validation Error",
        description: "Please select a date",
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
      user_id: userId,
      estimated_minute: null,
      task_date: selectedDate.toISOString().split('T')[0]
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
        <div className="text-right">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: ja })
                ) : (
                  <span>日付を選択</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={ja}
              />
            </PopoverContent>
          </Popover>
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

      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading tasks...</p>
          ) : (
            <div className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div className="flex items-center gap-4 flex-grow">
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
                          {/* 見積もり時間フィールド */}
                          {editingField?.taskId === task.id && editingField?.field === 'estimated_minute' ? (
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
                                  'estimated_minute', 
                                  task.estimated_minute ? task.estimated_minute.toString() : ''
                                )
                              }
                            >
                              Est: {formatEstimatedTime(task.estimated_minute) || '0m (click to set)'}
                            </p>
                          )}

                          {/* 開始時間フィールド */}
                          {editingField?.taskId === task.id && editingField?.field === 'start_time' ? (
                            <div className="flex items-center">
                              <span>Start: </span>
                              <Input
                                type="time"
                                value={editValue ? new Date(editValue).toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''}
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value.split(':');
                                  const date = new Date();
                                  date.setHours(parseInt(hours));
                                  date.setMinutes(parseInt(minutes));
                                  setEditValue(date.toISOString());
                                }}
                                onBlur={handleEditSave}
                                onKeyDown={handleKeyDown}
                                className="w-24 h-6 text-xs mx-1"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <p 
                              className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                              onClick={() => 
                                handleEditStart(
                                  task.id, 
                                  'start_time', 
                                  task.start_time || ''
                                )
                              }
                            >
                              Start: {formatDateTime(task.start_time) || '(click to set)'}
                            </p>
                          )}

                          {/* 終了時間フィールド */}
                          {editingField?.taskId === task.id && editingField?.field === 'end_time' ? (
                            <div className="flex items-center">
                              <span>End: </span>
                              <Input
                                type="time"
                                value={editValue ? new Date(editValue).toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''}
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value.split(':');
                                  const date = new Date();
                                  date.setHours(parseInt(hours));
                                  date.setMinutes(parseInt(minutes));
                                  setEditValue(date.toISOString());
                                }}
                                onBlur={handleEditSave}
                                onKeyDown={handleKeyDown}
                                className="w-24 h-6 text-xs mx-1"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <p 
                              className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                              onClick={() => 
                                handleEditStart(
                                  task.id, 
                                  'end_time', 
                                  task.end_time || ''
                                )
                              }
                            >
                              End: {formatDateTime(task.end_time) || '(click to set)'}
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
