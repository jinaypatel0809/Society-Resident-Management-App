import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  Bell, Search, Filter, X, Plus, Trash2, Megaphone,
  AlertTriangle, MessageSquareWarning, CheckCheck, RefreshCw, Users, User,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "announcement",      label: "Announcements" },
  { value: "payment_submitted", label: "Payments to Verify" },
  { value: "payment_overdue",   label: "Payment Overdue" },
  { value: "complaint_raised",  label: "New Complaints" },
  { value: "complaint_update",  label: "Complaint Updates" },
];

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CategoryBadge({ category }) {
  const map = {
    announcement:      { color: "bg-purple-50 text-purple-700", icon: <Megaphone size={11} />, label: "Announcement" },
    payment_submitted: { color: "bg-green-50 text-green-700",   icon: <Bell size={11} />, label: "Payment to Verify" },
    payment_overdue:   { color: "bg-red-50 text-red-600",       icon: <AlertTriangle size={11} />, label: "Payment Overdue" },
    complaint_raised:  { color: "bg-amber-50 text-amber-600",   icon: <MessageSquareWarning size={11} />, label: "New Complaint" },
    complaint_update:  { color: "bg-blue-50 text-blue-600",     icon: <MessageSquareWarning size={11} />, label: "Complaint Update" },
  };
  const cfg = map[category] || { color: "bg-gray-100 text-gray-600", icon: null, label: category };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── New Announcement modal ─────────────────────────────────────────
function AnnouncementModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ title: "", message: "", audience: "all" });
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get("/admin/residents").then(({ data }) => {
      setResidents(data.residents || data || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      return toast.error("Title and message are required.");
    }
    setLoading(true);
    try {
      const { data } = await api.post("/admin/notifications", form);
      toast.success(data.message);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">New Announcement</h2>
            <p className="text-xs text-gray-400 mt-0.5">Send a message to residents</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. Water Supply Interruption"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea value={form.message} onChange={e => set("message", e.target.value)} rows={4}
              placeholder="Write the announcement..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Send To</label>
            <select value={form.audience} onChange={e => set("audience", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin">
              <option value="all">All Residents</option>
              {residents.map(r => (
                <option key={r._id} value={r._id}>{r.name} — {r.wing}{r.flatNumber}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-admin text-white hover:bg-admin-light disabled:opacity-60">
            {loading ? "Sending..." : "Send Announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;

      const { data } = await api.get("/admin/notifications", { params });
      setNotifications(data.notifications || []);
      setSummary(data.summary || {});
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkAllSeen = async () => {
    try {
      await api.patch("/admin/notifications/mark-all-seen");
      fetchNotifications();
    } catch {
      toast.error("Failed to mark all as seen");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/notifications/${id}`);
      toast.success("Notification deleted");
      fetchNotifications();
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  return (
    <AdminLayout pageTitle="Notifications">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: summary.total ?? 0, icon: Bell, color: "bg-gray-100 text-gray-600" },
          { label: "Unread", value: summary.unread ?? 0, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
          { label: "Announcements", value: summary.announcements ?? 0, icon: Megaphone, color: "bg-purple-50 text-purple-600" },
          { label: "System Alerts", value: summary.alerts ?? 0, icon: MessageSquareWarning, color: "bg-amber-50 text-amber-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={17} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 w-full min-w-[180px]">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search notifications…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            {(filterCategory || search) && (
              <button
                onClick={() => { setSearch(""); setFilterCategory(""); }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50">
                <X size={13} /> Clear
              </button>
            )}

            <button onClick={handleMarkAllSeen}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-admin border border-gray-200
                px-3 py-2 rounded-xl hover:bg-gray-50 transition-all">
              <CheckCheck size={14} /> Mark All Seen
            </button>

            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-admin text-white text-sm font-medium
                px-4 py-2 rounded-xl hover:bg-admin-light transition-all">
              <Plus size={14} /> New Announcement
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <RefreshCw size={20} className="mx-auto mb-2 animate-spin opacity-50" />
            Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">No notifications</p>
            <p className="text-gray-400 text-sm mt-1">Announcements and system alerts will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div key={n._id} className={`flex items-start justify-between gap-3 px-5 py-4 ${!n.seenByAdmin ? "bg-admin/5" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <CategoryBadge category={n.category} />
                    {n.category === "announcement" && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        {n.audience ? <><User size={11} /> Targeted</> : <><Users size={11} /> All Residents</>}
                      </span>
                    )}
                    {!n.seenByAdmin && (
                      <span className="w-1.5 h-1.5 rounded-full bg-admin"></span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  {n.relatedResident?.name && (
                    <p className="text-xs text-gray-400 mt-1">
                      {n.relatedResident.name} · {n.relatedResident.wing}{n.relatedResident.flatNumber}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1.5">{fmtDateTime(n.createdAt)}</p>
                </div>
                <button
                  onClick={() => handleDelete(n._id)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AnnouncementModal onClose={() => setShowModal(false)} onSaved={fetchNotifications} />
      )}
    </AdminLayout>
  );
}