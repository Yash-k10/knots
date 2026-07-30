import { useEffect, useState } from 'react'
import { Bell, Briefcase, Users, CheckCircle2, MessageSquare } from 'lucide-react'
import { apiRequest } from '../services/api'
import { wsClient } from '../services/websocket'

export interface NotificationItem {
  id: number
  user_id: number
  title: string
  content: string
  is_read: boolean
  type?: string
  created_at: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)


  const initialMockData: NotificationItem[] = [
    {
      id: -1,
      user_id: 1,
      title: 'New Job Matching Your Profile',
      content: 'Google posted Software Engineer Intern matching Python & React skills.',
      is_read: false,
      type: 'job_alert',
      created_at: new Date().toISOString(),
    },
    {
      id: -2,
      user_id: 1,
      title: 'Connection Request Accepted',
      content: 'Alumni Jane Smith accepted your networking connection request.',
      is_read: false,
      type: 'connection_request',
      created_at: new Date().toISOString(),
    },
    {
      id: -3,
      user_id: 1,
      title: 'Upcoming RSVP Event Alert',
      content: 'Guidance talk is starting in 30 minutes. Join the Zoom link.',
      is_read: true,
      type: 'event_alert',
      created_at: new Date().toISOString(),
    },
  ]

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<NotificationItem[]>('/notifications')
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data)
      } else {
        setNotifications(initialMockData)
      }
    } catch (err) {
      setNotifications(initialMockData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Real-time WebSocket notification listener
    const unsubscribe = wsClient.onNotification((data) => {
      if (data.notification) {
        const newNotif: NotificationItem = {
          id: data.notification.id,
          user_id: data.notification.user_id,
          title: data.notification.title,
          content: data.notification.content,
          is_read: data.notification.is_read,
          type: data.notification.type,
          created_at: data.notification.created_at,
        }
        setNotifications((prev) => [newNotif, ...prev])
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleMarkAsRead = async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    if (id > 0) {
      try {
        await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' })
      } catch (err) {
        // Silently handled
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' })
    } catch (err) {
      // Silently handled
    }
  }

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'job_alert':
        return { icon: Briefcase, color: 'text-emerald-400 bg-emerald-500/10' }
      case 'connection_request':
        return { icon: Users, color: 'text-indigo-400 bg-indigo-500/10' }
      case 'message':
        return { icon: MessageSquare, color: 'text-sky-400 bg-sky-500/10' }
      default:
        return { icon: Bell, color: 'text-amber-400 bg-amber-500/10' }
    }
  }

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return 'Just now'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Notifications Center</h2>
          <p className="text-slate-400 text-sm">
            Stay updated with real-time job alerts, networking connections, and campus events.
          </p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 rounded-lg transition-all"
        >
          <CheckCircle2 className="h-4 w-4" />
          Mark All as Read
        </button>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <Bell className="h-10 w-10 mx-auto mb-3 text-slate-600" />
          No notifications yet.
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-900 overflow-hidden">
          {notifications.map((item) => {
            const { icon: Icon, color } = getNotificationIcon(item.type)
            return (
              <div
                key={item.id}
                onClick={() => !item.is_read && handleMarkAsRead(item.id)}
                className={`p-6 flex gap-4 transition-all cursor-pointer ${
                  item.is_read ? 'bg-slate-950/40 opacity-75' : 'bg-slate-900/60 hover:bg-slate-900'
                }`}
              >
                <div className={`p-3 rounded-lg self-start ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      {item.title}
                      {!item.is_read && (
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping inline-block" />
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-500">{formatTime(item.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-300">{item.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

