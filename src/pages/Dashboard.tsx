import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'

// Mock data for the dashboard
const initialStats = {
  total: 0,
  completed: 0,
  inProgress: 0,
  pending: 0
}

const Dashboard = () => {
  const [stats, setStats] = useState(initialStats)

  // Simulate fetching data
  useEffect(() => {
    // In a real app, this would be an API call
    setStats({
      total: 12,
      completed: 5,
      inProgress: 4,
      pending: 3
    })
  }, [])

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
              {stats.total > 0 ? (
                <>
                  <div className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <p className="font-medium">Complete project proposal</p>
                      <p className="text-sm text-muted-foreground">Due in 2 days</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/tasks/1">View</Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <p className="font-medium">Review client feedback</p>
                      <p className="text-sm text-muted-foreground">Due tomorrow</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/tasks/2">View</Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <p className="font-medium">Update documentation</p>
                      <p className="text-sm text-muted-foreground">Due in 3 days</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/tasks/3">View</Link>
                    </Button>
                  </div>
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
