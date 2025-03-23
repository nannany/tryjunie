import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { PlusCircle, LogIn } from 'lucide-react'

// In a real app, this would come from an auth context or state management
const isAuthenticated = false

const Navbar = () => {
  return (
    <nav className="border-b bg-background px-4 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">
          Task Manager
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Button asChild variant="default" size="sm">
              <Link to="/tasks/create" className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                New Task
              </Link>
            </Button>
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
