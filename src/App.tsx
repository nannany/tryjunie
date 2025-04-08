import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Layout from '@/components/Layout'
import AuthLayout from '@/components/AuthLayout'
import RequireAuth from '@/components/RequireAuth'
import TaskList from '@/pages/TaskList'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import NotFound from '@/pages/NotFound'

function App() {
  return (
    <>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="sign-up" element={<Register />} />
        </Route>

        {/* App routes */}
        <Route path="/" element={<Layout />}>
          <Route
            path=""
            element={
              <RequireAuth>
                <TaskList />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App
