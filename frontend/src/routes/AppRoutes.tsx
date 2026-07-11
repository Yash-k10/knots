import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import DashboardLayout from '../components/layout/DashboardLayout'

// Public Pages
import Login from '../pages/Login'
import Register from '../pages/Register'

// Protected Pages
import Dashboard from '../pages/Dashboard'
import Feed from '../pages/Feed'
import Profile from '../pages/Profile'
import Connections from '../pages/Connections'
import Jobs from '../pages/Jobs'
import Events from '../pages/Events'
import Messaging from '../pages/Messaging'
import Notifications from '../pages/Notifications'
import Admin from '../pages/Admin'
import Settings from '../pages/Settings'

// Protected Route Wrapper Component
interface ProtectedRouteProps {
  children: React.ReactElement
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem('knots_token')
  
  if (!token) {
    // Redirect to login if token is missing
    return <Navigate to="/login" replace />
  }

  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Main Application Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="feed" element={<Feed />} />
        <Route path="profile" element={<Profile />} />
        <Route path="connections" element={<Connections />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="events" element={<Events />} />
        <Route path="messaging" element={<Messaging />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="admin" element={<Admin />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
