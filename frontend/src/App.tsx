import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import Admin from './pages/Admin.js'
import CheckDetails from './pages/CheckDetails.js'
import Dashboard from './pages/Dashboard.js'
import Login from './pages/Login.js'
import Profile from './pages/Profile.js'
import Register from './pages/Register.js'
import Settings from './pages/Settings.js'

const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/checks/:id', element: <CheckDetails /> },
  { path: '/u/:username', element: <Profile /> },
  { path: '/settings', element: <Settings /> },
  { path: '/admin', element: <Admin /> },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
