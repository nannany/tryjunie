import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { PlusCircle } from 'lucide-react'

const Navbar = () => {
  return (
    <nav className="border-b bg-background px-4 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">
          Task Manager
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild variant="default" size="sm">
            <Link to="/tasks/create" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
