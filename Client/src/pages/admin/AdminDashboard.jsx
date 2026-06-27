import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../utils/api";
import {
  Users, IndianRupee, AlertCircle, Receipt,
  Home, MessageSquareWarning, Bell,
  ChevronRight, CheckCircle2, Clock, Loader2,
} from "lucide-react";

const priorityColor = {
  high:   "bg-red-50 text-red-600",
  medium: "bg-amber-50 text-amber-600",
  low:    "bg-gray-100 text-gray-500",
};

const statusColor = {
  open:          "bg-red-50 text-red-600",
  "in-progress": "bg-blue-50 text-blue-600",
  resolved:      "bg-green-50 text-green-600",
};

function StatCard({ label, value, sub, icon: Icon, color, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={17} />
      </div>
      {loading ? (
        <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      )}
      <p className="text-[11px] text-gray-400 mt-0.5">{loading ? "..." : sub}</p>
      <p className="text-xs text-gray-600 font-medium mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats]             = useState(null);
  const [payments, setPayments]       = useState([]);
  const [complaints, setComplaints]   = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  useEffect(() => {
    async function fetchAll() {
      try {
        // Fetch all dashboard data in parallel
        const [residentRes, collectionRes, flatRes, complaintRes, paymentRes] = await Promise.all([
          api.get("/admin/residents"),
          api.get(`/admin/reports/collection?year=${year}`),
          api.get("/admin/reports/occupancy"),
          api.get("/admin/reports/complaints"),
          api.get(`/admin/payments?month=${month}&year=${year}`),
        ]);

        const currentMonth = collectionRes.data.monthly?.find(m => m.monthNum === month);
        const pendingDues  = residentRes.data.residents?.filter(r => r.isActive).length || 0;

        setStats({
          totalResidents: residentRes.data.total || 0,
          monthlyCollection: currentMonth?.collected || 0,
          collectionRate: currentMonth?.collectionRate || 0,
          pendingDues: currentMonth?.totalBills
            ? currentMonth.totalBills - (currentMonth.collected > 0
                ? Math.round(currentMonth.collected / (currentMonth.billed / currentMonth.totalBills || 1))
                : 0)
            : 0,
          pendingAmount: currentMonth?.pending || 0,
          totalFlats: flatRes.data.summary?.totalFlats || 0,
          vacantFlats: flatRes.data.summary?.vacant || 0,
          receiptsIssued: paymentRes.data.payments?.filter(p => p.verificationStatus === "verified").length || 0,
          openComplaints: complaintRes.data.summary?.open || 0,
          urgentComplaints: complaintRes.data.summary?.highPriority || 0,
        });

        // Recent 5 payments
        setPayments((paymentRes.data.payments || []).slice(0, 5));
        setPendingCount(paymentRes.data.payments?.filter(
          p => p.verificationStatus === "pending_verification"
        ).length || 0);

        // Recent 4 complaints
        setComplaints((complaintRes.data.complaints || []).slice(0, 4));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [month, year]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const fmt = (n) => n >= 1000 ? `₹${(n / 1000).toFixed(0)}k` : `₹${n}`;

  const STATS_CONFIG = stats
    ? [
        {
          label: "Total Residents",
          value: stats.totalResidents,
          sub: "Active residents",
          icon: Users,
          color: "bg-blue-50 text-blue-600",
        },
        {
          label: "Monthly Collection",
          value: fmt(stats.monthlyCollection),
          sub: `${stats.collectionRate}% collected`,
          icon: IndianRupee,
          color: "bg-green-50 text-green-600",
        },
        {
          label: "Pending Dues",
          value: stats.pendingDues,
          sub: `${fmt(stats.pendingAmount)} pending`,
          icon: AlertCircle,
          color: "bg-amber-50 text-amber-600",
        },
        {
          label: "Total Flats",
          value: stats.totalFlats,
          sub: `${stats.vacantFlats} vacant`,
          icon: Home,
          color: "bg-purple-50 text-purple-600",
        },
        {
          label: "Receipts Issued",
          value: stats.receiptsIssued,
          sub: "This month",
          icon: Receipt,
          color: "bg-teal-50 text-teal-600",
        },
        {
          label: "Open Complaints",
          value: stats.openComplaints,
          sub: `${stats.urgentComplaints} urgent`,
          icon: MessageSquareWarning,
          color: "bg-red-50 text-red-600",
        },
      ]
    : Array(6).fill(null);

  const handleSendReminder = async () => {
    setSending(true);
    try {
      await api.post("/admin/notifications", {
        title: "Maintenance Due Reminder",
        message: `Reminder: Your maintenance fee for ${now.toLocaleString("default", { month: "long" })} ${year} is pending. Please pay at the earliest.`,
        audience: "pending",
      });
      alert("Reminders sent to pending residents!");
    } catch (err) {
      alert("Failed to send reminders.");
    } finally {
      setSending(false);
    }
  };

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
        {STATS_CONFIG.map((s, i) =>
          s ? (
            <StatCard key={s.label} {...s} loading={loading} />
          ) : (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-gray-100 mb-3" />
              <div className="h-7 w-14 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-20 bg-gray-50 rounded mb-1" />
              <div className="h-3 w-16 bg-gray-50 rounded" />
            </div>
          )
        )}
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

          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2">
                  <div className="flex gap-3 items-center">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 animate-pulse" />
                    <div>
                      <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                      <div className="h-3 w-32 bg-gray-50 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No payments this month.</p>
          ) : (
            <div className="space-y-1">
              {payments.map((p) => {
                const isPaid = p.verificationStatus === "verified";
                const name   = p.residentId?.name || "—";
                const flat   = `${p.residentId?.wing ? p.residentId.wing + "-" : ""}${p.residentId?.flatNumber || ""}`;
                const date   = new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                return (
                  <div key={p._id}
                    className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isPaid ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-500"}`}>
                        {isPaid ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{name}</p>
                        <p className="text-xs text-gray-400">Flat {flat} · {date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">₹{p.amount?.toLocaleString()}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full
                        ${isPaid ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                        {isPaid ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between items-start py-2 gap-3">
                  <div className="flex-1">
                    <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse mb-1" />
                    <div className="h-3 w-40 bg-gray-50 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No complaints found.</p>
          ) : (
            <div className="space-y-1">
              {complaints.map((c) => {
                const flat = c.resident
                  ? `${c.resident.wing ? c.resident.wing + "-" : ""}${c.resident.flatNumber || c.resident.flat || ""}`
                  : "—";
                return (
                  <div key={c._id}
                    className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${priorityColor[c.priority] || "bg-gray-100 text-gray-500"}`}>
                          {c.priority}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{c.subject}</p>
                      <p className="text-xs text-gray-400">{c.resident?.name || "—"} · Flat {flat}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${statusColor[c.status] || "bg-gray-100 text-gray-500"}`}>
                      {c.status === "in-progress" ? "In Progress" : c.status?.charAt(0).toUpperCase() + c.status?.slice(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Send Reminder Banner */}
      <div className="mt-5 bg-admin-dark rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-admin-gold/20 flex items-center justify-center">
            <Bell size={18} className="text-admin-gold" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Send Monthly Reminder</p>
            <p className="text-white/50 text-xs">
              {loading
                ? "Loading pending count..."
                : `${stats?.pendingDues || 0} residents have not paid ${now.toLocaleString("default", { month: "long" })} maintenance yet.`}
            </p>
          </div>
        </div>
        <button
          onClick={handleSendReminder}
          disabled={sending || loading}
          className="bg-admin-gold hover:bg-admin-gold-light text-admin-dark font-semibold
            text-sm px-5 py-2.5 rounded-xl transition-all flex-shrink-0 flex items-center gap-2 disabled:opacity-60"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
          {sending ? "Sending…" : "Send Reminder"}
        </button>
      </div>

    </AdminLayout>
  );
}