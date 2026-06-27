import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../utils/api";
import {
  Users, IndianRupee, AlertCircle, Receipt,
  Home, MessageSquareWarning, Bell,
  ChevronRight, CheckCircle2, Clock, Loader2,
} from "lucide-react";

/* ── helpers ── */
const fmtMoney = (n = 0) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n / 1000).toFixed(1)}k`
  : `₹${n}`;

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

/* ── skeleton pulse box ── */
function Skel({ w = "w-16", h = "h-6" }) {
  return <div className={`${w} ${h} bg-gray-100 rounded animate-pulse`} />;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const [loading,    setLoading]    = useState(true);
  const [sending,    setSending]    = useState(false);
  const [stats,      setStats]      = useState(null);
  const [payments,   setPayments]   = useState([]);
  const [complaints, setComplaints] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, colRes, flatRes, cmpRes, payRes] = await Promise.all([
        api.get("/admin/residents"),
        api.get(`/admin/reports/collection?year=${year}`),
        api.get("/admin/reports/occupancy"),
        api.get("/admin/reports/complaints"),
        api.get(`/admin/payments?month=${month}&year=${year}`),
      ]);

      const cur = colRes.data.monthly?.find(m => m.monthNum === month) || {};
      const verifiedPayments = (payRes.data.payments || []).filter(
        p => p.verificationStatus === "verified"
      );
      const pendingPayments = (payRes.data.payments || []).filter(
        p => p.verificationStatus === "pending_verification"
      );

      setStats({
        totalResidents:   resRes.data.total || 0,
        monthlyCollection: cur.collected || 0,
        collectionRate:   cur.collectionRate || 0,
        pendingCount:     pendingPayments.length,
        pendingAmount:    cur.pending || 0,
        totalFlats:       flatRes.data.summary?.totalFlats || 0,
        vacantFlats:      flatRes.data.summary?.vacant || 0,
        receiptsIssued:   verifiedPayments.length,
        openComplaints:   cmpRes.data.summary?.open || 0,
        urgentComplaints: cmpRes.data.summary?.highPriority || 0,
      });

      setPayments((payRes.data.payments || []).slice(0, 5));
      setComplaints((cmpRes.data.complaints || []).slice(0, 4));
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  /* send reminder to all residents */
  const handleReminder = async () => {
    setSending(true);
    try {
      const monthName = now.toLocaleString("default", { month: "long" });
      await api.post("/admin/notifications", {
        title:    "Maintenance Due Reminder",
        message:  `Reminder: Your maintenance fee for ${monthName} ${year} is pending. Please pay at the earliest to avoid penalty.`,
        audience: "all",
      });
      alert("Reminders sent successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send reminders.");
    } finally {
      setSending(false);
    }
  };

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* stat cards config */
  const CARDS = [
    {
      label: "Total Residents",
      value: stats?.totalResidents,
      sub:   "Active residents",
      icon:  Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Monthly Collection",
      value: fmtMoney(stats?.monthlyCollection),
      sub:   `${stats?.collectionRate ?? 0}% collected`,
      icon:  IndianRupee,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Pending Dues",
      value: stats?.pendingCount,
      sub:   fmtMoney(stats?.pendingAmount) + " pending",
      icon:  AlertCircle,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Total Flats",
      value: stats?.totalFlats,
      sub:   `${stats?.vacantFlats ?? 0} vacant`,
      icon:  Home,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Receipts Issued",
      value: stats?.receiptsIssued,
      sub:   "This month",
      icon:  Receipt,
      color: "bg-teal-50 text-teal-600",
    },
    {
      label: "Open Complaints",
      value: stats?.openComplaints,
      sub:   `${stats?.urgentComplaints ?? 0} urgent`,
      icon:  MessageSquareWarning,
      color: "bg-red-50 text-red-600",
    },
  ];

  return (
    <AdminLayout pageTitle="Dashboard">

      {/* Welcome */}
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
        {CARDS.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={17} />
            </div>
            {loading
              ? <Skel w="w-14" h="h-7" />
              : <p className="text-xl font-bold text-gray-900 leading-tight">{value ?? "—"}</p>
            }
            <p className="text-[11px] text-gray-400 mt-0.5">{loading ? "" : sub}</p>
            <p className="text-xs text-gray-600 font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Two-column */}
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
              {[1,2,3,4].map(i => (
                <div key={i} className="flex justify-between items-center py-2">
                  <div className="flex gap-3 items-center">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 animate-pulse shrink-0" />
                    <div className="space-y-1">
                      <Skel w="w-24" h="h-3" />
                      <Skel w="w-32" h="h-2.5" />
                    </div>
                  </div>
                  <Skel w="w-14" h="h-4" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No payments this month.</p>
          ) : (
            <div className="space-y-1">
              {payments.map((p) => {
                const isPaid = p.verificationStatus === "verified";
                const name   = p.residentId?.name || "—";
                const wing   = p.residentId?.wing ? p.residentId.wing + "-" : "";
                const flat   = `${wing}${p.residentId?.flatNumber || ""}`;
                const date   = new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                return (
                  <div key={p._id}
                    className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                        ${isPaid ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-500"}`}>
                        {isPaid ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{name}</p>
                        <p className="text-xs text-gray-400">Flat {flat} · {date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        ₹{(p.amount || 0).toLocaleString("en-IN")}
                      </p>
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
              {[1,2,3,4].map(i => (
                <div key={i} className="flex justify-between items-start py-2 gap-3">
                  <div className="flex-1 space-y-1">
                    <Skel w="w-20" h="h-3" />
                    <Skel w="w-40" h="h-3.5" />
                    <Skel w="w-28" h="h-2.5" />
                  </div>
                  <Skel w="w-16" h="h-5" />
                </div>
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No complaints found.</p>
          ) : (
            <div className="space-y-1">
              {complaints.map((c) => {
                const resWing = c.resident?.wing ? c.resident.wing + "-" : "";
                const flat    = c.resident
                  ? `${resWing}${c.resident.flatNumber || c.resident.flat || ""}`
                  : "—";
                const resName = c.resident?.name || "—";
                return (
                  <div key={c._id}
                    className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full
                          ${priorityColor[c.priority] || "bg-gray-100 text-gray-500"}`}>
                          {c.priority}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{c.subject}</p>
                      <p className="text-xs text-gray-400">{resName} · Flat {flat}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full shrink-0
                      ${statusColor[c.status] || "bg-gray-100 text-gray-500"}`}>
                      {c.status === "in-progress"
                        ? "In Progress"
                        : (c.status?.charAt(0).toUpperCase() + c.status?.slice(1))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Reminder banner */}
      <div className="mt-5 bg-admin-dark rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-admin-gold/20 flex items-center justify-center shrink-0">
            <Bell size={18} className="text-admin-gold" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Send Monthly Reminder</p>
            <p className="text-white/50 text-xs">
              {loading
                ? "Loading…"
                : `${stats?.pendingCount || 0} residents have pending maintenance for ${now.toLocaleString("default", { month: "long" })} ${year}.`}
            </p>
          </div>
        </div>
        <button
          onClick={handleReminder}
          disabled={sending || loading}
          className="bg-admin-gold hover:opacity-90 text-admin-dark font-semibold
            text-sm px-5 py-2.5 rounded-xl transition-all shrink-0 flex items-center gap-2 disabled:opacity-60">
          {sending
            ? <Loader2 size={14} className="animate-spin" />
            : <Bell size={14} />}
          {sending ? "Sending…" : "Send Reminder"}
        </button>
      </div>

    </AdminLayout>
  );
}