import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  Users, IndianRupee, AlertCircle, Receipt,
  TrendingUp, Home, MessageSquareWarning, Bell,
  ChevronRight, CheckCircle2, Clock,
} from "lucide-react";

const STATS = [
  {
    label: "Total Residents",
    value: "128",
    sub: "+3 this month",
    icon: Users,
    color: "bg-blue-50 text-blue-600",
    trend: "up",
  },
  {
    label: "Monthly Collection",
    value: "₹1,28,000",
    sub: "96% collected",
    icon: IndianRupee,
    color: "bg-green-50 text-green-600",
    trend: "up",
  },
  {
    label: "Pending Dues",
    value: "14",
    sub: "₹14,000 pending",
    icon: AlertCircle,
    color: "bg-amber-50 text-amber-600",
    trend: "down",
  },
  {
    label: "Total Flats",
    value: "140",
    sub: "12 vacant",
    icon: Home,
    color: "bg-purple-50 text-purple-600",
  },
  {
    label: "Receipts Issued",
    value: "114",
    sub: "This month",
    icon: Receipt,
    color: "bg-teal-50 text-teal-600",
  },
  {
    label: "Open Complaints",
    value: "6",
    sub: "2 urgent",
    icon: MessageSquareWarning,
    color: "bg-red-50 text-red-600",
    trend: "down",
  },
];

const RECENT_PAYMENTS = [
  { name: "Rajesh Shah",    flat: "A-101", amount: "₹1,000", date: "Today, 9:45 AM",   status: "paid" },
  { name: "Priya Mehta",   flat: "B-203", amount: "₹1,000", date: "Today, 8:10 AM",   status: "paid" },
  { name: "Amit Patel",    flat: "C-305", amount: "₹1,000", date: "Yesterday",         status: "paid" },
  { name: "Sunita Verma",  flat: "A-204", amount: "₹1,000", date: "15 Jun",            status: "pending" },
  { name: "Kiran Joshi",   flat: "D-102", amount: "₹1,000", date: "12 Jun",            status: "pending" },
];

const RECENT_COMPLAINTS = [
  { id: "C-041", resident: "Rajesh Shah",   flat: "A-101", issue: "Water leakage in bathroom", priority: "high",   status: "open" },
  { id: "C-040", resident: "Priya Mehta",   flat: "B-203", issue: "Lift not working",           priority: "high",   status: "open" },
  { id: "C-039", resident: "Amit Patel",    flat: "C-305", issue: "Parking light broken",       priority: "medium", status: "in-progress" },
  { id: "C-038", resident: "Nisha Kapoor",  flat: "D-401", issue: "Garbage not collected",      priority: "low",    status: "resolved" },
];

const priorityColor = {
  high:   "bg-red-50 text-red-600",
  medium: "bg-amber-50 text-amber-600",
  low:    "bg-gray-100 text-gray-500",
};

const statusColor = {
  open:         "bg-red-50 text-red-600",
  "in-progress":"bg-blue-50 text-blue-600",
  resolved:     "bg-green-50 text-green-600",
};

export default function AdminDashboard() {
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AdminLayout pageTitle="Dashboard">

      {/* Welcome row */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {greeting}, {user?.name?.split(" ")[0] || "Admin"} 👋
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Here's what's happening in {user?.societyName || "your society"} today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-7">
        {STATS.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={17} />
            </div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
            <p className="text-xs text-gray-600 font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <IndianRupee size={16} className="text-admin-light" />
              Recent Payments
            </h3>
            <button className="text-xs text-admin font-medium hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div className="space-y-1">
            {RECENT_PAYMENTS.map(({ name, flat, amount, date, status }) => (
              <div key={name + flat}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                    ${status === "paid" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-500"}`}>
                    {status === "paid" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{name}</p>
                    <p className="text-xs text-gray-400">Flat {flat} · {date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{amount}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full
                    ${status === "paid" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                    {status === "paid" ? "Paid" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquareWarning size={16} className="text-admin-light" />
              Recent Complaints
            </h3>
            <button className="text-xs text-admin font-medium hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div className="space-y-1">
            {RECENT_COMPLAINTS.map(({ id, resident, flat, issue, priority, status }) => (
              <div key={id}
                className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-semibold text-gray-400">{id}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${priorityColor[priority]}`}>
                      {priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{issue}</p>
                  <p className="text-xs text-gray-400">{resident} · Flat {flat}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${statusColor[status]}`}>
                  {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick action banner */}
      <div className="mt-5 bg-admin-dark rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-admin-gold/20 flex items-center justify-center">
            <Bell size={18} className="text-admin-gold" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Send Monthly Reminder</p>
            <p className="text-white/50 text-xs">14 residents have not paid June maintenance yet.</p>
          </div>
        </div>
        <button className="bg-admin-gold hover:bg-admin-gold-light text-admin-dark font-semibold
          text-sm px-5 py-2.5 rounded-xl transition-all flex-shrink-0 flex items-center gap-2">
          <Bell size={14} /> Send Reminder
        </button>
      </div>

    </AdminLayout>
  );
}