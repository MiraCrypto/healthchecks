import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import CheckDetails from './pages/CheckDetails.js';
import Profile from './pages/Profile.js';
import Settings from './pages/Settings.js';
import Admin from './pages/Admin.js';

const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/checks/:id', element: <CheckDetails /> },
  { path: '/u/:username', element: <Profile /> },
  { path: '/settings', element: <Settings /> },
  { path: '/admin', element: <Admin /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
