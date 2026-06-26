import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Home, IndianRupee, Receipt,
  MessageSquareWarning, Bell, LogOut, Menu, X,
  ChevronRight, Building2,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview",        icon: LayoutDashboard,      section: "overview"       },
  { label: "My Profile",      icon: Home,                 section: "profile"        },
  { label: "Maintenance",     icon: IndianRupee,          section: "maintenance"    },
  { label: "Payment History", icon: Receipt,              section: "payments"       },
  { label: "Notifications",   icon: Bell,                 section: "notifications"  },
  { label: "Complaints",      icon: MessageSquareWarning, section: "complaints"     },
];

export default function UserLayout({ children, activeSection, onSectionChange, pageTitle, unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/signin"); };
  const handleNav    = (section) => { onSectionChange(section); setSidebarOpen(false); };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col
        bg-resident-dark border-r border-white/10
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-resident/20 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-resident-accent" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">SocietyMS</p>
            <p className="text-white/40 text-xs">Resident Portal</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-white/40 hover:text-white lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Resident info */}
        <div className="mx-4 mt-4 mb-2 bg-white/5 rounded-xl px-3 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-resident/20 flex items-center justify-center
            text-resident-accent text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || "R"}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name || "Resident"}</p>
            <p className="text-white/40 text-[10px] truncate">
              {user?.wing ? `Wing ${user.wing} · ` : ""}Flat {user?.flatNumber || "—"}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 py-2">My Portal</p>
          {NAV_ITEMS.map(({ label, icon: Icon, section }) => {
            const isActive = activeSection === section;
            const showBadge = section === "notifications" && unreadCount > 0;
            return (
              <button key={section} onClick={() => handleNav(section)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 text-left
                  ${isActive ? "bg-resident/20 text-resident-accent" : "text-white/60 hover:text-white hover:bg-white/8"}`}>
                <Icon size={17} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px]
                    font-bold flex items-center justify-center flex-shrink-0">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {isActive && !showBadge && <ChevronRight size={14} className="text-resident-accent/60" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
              text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150">
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-800 lg:hidden">
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-gray-900 font-semibold text-base leading-tight">{pageTitle}</h1>
            <p className="text-gray-400 text-xs hidden sm:block">Resident Portal</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Bell with badge in topbar */}
            <button onClick={() => handleNav("notifications")}
              className="relative text-gray-400 hover:text-gray-700 transition-colors">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px]
                  font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-resident-dark flex items-center justify-center
              text-resident-accent text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || "R"}
            </div>
          </div>
        </header>
        <main className="flex-1 p-5 lg:p-7 overflow-auto">{children}</main>
      </div>
    </div>
  );
}