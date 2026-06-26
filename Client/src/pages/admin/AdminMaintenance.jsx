import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  IndianRupee, Search, Filter, Edit2, Trash2, X,
  Plus, ChevronDown, CheckCircle2, Clock, AlertCircle,
  Users, CalendarDays, FileText,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

const STATUS_OPTIONS = ["pending", "paid", "overdue"];
const STATUS_STYLE = {
  pending:               "bg-amber-50 text-amber-700",
  paid:                  "bg-green-50 text-green-700",
  overdue:               "bg-red-50 text-red-600",
  pending_verification:  "bg-blue-50 text-blue-700",
};
const STATUS_LABEL = {
  pending:               "Pending",
  paid:                  "Paid",
  overdue:               "Overdue",
  pending_verification:  "Verifying…",
};
const STATUS_ICON  = {
  pending:               Clock,
  paid:                  CheckCircle2,
  overdue:               AlertCircle,
  pending_verification:  Clock,
};

const EMPTY_FORM = {
  residentId: "",
  month: "",
  year:  String(CURRENT_YEAR),
  amount: "",
  dueDate: "",
  status: "pending",
  description: "",
};

// ── Helpers ────────────────────────────────────────────────────────
function FormField({ label, name, type = "text", required, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin transition-all"
      />
    </div>
  );
}

