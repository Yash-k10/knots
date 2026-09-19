import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { apiRequest } from "../services/api";

// Layouts
import DashboardLayout from "../components/layout/DashboardLayout";

// Public Pages
import Landing from "../pages/Landing";
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
import Clubs from "../pages/Clubs";
import Admin from "../pages/Admin";
import Controller from "../pages/Controller";
import Settings from "../pages/Settings";

// Role-Specific Dedicated Pages
import Students from "../pages/Students";
import DepartmentPage from "../pages/DepartmentPage";
import ApplicationsPage from "../pages/ApplicationsPage";
import PlacementsPage from "../pages/PlacementsPage";
import ReportsPage from "../pages/ReportsPage";
import InstitutionOverview from "../pages/InstitutionOverview";
import ManagementConnectPage from "../pages/ManagementConnectPage";
import DepartmentAnalyticsPage from "../pages/DepartmentAnalyticsPage";

// Protected Route Wrapper Component
interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("knots_token");

  if (!token) {
    // Redirect to landing if token is missing
    return <Navigate to="/landing" replace />;
  }

  return children;
};

// Public-Only Route Wrapper Component (redirects logged-in users away from auth pages to dashboard)
const PublicOnlyRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("knots_token");

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Controller Route Wrapper Component for Role-Based Access Control
const ControllerRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkControllerRole = async () => {
      try {
        const user = await apiRequest<{
          role_id?: number;
          role?: { name: string };
        }>("/users/me");
        if (isMounted) {
          const roleName = user.role?.name?.toLowerCase().trim();
          const hasAccess =
            user.role_id === 1 ||
            roleName === "controller" ||
            roleName === "admin" ||
            roleName === "super admin" ||
            roleName === "superadmin" ||
            roleName === "management" ||
            roleName === "central admin";
          setIsAuthorized(hasAccess);
        }
      } catch (err) {
        if (isMounted) {
          setIsAuthorized(false);
        }
      }
    };
    checkControllerRole();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Controller Authorization Required
          </h2>
          <p className="text-slate-400 text-sm">
            Access to the Controller Console is restricted to authorized Department Controllers and Administrative Leadership.
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
            roleName === "superadmin" ||
            roleName === "central admin" ||
            roleName === "management" ||
            roleName === "tpo";
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

// Role Allowed Route Wrapper Component for specific role whitelisting
const RoleAllowedRoute = ({ children, allowedRoles }: ProtectedRouteProps & { allowedRoles: string[] }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkRole = async () => {
      try {
        const user = await apiRequest<{
          role_id?: number;
          role?: { name: string };
        }>("/users/me");
        if (isMounted) {
          const roleName = user.role?.name?.toLowerCase().trim() || "student";
          const isAdmin =
            user.role_id === 1 ||
            ["admin", "super admin", "superadmin", "management", "central admin"].includes(roleName);
          setIsAuthorized(isAdmin || allowedRoles.includes(roleName));
        }
      } catch (err) {
        if (isMounted) {
          setIsAuthorized(false);
        }
      }
    };
    checkRole();
    return () => {
      isMounted = false;
    };
  }, [allowedRoles.join(",")]);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
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
            Your role is not authorized to access this section of the platform.
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
      {/* Public Landing & Informational Pages */}
      <Route path="/landing" element={<Landing />} />
      <Route path="/welcome" element={<Landing />} />

      {/* Public Auth Pages (Redirect to dashboard if already authenticated) */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      {/* Main Authenticated Application */}
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
        <Route path="students" element={<RoleAllowedRoute allowedRoles={["faculty", "tpo", "controller", "hod"]}><Students /></RoleAllowedRoute>} />
        <Route path="department" element={<RoleAllowedRoute allowedRoles={["hod", "controller", "admin", "super admin"]}><DepartmentPage /></RoleAllowedRoute>} />
        <Route path="departments" element={<RoleAllowedRoute allowedRoles={["hod", "controller", "admin", "super admin"]}><DepartmentPage /></RoleAllowedRoute>} />
        <Route path="applications" element={<RoleAllowedRoute allowedRoles={["controller", "tpo"]}><ApplicationsPage /></RoleAllowedRoute>} />
        <Route path="placements" element={<RoleAllowedRoute allowedRoles={["tpo", "hod", "controller"]}><PlacementsPage /></RoleAllowedRoute>} />
        <Route path="reports" element={<RoleAllowedRoute allowedRoles={["hod", "controller", "admin", "super admin"]}><ReportsPage /></RoleAllowedRoute>} />
        <Route path="management-connect" element={<RoleAllowedRoute allowedRoles={["hod", "admin", "super admin", "management"]}><ManagementConnectPage /></RoleAllowedRoute>} />
        <Route path="department-analytics" element={<RoleAllowedRoute allowedRoles={["hod", "controller", "admin", "super admin", "management"]}><DepartmentAnalyticsPage /></RoleAllowedRoute>} />
        <Route path="institution" element={<RoleAllowedRoute allowedRoles={["principal", "ceo"]}><InstitutionOverview /></RoleAllowedRoute>} />
        <Route path="academic-overview" element={<RoleAllowedRoute allowedRoles={["dean"]}><InstitutionOverview /></RoleAllowedRoute>} />
        <Route path="jobs" element={<RoleAllowedRoute allowedRoles={["student", "alumni", "controller", "tpo"]}><Jobs /></RoleAllowedRoute>} />
        <Route path="opportunities" element={<RoleAllowedRoute allowedRoles={["student", "alumni", "controller", "tpo"]}><Jobs /></RoleAllowedRoute>} />
        <Route path="events" element={<Events />} />
        <Route path="clubs" element={<RoleAllowedRoute allowedRoles={["student", "controller", "central admin", "admin", "super admin", "management"]}><Clubs /></RoleAllowedRoute>} />
        <Route path="messaging" element={<Messaging />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="users" element={<Admin />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route
          path="controller"
          element={
            <ControllerRoute>
              <Controller />
            </ControllerRoute>
          }
        />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
