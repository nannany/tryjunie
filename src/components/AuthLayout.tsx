import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold">
            Task Manager
          </Link>
          <h2 className="mt-2 text-xl font-semibold">Welcome</h2>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout