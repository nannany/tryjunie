import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// Mock task data (same as in TaskList)
interface Task {
  id: string
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'pending'
  dueDate: string
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Complete project proposal',
    description: 'Write and submit the project proposal document with all required sections including project scope, timeline, and budget estimates.',
    status: 'in-progress',
    dueDate: '2023-06-15'
  },
  {
    id: '2',
    title: 'Review client feedback',
    description: 'Go through client feedback and make necessary adjustments to the design and functionality based on their comments.',
    status: 'pending',
    dueDate: '2023-06-10'
  },
  {
    id: '3',
    title: 'Update documentation',
    description: 'Update the project documentation with recent changes to ensure all team members are on the same page.',
    status: 'completed',
    dueDate: '2023-06-05'
  },
  {
    id: '4',
    title: 'Prepare presentation',
    description: 'Create slides for the upcoming presentation to stakeholders, highlighting key achievements and next steps.',
    status: 'pending',
    dueDate: '2023-06-20'
  },
  {
    id: '5',
    title: 'Team meeting',
    description: 'Attend weekly team meeting to discuss progress, blockers, and upcoming tasks.',
    status: 'completed',
    dueDate: '2023-06-02'
  }
]

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  // Simulate fetching task data
  useEffect(() => {
    // In a real app, this would be an API call
    const fetchTask = () => {
      setLoading(true)
      setTimeout(() => {
        const foundTask = mockTasks.find(t => t.id === id)
        setTask(foundTask || null)
        setLoading(false)
      }, 500) // Simulate network delay
    }

    fetchTask()
  }, [id])

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </div>
        )
      case 'in-progress':
        return (
          <div className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
            <Clock className="h-3 w-3" />
            In Progress
          </div>
        )
      case 'pending':
        return (
          <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
            <AlertCircle className="h-3 w-3" />
            Pending
          </div>
        )
      default:
        return null
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Handle delete
  const handleDelete = () => {
    // In a real app, this would be an API call
    toast({
      title: "Task deleted",
      description: "The task has been successfully deleted.",
    })
    navigate('/tasks')
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading task details...</p>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-xl font-medium">Task not found</p>
        <p className="text-muted-foreground">The task you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link to="/tasks">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task Details</CardTitle>
            {getStatusBadge(task.status)}
          </div>
          <CardDescription>Created on {formatDate(task.dueDate)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="mt-1 text-muted-foreground">{task.description}</p>
            </div>
            <div>
              <h3 className="font-medium">Due Date</h3>
              <p className="mt-1 text-muted-foreground">{formatDate(task.dueDate)}</p>
            </div>
            <div>
              <h3 className="font-medium">Status</h3>
              <p className="mt-1 capitalize text-muted-foreground">{task.status.replace('-', ' ')}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link to={`/tasks/${task.id}/edit`} className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-1">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default TaskDetail
