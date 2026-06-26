import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-admin border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/signin" replace />;

  if (allowedRole && role !== allowedRole) {
    return (
      <Navigate
        to={role === "admin" ? "/admin/dashboard" : "/user/dashboard"}
        replace
      />
    );
  }

  return children;
}

export function PublicOnlyRoute({ children }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-resident border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to={role === "admin" ? "/admin/dashboard" : "/user/dashboard"}
        replace
      />
    );
  }

  return children;
}