function FormSelect({ label, name, required, placeholder, options, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(name, e.target.value)}
          required={required}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm appearance-none
            focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin bg-white"
        >
          <option value="" disabled hidden>{placeholder || `Select ${label}`}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ── Add / Edit Modal ───────────────────────────────────────────────
function MaintenanceModal({ mode, data, residents, onClose, onSaved }) {
  const [form, setForm]       = useState(data || EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "add") {
        const { data: res } = await api.post("/admin/maintenance", form);
        toast.success(res.message);
      } else {
        const { data: res } = await api.put(`/admin/maintenance/${data._id}`, form);
        toast.success(res.message);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const residentOptions = residents.map(r => ({
    value: r._id,
    label: `${r.name} · ${r.wing ? r.wing + "-" : ""}${r.flatNumber}`,
  }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {mode === "add" ? "Add Maintenance Bill" : "Edit Maintenance Bill"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === "add" ? "Create a new maintenance bill for a resident" : "Update bill information"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-4">

            {/* Resident */}
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Resident</p>
            <FormSelect
              label="Select Resident" name="residentId" required
              placeholder="Choose a resident"
              value={form.residentId?._id || form.residentId}
              onChange={set}
              options={residentOptions}
            />

            {/* Bill Period */}
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pt-1">Bill Period</p>
            <div className="grid grid-cols-2 gap-3">
              <FormSelect label="Month" name="month" required placeholder="Select month"
                value={form.month} onChange={set}
                options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
              />
              <FormSelect label="Year" name="year" required placeholder="Select year"
                value={form.year} onChange={set}
                options={YEARS.map(y => ({ value: String(y), label: String(y) }))}
              />
            </div>

            {/* Bill Details */}
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pt-1">Bill Details</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Amount (₹)" name="amount" type="number" required placeholder="2500"
                value={form.amount} onChange={set} />
              <FormField label="Due Date" name="dueDate" type="date" required
                value={form.dueDate?.split("T")[0] || form.dueDate} onChange={set} />
            </div>

            <FormSelect label="Status" name="status" required placeholder="Select status"
              value={form.status} onChange={set}
              options={STATUS_OPTIONS.map(s => ({ value: s, label: STATUS_LABEL[s] }))}
            />

            {/* Paid On — show only when status = paid */}
            {form.status === "paid" && (
              <FormField label="Paid On" name="paidOn" type="date"
                value={form.paidOn?.split("T")[0] || form.paidOn || ""} onChange={set} />
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description / Notes</label>
              <textarea
                value={form.description}
                onChange={e => set("description", e.target.value)}
                placeholder="e.g. Monthly society maintenance, water charges included…"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin transition-all"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-admin text-white
              hover:bg-admin-light disabled:opacity-60 transition-all"
          >
            {loading ? "Saving..." : mode === "add" ? "Add Bill" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mark Paid Modal ────────────────────────────────────────────────
function MarkPaidModal({ bill, onClose, onSaved }) {
  const [paidOn, setPaidOn] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handleMarkPaid = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch(`/admin/maintenance/${bill._id}/mark-paid`, { paidOn });
      toast.success(data.message);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  };

  const resident = bill.residentId;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle2 size={22} className="text-green-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Mark as Paid</h3>
        <p className="text-sm text-gray-500 mb-4">
          Mark maintenance bill for{" "}
          <span className="font-medium text-gray-700">
            {resident?.name || "Resident"}
          </span>{" "}
          ({MONTHS[(bill.month || 1) - 1]} {bill.year}) as paid?
        </p>
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
          <input type="date" value={paidOn} onChange={e => setPaidOn(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-admin/30" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleMarkPaid} disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-60">
            {loading ? "Saving..." : "Mark Paid"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ───────────────────────────────────────────────────
function DeleteModal({ bill, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/admin/maintenance/${bill._id}`);
      toast.success("Bill deleted.");
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const resident = bill.residentId;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Bill?</h3>
        <p className="text-sm text-gray-500 mb-5">
          Bill for{" "}
          <span className="font-medium text-gray-700">
            {resident?.name || "Resident"}
          </span>{" "}
          ({MONTHS[(bill.month || 1) - 1]} {bill.year}) will be permanently removed.
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

// ── Main Page ──────────────────────────────────────────────────────
export default function AdminMaintenance() {
  const [bills, setBills]           = useState([]);
  const [residents, setResidents]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth]   = useState("");
  const [filterYear, setFilterYear]     = useState(String(CURRENT_YEAR));
  const [modal, setModal]           = useState(null);

  // Fetch residents for dropdown
  const fetchResidents = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/residents");
      setResidents(data.residents);
    } catch { /* silent */ }
  }, []);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)       params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterMonth)  params.month  = filterMonth;
      if (filterYear)   params.year   = filterYear;

      const { data } = await api.get("/admin/maintenance", { params });
      setBills(data.bills);
    } catch {
      toast.error("Failed to load maintenance bills");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterMonth, filterYear]);

  useEffect(() => {
    fetchResidents();
    fetchBills();
  }, [fetchResidents, fetchBills]);

  // Summary counts
  const totalBills    = bills.length;
  const totalAmount   = bills.reduce((s, b) => s + (b.amount || 0), 0);
  const paidCount     = bills.filter(b => b.status === "paid").length;
  const pendingCount  = bills.filter(b => b.status === "pending").length;
  const overdueCount  = bills.filter(b => b.status === "overdue").length;
  const collectedAmt  = bills.filter(b => b.status === "paid").reduce((s, b) => s + (b.amount || 0), 0);

  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <AdminLayout pageTitle="Maintenance Management">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Bills",     value: totalBills,              icon: FileText,     color: "bg-blue-50 text-blue-600",   isCount: true },
          { label: "Collected",       value: formatCurrency(collectedAmt), icon: CheckCircle2, color: "bg-green-50 text-green-600", isCount: false },
          { label: "Pending",         value: pendingCount,            icon: Clock,        color: "bg-amber-50 text-amber-600", isCount: true },
          { label: "Overdue",         value: overdueCount,            icon: AlertCircle,  color: "bg-red-50 text-red-600",    isCount: true },
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5 border-b border-gray-100">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by resident name, flat…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Months</option>
              {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Years</option>
              {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>

          {/* Add button */}
          <button
            onClick={() => setModal({ type: "add" })}
            className="flex items-center gap-2 bg-admin text-white text-sm font-medium
              px-4 py-2 rounded-xl hover:bg-admin-light transition-all flex-shrink-0"
          >
            <Plus size={15} /> Add Bill
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading bills…</div>
        ) : bills.length === 0 ? (
          <div className="text-center py-16">
            <IndianRupee size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">No maintenance bills found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting filters or add a new bill.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Resident", "Period", "Amount", "Due Date", "Status", "Paid On", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase
                      tracking-wide px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => {
                  const resident = b.residentId;
                  const StatusIcon = STATUS_ICON[b.status] || Clock;
                  const isOverdue = b.status === "overdue" ||
                    (b.status === "pending" && b.dueDate && new Date(b.dueDate) < new Date());

                  return (
                    <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">

                      {/* Resident */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-admin/10 flex items-center justify-center
                            text-admin text-xs font-bold flex-shrink-0">
                            {resident?.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{resident?.name || "—"}</p>
                            <p className="text-xs text-gray-400">
                              {resident?.wing ? `${resident.wing}-` : ""}{resident?.flatNumber || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Period */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <CalendarDays size={13} className="text-gray-400" />
                          {MONTHS[(b.month || 1) - 1]?.slice(0, 3)} {b.year}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(b.amount || 0)}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-5 py-3.5">
                        <span className={`text-sm ${isOverdue && b.status !== "paid" ? "text-red-500 font-medium" : "text-gray-700"}`}>
                          {b.dueDate ? new Date(b.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full
                          ${STATUS_STYLE[b.status] || "bg-gray-100 text-gray-600"}`}>
                          <StatusIcon size={11} />
                          {STATUS_LABEL[b.status] || b.status}
                        </span>
                      </td>

                      {/* Paid On */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-500">
                          {b.paidOn
                            ? new Date(b.paidOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          {/* Mark Paid — only if not already paid */}
                          {b.status !== "paid" && (
                            <button
                              onClick={() => setModal({ type: "markPaid", data: b })}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition-all"
                              title="Mark as Paid">
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          {/* Edit */}
                          <button
                            onClick={() => setModal({ type: "edit", data: b })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-admin hover:bg-admin/5 transition-all"
                            title="Edit">
                            <Edit2 size={15} />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setModal({ type: "delete", data: b })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>Showing {bills.length} bill{bills.length !== 1 ? "s" : ""}</span>
              <span className="font-medium text-gray-600">
                Total: {formatCurrency(totalAmount)} · Collected: {formatCurrency(collectedAmt)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "add" && (
        <MaintenanceModal mode="add" residents={residents} onClose={() => setModal(null)} onSaved={fetchBills} />
      )}
      {modal?.type === "edit" && (
        <MaintenanceModal mode="edit" data={modal.data} residents={residents} onClose={() => setModal(null)} onSaved={fetchBills} />
      )}
      {modal?.type === "markPaid" && (
        <MarkPaidModal bill={modal.data} onClose={() => setModal(null)} onSaved={fetchBills} />
      )}
      {modal?.type === "delete" && (
        <DeleteModal bill={modal.data} onClose={() => setModal(null)} onDeleted={fetchBills} />
      )}
    </AdminLayout>
  );
}