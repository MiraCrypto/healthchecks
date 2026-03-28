import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import CheckDetails from './pages/CheckDetails.js';

const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/checks/:id', element: <CheckDetails /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
