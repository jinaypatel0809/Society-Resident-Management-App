import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute, { PublicOnlyRoute } from "./routes/ProtectedRoute";

import AdminSignIn      from "./pages/auth/AdminSignIn";
import AdminSignUp      from "./pages/auth/AdminSignUp";
import UserSignIn       from "./pages/auth/UserSignIn";
import UserSignUp       from "./pages/auth/UserSignUp";
import AdminDashboard   from "./pages/admin/AdminDashboard";
import AdminResidents   from "./pages/admin/AdminResidents";
import AdminFlats       from "./pages/admin/AdminFlats";
import AdminMaintenance from "./pages/admin/AdminMaintenance";
import AdminPayments    from "./pages/admin/AdminPayments";
import AdminReceipts    from "./pages/admin/AdminReceipts";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminComplaints  from "./pages/admin/AdminComplaints";
import AdminReports     from "./pages/admin/AdminReports";
import AdminSettings    from "./pages/admin/AdminSettings";
import UserDashboard    from "./pages/user/UserDashboard";

import AdminLayout from "./components/admin/AdminLayout";
import HomePage     from "./pages/Home";

function ComingSoon({ title }) {
  return (
    <AdminLayout pageTitle={title}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        <p className="text-gray-400 text-sm mt-1">This section is coming soon.</p>
      </div>
    </AdminLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", fontSize: "14px" }, duration: 3000 }} />
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/signin"       element={<PublicOnlyRoute><UserSignIn /></PublicOnlyRoute>} />
          <Route path="/signup"       element={<PublicOnlyRoute><UserSignUp /></PublicOnlyRoute>} />
          <Route path="/admin/signin" element={<PublicOnlyRoute><AdminSignIn /></PublicOnlyRoute>} />
          <Route path="/admin/signup" element={<PublicOnlyRoute><AdminSignUp /></PublicOnlyRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard"     element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/residents"     element={<ProtectedRoute allowedRole="admin"><AdminResidents /></ProtectedRoute>} />
          <Route path="/admin/flats"         element={<ProtectedRoute allowedRole="admin"><AdminFlats /></ProtectedRoute>} />
          <Route path="/admin/maintenance"   element={<ProtectedRoute allowedRole="admin"><AdminMaintenance /></ProtectedRoute>} />
          <Route path="/admin/payments"      element={<ProtectedRoute allowedRole="admin"><AdminPayments /></ProtectedRoute>} />
          <Route path="/admin/receipts"      element={<ProtectedRoute allowedRole="admin"><AdminReceipts /></ProtectedRoute>} />
          <Route path="/admin/complaints"    element={<ProtectedRoute allowedRole="admin"><AdminComplaints /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRole="admin"><AdminNotifications /></ProtectedRoute>} />
          <Route path="/admin/reports"       element={<ProtectedRoute allowedRole="admin"><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/settings"      element={<ProtectedRoute allowedRole="admin"><AdminSettings /></ProtectedRoute>} />

          {/* User routes */}
          <Route path="/user/dashboard" element={<ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}