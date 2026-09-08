import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
  Users,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { apiRequest } from "../services/api";
import { wsClient } from "../services/websocket";
import { formatTimeAgo } from "../utils/date";

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  content: string;
  is_read: boolean;
  type?: string;
  created_at: string;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const initialMockData: NotificationItem[] = [
    {
      id: -1,
      user_id: 1,
      title: "New Job Matching Your Profile",
      content:
        "Google posted Software Engineer Intern matching Python & React skills.",
      is_read: false,
      type: "job_alert",
      created_at: new Date().toISOString(),
    },
    {
      id: -2,
      user_id: 1,
      title: "Connection Request Accepted",
      content: "Alumni Jane Smith accepted your networking connection request.",
      is_read: false,
      type: "connection_request",
      created_at: new Date().toISOString(),
    },
    {
      id: -3,
      user_id: 1,
      title: "Upcoming RSVP Event Alert",
      content: "Guidance talk is starting in 30 minutes. Join the Zoom link.",
      is_read: true,
      type: "event_alert",
      created_at: new Date().toISOString(),
    },
  ];

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<NotificationItem[]>("/notifications");
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data);
      } else {
        setNotifications(initialMockData);
      }
    } catch (err) {
      setNotifications(initialMockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

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
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleMarkAsRead = async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    window.dispatchEvent(new Event("notification-read"));
    if (id > 0) {
      try {
        await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
      } catch (err) {
        // Silently handled
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    window.dispatchEvent(new Event("notification-read-all"));
    try {
      await apiRequest("/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      // Silently handled
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id);
    }
    if (
      item.type === "connection_accepted" ||
      item.title.toLowerCase().includes("accepted")
    ) {
      navigate("/connections?tab=connections");
    } else if (
      item.type === "connection_request" ||
      item.title.toLowerCase().includes("connection") ||
      item.content.toLowerCase().includes("connection")
    ) {
      navigate("/connections?tab=requests");
    } else if (
      item.type === "job_alert" ||
      item.title.toLowerCase().includes("job")
    ) {
      navigate("/jobs");
    } else if (
      item.type === "message" ||
      item.title.toLowerCase().includes("message")
    ) {
      navigate("/messaging");
    } else if (
      item.type === "event_alert" ||
      item.title.toLowerCase().includes("event")
    ) {
      navigate("/events");
    }
  };


  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "job_alert":
        return { icon: Briefcase, color: "text-emerald-700 bg-emerald-50 border border-emerald-200" };
      case "connection_request":
        return { icon: Users, color: "text-[#4B63D2] bg-[#C8B6E2]/25 border border-[#C8B6E2]" };
      case "message":
        return { icon: MessageSquare, color: "text-sky-700 bg-sky-50 border border-sky-200" };
      default:
        return { icon: Bell, color: "text-[#5851A4] bg-[#FFD21A]/20 border border-[#FFD21A]/50" };
    }
  };


  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-[#1E2746] mb-1">
            Notifications Center
          </h2>
          <p className="text-[#5851A4] text-sm font-medium">
            Stay updated with real-time job alerts, networking connections, and
            campus events.
          </p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#4B63D2] hover:text-white bg-[#4B63D2]/10 hover:bg-[#4B63D2] rounded-xl transition-all cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4" />
          Mark All as Read
        </button>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 text-center text-[#5851A4] font-medium shadow-sm">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center text-[#5851A4] shadow-sm">
          <Bell className="h-10 w-10 mx-auto mb-3 text-[#B9B1D9]" />
          <p className="font-semibold">No notifications yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#EAE4F7] rounded-3xl divide-y divide-[#EAE4F7] overflow-hidden shadow-sm">
          {notifications.map((item) => {
            const { icon: Icon, color } = getNotificationIcon(item.type);
            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-6 flex gap-4 transition-all cursor-pointer ${
                  item.is_read
                    ? "bg-[#FAF9FD]/50 opacity-80"
                    : "bg-white hover:bg-[#FAF9FD]"
                }`}
              >
                <div className={`p-3 rounded-2xl self-start ${color} shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#1E2746] flex items-center gap-2">
                      {item.title}
                      {!item.is_read && (
                        <span className="h-2 w-2 rounded-full bg-[#4B63D2] animate-pulse inline-block" />
                      )}
                    </h4>
                    <span className="text-[11px] font-semibold text-[#9188BE]">
                      {formatTimeAgo(item.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-[#5851A4] font-medium leading-relaxed">{item.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
