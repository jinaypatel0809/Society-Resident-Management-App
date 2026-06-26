import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import {
  LayoutDashboard,
  Users,
  Home,
  IndianRupee,
  CreditCard,
  Receipt,
  MessageSquareWarning,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",            icon: LayoutDashboard,       path: "/admin/dashboard" },
  { label: "Resident Management",  icon: Users,                 path: "/admin/residents" },
  { label: "Flat Management",      icon: Home,                  path: "/admin/flats" },
  { label: "Maintenance",          icon: IndianRupee,           path: "/admin/maintenance" },
  { label: "Payment Tracking",     icon: CreditCard,            path: "/admin/payments" },
  { label: "Receipts",             icon: Receipt,               path: "/admin/receipts" },
  { label: "Complaints",           icon: MessageSquareWarning,  path: "/admin/complaints" },
  { label: "Notifications",        icon: Bell,                  path: "/admin/notifications" },
  { label: "Reports",              icon: BarChart3,             path: "/admin/reports" },
  { label: "Settings",             icon: Settings,              path: "/admin/settings" },
];

export default function AdminLayout({ children, pageTitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = () => {
      api.get("/admin/notifications/unread-count")
        .then(({ data }) => { if (!cancelled) setUnreadCount(data.count || 0); })
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // refresh every 30s
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/admin/signin");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Mobile overlay ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-30 flex flex-col
          bg-admin-dark border-r border-white/10
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-admin-gold/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} className="text-admin-gold" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">SocietyMS</p>
            <p className="text-white/40 text-xs">Admin Panel</p>
          </div>
          {/* Close btn — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-white/40 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin info pill */}
        <div className="mx-4 mt-4 mb-2 bg-white/5 rounded-xl px-3 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-admin-gold/20 flex items-center justify-center
            text-admin-gold text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name || "Admin"}</p>
            <p className="text-white/40 text-[10px] truncate">{user?.societyName || "Society"}</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 py-2">
            Main Menu
          </p>
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                 transition-all duration-150 group
                 ${isActive
                   ? "bg-admin-gold/15 text-admin-gold"
                   : "text-white/60 hover:text-white hover:bg-white/8"
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className="flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-admin-gold/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
              text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-4 sticky top-0 z-10">
          {/* Hamburger — mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-800 lg:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div>
            <h1 className="text-gray-900 font-semibold text-base leading-tight">{pageTitle}</h1>
            <p className="text-gray-400 text-xs hidden sm:block">
              {user?.societyName} · {user?.societyAddress}
            </p>
          </div>

          {/* Right: bell + avatar */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/notifications")}
              className="relative text-gray-400 hover:text-gray-700 transition-colors">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px]
                  font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-admin-dark flex items-center justify-center
              text-admin-gold text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-7 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}