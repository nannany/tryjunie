import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, AlertCircle, PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Mock task data
interface Task {
  id: string
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'pending'
  dueDate: string
}

const mockTasks: Task[] = [
]

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<string>('all')

  // Simulate fetching tasks
  useEffect(() => {
    // In a real app, this would be an API call
    supabase.from('tasks').select('*').then(({ data }) => {
      setTasks(data as Task[])
    })
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
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
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
          variant={filter === 'in-progress' ? 'default' : 'outline'} 
          onClick={() => setFilter('in-progress')}
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
            {filter === 'all' ? 'All tasks' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} tasks`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(task.status)}
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">Due: {formatDate(task.dueDate)}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/tasks/${task.id}`}>View</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No tasks found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TaskList
