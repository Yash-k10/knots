import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Rss,
  User,
  Users,
  Briefcase,
  Calendar,
  MessageSquare,
  Bell,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  GraduationCap
} from 'lucide-react'
import { wsClient } from '../../services/websocket'
import { apiRequest } from '../../services/api'

interface SidebarItem {
  name: string
  path: string
  icon: React.ComponentType<any>
  adminOnly?: boolean
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Feed', path: '/feed', icon: Rss },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Connections', path: '/connections', icon: Users },
  { name: 'Jobs & Internships', path: '/jobs', icon: Briefcase },
  { name: 'Events', path: '/events', icon: Calendar },
  { name: 'Messages', path: '/messaging', icon: MessageSquare },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Admin Console', path: '/admin', icon: ShieldAlert, adminOnly: true },
  { name: 'Settings', path: '/settings', icon: Settings },
]

interface UserRole {
  id: number
  name: string
}

interface CurrentUser {
  id: number
  email: string
  role_id?: number
  role?: UserRole
}

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0)
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    // Initialize WebSocket connection for real-time notifications
    wsClient.connect()

    // Fetch current logged in user details & role
    const fetchCurrentUser = async () => {
      try {
        const userData = await apiRequest<CurrentUser>('/users/me')
        setUser(userData)
      } catch (err) {
        // Fallback user fetch error
      }
    }
    fetchCurrentUser()

    // Fetch initial unread count from API
    const fetchUnreadCount = async () => {
      try {
        const res = await apiRequest<{ unread_count: number }>('/notifications/unread-count')
        setUnreadNotifications(res.unread_count || 0)
      } catch (err) {
        // Fallback default
      }
    }
    fetchUnreadCount()

    // Subscribe to real-time WebSocket notification pushes
    const unsubscribe = wsClient.onNotification((data) => {
      if (typeof data.unread_count === 'number') {
        setUnreadNotifications(data.unread_count)
      } else {
        setUnreadNotifications((prev) => prev + 1)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleLogout = () => {
    wsClient.disconnect()
    localStorage.removeItem('knots_token')
    navigate('/login')
  }

  const isAdmin = user?.role_id === 1 || user?.role?.name?.toLowerCase() === 'admin'
  const visibleSidebarItems = sidebarItems.filter((item) => !item.adminOnly || isAdmin)

  const roleBadgeLabel = user?.role?.name || (isAdmin ? 'Admin' : 'User')
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U'

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo Title */}
          <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
            <GraduationCap className="h-8 w-8 text-indigo-400" />
            <span className="text-xl font-bold tracking-wider text-white">KNOTS</span>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            {visibleSidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              const isNotifications = item.path === '/notifications'

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </div>
                  {isNotifications && unreadNotifications > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-400 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-white">
              {sidebarItems.find((item) => item.path === location.pathname)?.name || 'KNOTS'}
            </h1>
          </div>

          {/* User & Notification Header badge */}
          <div className="flex items-center gap-4">
            <Link
              to="/notifications"
              className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                {roleBadgeLabel}
              </span>
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-indigo-500/20">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Sub-page Router Outlet */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

