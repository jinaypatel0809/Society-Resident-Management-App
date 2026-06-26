import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  MessageSquareWarning, Search, Filter, X, Trash2, RefreshCw,
  AlertCircle, Clock, CheckCircle2, Flame,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: "plumbing",    label: "Plumbing" },
  { value: "electrical",  label: "Electrical" },
  { value: "cleaning",    label: "Cleaning" },
  { value: "security",    label: "Security" },
  { value: "parking",     label: "Parking" },
  { value: "lift",        label: "Lift" },
  { value: "other",       label: "Other" },
];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function PriorityBadge({ priority }) {
  const map = {
    high:   "bg-red-50 text-red-600",
    medium: "bg-amber-50 text-amber-700",
    low:    "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium capitalize ${map[priority] || "bg-gray-100 text-gray-600"}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    open:          "bg-red-50 text-red-600",
    "in-progress": "bg-blue-50 text-blue-600",
    resolved:      "bg-green-50 text-green-700",
  };
  const icons = {
    open: <AlertCircle size={11} />,
    "in-progress": <Clock size={11} />,
    resolved: <CheckCircle2 size={11} />,
  };
  const labels = { open: "Open", "in-progress": "In Progress", resolved: "Resolved" };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {icons[status]} {labels[status] || status}
    </span>
  );
}

function CategoryBadge({ category }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-lg font-medium capitalize bg-purple-50 text-purple-700">
      {category}
    </span>
  );
}

function Avatar({ name }) {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const colors = [
    "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700",
    "bg-teal-100 text-teal-700",  "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",  "bg-green-100 text-green-700",
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Manage complaint modal ─────────────────────────────────────────
function ManageModal({ complaint, onClose, onSaved }) {
  const [status, setStatus]     = useState(complaint.status);
  const [priority, setPriority] = useState(complaint.priority);
  const [adminNote, setAdminNote] = useState(complaint.adminNote || "");
  const [loading, setLoading]   = useState(false);
  const r = complaint.resident || {};

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch(`/admin/complaints/${complaint._id}/status`, {
        status, priority, adminNote,
      });
      toast.success(data.message);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Manage Complaint</h2>
            <p className="text-xs text-gray-400 mt-0.5">{r.name} — {r.wing}{r.flatNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">{complaint.subject}</p>
            <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">{complaint.description}</p>
            <p className="text-xs text-gray-400 mt-1.5">Raised on {fmtDateTime(complaint.createdAt)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin">
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Admin Note (visible to resident)</label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
              placeholder="e.g. Plumber scheduled for tomorrow morning..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin" />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-admin text-white hover:bg-admin-light disabled:opacity-60">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm modal ───────────────────────────────────────────
function DeleteModal({ complaint, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data } = await api.delete(`/admin/complaints/${complaint._id}`);
      toast.success(data.message);
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-2">Delete Complaint?</h2>
        <p className="text-sm text-gray-500 mb-5">
          The complaint <span className="font-medium text-gray-700">"{complaint.subject}"</span> will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-60">
            {loading ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary]       = useState({});
  const [loading, setLoading]       = useState(true);

  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [modal, setModal] = useState(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)         params.search   = search;
      if (filterStatus)   params.status   = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (filterCategory) params.category = filterCategory;

      const { data } = await api.get("/admin/complaints", { params });
      setComplaints(data.complaints || []);
      setSummary(data.summary || {});
    } catch {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPriority, filterCategory]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  return (
    <AdminLayout pageTitle="Complaints">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Open",        value: summary.open ?? 0,       icon: AlertCircle, color: "bg-red-50 text-red-600" },
          { label: "In Progress", value: summary.inProgress ?? 0, icon: Clock,       color: "bg-blue-50 text-blue-600" },
          { label: "Resolved",    value: summary.resolved ?? 0,   icon: CheckCircle2, color: "bg-green-50 text-green-600" },
          { label: "Urgent",      value: summary.urgent ?? 0,     icon: Flame,       color: "bg-amber-50 text-amber-600" },
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

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 w-full min-w-[180px]">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, flat or subject…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400" />

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            {(filterStatus || filterPriority || filterCategory || search) && (
              <button
                onClick={() => { setSearch(""); setFilterStatus(""); setFilterPriority(""); setFilterCategory(""); }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50">
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <RefreshCw size={20} className="mx-auto mb-2 animate-spin opacity-50" />
            Loading complaints…
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquareWarning size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">No complaints found</p>
            <p className="text-gray-400 text-sm mt-1">Complaints raised by residents will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Resident", "Subject", "Category", "Priority", "Raised On", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.resident?.name} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.resident?.name || "—"}</p>
                          <p className="text-xs text-gray-400">{c.resident?.wing}{c.resident?.flatNumber}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-800 max-w-[220px] truncate">{c.subject}</p>
                      <p className="text-xs text-gray-400 max-w-[220px] truncate">{c.description}</p>
                    </td>

                    <td className="px-5 py-3.5"><CategoryBadge category={c.category} /></td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{fmtDate(c.createdAt)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal({ type: "manage", data: c })}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-admin/5 text-admin hover:bg-admin/10 transition-all">
                          Manage
                        </button>
                        <button
                          onClick={() => setModal({ type: "delete", data: c })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              Showing {complaints.length} complaint{complaints.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      {modal?.type === "manage" && (
        <ManageModal complaint={modal.data} onClose={() => setModal(null)} onSaved={fetchComplaints} />
      )}
      {modal?.type === "delete" && (
        <DeleteModal complaint={modal.data} onClose={() => setModal(null)} onDeleted={fetchComplaints} />
      )}

    </AdminLayout>
  );
}