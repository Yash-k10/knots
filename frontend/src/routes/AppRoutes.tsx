import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { apiRequest } from "../services/api";

// Layouts
import DashboardLayout from "../components/layout/DashboardLayout";

// Public Pages
import Login from "../pages/Login";
import Register from "../pages/Register";

// Protected Pages
import Dashboard from "../pages/Dashboard";
import Feed from "../pages/Feed";
import Profile from "../pages/Profile";
import Connections from "../pages/Connections";
import Jobs from "../pages/Jobs";
import Events from "../pages/Events";
import Messaging from "../pages/Messaging";
import Notifications from "../pages/Notifications";
import Admin from "../pages/Admin";
import Settings from "../pages/Settings";

// Protected Route Wrapper Component
interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("knots_token");

  if (!token) {
    // Redirect to login if token is missing
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin Route Wrapper Component for Role-Based Access Control
const AdminRoute = ({ children }: ProtectedRouteProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkAdminRole = async () => {
      try {
        const user = await apiRequest<{
          role_id?: number;
          role?: { name: string };
        }>("/users/me");
        if (isMounted) {
          const roleName = user.role?.name?.toLowerCase().trim();
          const hasAdminRole =
            user.role_id === 1 ||
            roleName === "admin" ||
            roleName === "super admin" ||
            roleName === "superadmin";
          setIsAdmin(hasAdminRole);
        }
      } catch (err) {
        if (isMounted) {
          setIsAdmin(false);
        }
      }
    };
    checkAdminRole();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Access Denied
          </h2>
          <p className="text-slate-400 text-sm">
            Administrative authorization is required to access the Admin
            Console. Your account does not have administrator privileges.
          </p>
        </div>
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

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
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="connections" element={<Connections />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="events" element={<Events />} />
        <Route path="messaging" element={<Messaging />} />
        <Route path="notifications" element={<Notifications />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
