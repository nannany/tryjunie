import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";
import AuthLayout from "@/components/AuthLayout";
import RequireAuth from "@/components/RequireAuth";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import TaskList from "./pages/TaskList/TaskList";
import IntegrationKeys from "./pages/IntegrationKeys";

function App() {
  return (
    <>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="sign-up" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
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
          <Route
            path="integration-keys"
            element={
              <RequireAuth>
                <IntegrationKeys />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
