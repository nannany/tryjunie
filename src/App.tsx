import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import TaskList from '@/pages/TaskList'
import TaskDetail from '@/pages/TaskDetail'
import CreateTask from '@/pages/CreateTask'
import NotFound from '@/pages/NotFound'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="tasks/create" element={<CreateTask />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App
