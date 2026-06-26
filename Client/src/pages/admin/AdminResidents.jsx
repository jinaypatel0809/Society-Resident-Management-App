import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  UserPlus, Search, Filter, Edit2, ToggleLeft, ToggleRight,
  Trash2, X, Eye, EyeOff, Users, Home, ChevronDown,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────
const WINGS   = ["A", "B", "C", "D", "E"];
const FLOORS  = ["G", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const EMPTY_FORM = {
  name: "", email: "", phone: "", flatNumber: "",
  wing: "", floor: "", ownerType: "owner", password: "",
};

// ── Reusable form components (MUST be outside modal to avoid remount on every keystroke) ──
function FormField({ label, name, type = "text", required, placeholder, value, onChange, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children || (
        <input
          type={type}
          value={value}
          onChange={e => onChange(name, e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none
            focus:ring-2 focus:ring-admin/30 focus:border-admin transition-all"
        />
      )}
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

function Avatar({ name, size = "md" }) {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const colors   = ["bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700",
                    "bg-teal-100 text-teal-700",  "bg-amber-100 text-amber-700",
                    "bg-rose-100 text-rose-700",   "bg-green-100 text-green-700"];
  const color    = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  const sz       = size === "lg" ? "w-12 h-12 text-base" : "w-8 h-8 text-xs";
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────
function ResidentModal({ mode, data, onClose, onSaved }) {
  const [form, setForm]       = useState(data || EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "add") {
        const { data: res } = await api.post("/admin/residents", form);
        toast.success(res.message);
      } else {
        const { data: res } = await api.put(`/admin/residents/${data._id}`, form);
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

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {mode === "add" ? "Add New Resident" : "Edit Resident"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === "add" ? "Fill details to register a new resident" : "Update resident information"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-4">

            {/* Personal info */}
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Personal Info</p>

            <FormField label="Full Name" name="name" required placeholder="e.g. Rajesh Shah"
              value={form.name} onChange={set} />

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Email" name="email" type="email" required placeholder="email@example.com"
                value={form.email} onChange={set} />
              <FormField label="Phone" name="phone" required placeholder="9876543210"
                value={form.phone} onChange={set} />
            </div>

            {/* Flat info */}
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pt-1">Flat Details</p>

            <div className="grid grid-cols-3 gap-3">
              <FormSelect label="Wing" name="wing" placeholder="— None —"
                value={form.wing} onChange={set}
                options={WINGS.map(w => ({ value: w, label: `Wing ${w}` }))}
              />
              <FormField label="Flat No." name="flatNumber" required placeholder="101"
                value={form.flatNumber} onChange={set} />
              <FormSelect label="Floor" name="floor" placeholder="— None —"
                value={form.floor} onChange={set}
                options={FLOORS.map(f => ({ value: f, label: `Floor ${f}` }))}
              />
            </div>

            <FormSelect label="Owner Type" name="ownerType" required
              value={form.ownerType} onChange={set}
              options={[
                { value: "owner",  label: "Owner" },
                { value: "tenant", label: "Tenant" },
              ]}
            />

            {/* Password — only for Add */}
            {mode === "add" && (
              <>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pt-1">Login Credentials</p>
                <FormField label="Password" name="password" required placeholder="Min 8 characters"
                  value={form.password} onChange={set}>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={form.password}
                      onChange={e => set("password", e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm pr-10
                        focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin"
                    />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-2.5 text-gray-400">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormField>
              </>
            )}
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
            {loading ? "Saving..." : mode === "add" ? "Add Resident" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm ────────────────────────────────────────────────
function DeleteModal({ resident, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/admin/residents/${resident._id}`);
      toast.success("Resident deleted.");
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Resident?</h3>
        <p className="text-sm text-gray-500 mb-5">
          <span className="font-medium text-gray-700">{resident.name}</span> (Flat {resident.wing}{resident.flatNumber})
          will be permanently removed. This cannot be undone.
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
export default function AdminResidents() {
  const [residents, setResidents]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterWing, setFilterWing] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [modal, setModal]   = useState(null); // null | { type: "add"|"edit"|"delete", data? }

  const fetchResidents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)       params.search    = search;
      if (filterWing)   params.wing      = filterWing;
      if (filterType)   params.ownerType = filterType;
      if (filterStatus) params.status    = filterStatus;

      const { data } = await api.get("/admin/residents", { params });
      setResidents(data.residents);
    } catch (err) {
      toast.error("Failed to load residents");
    } finally {
      setLoading(false);
    }
  }, [search, filterWing, filterType, filterStatus]);

  useEffect(() => { fetchResidents(); }, [fetchResidents]);

  const handleToggle = async (resident) => {
    try {
      const { data } = await api.patch(`/admin/residents/${resident._id}/toggle-status`);
      toast.success(data.message);
      fetchResidents();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const activeCount   = residents.filter(r => r.isActive).length;
  const inactiveCount = residents.length - activeCount;
  const ownerCount    = residents.filter(r => r.ownerType === "owner").length;
  const tenantCount   = residents.filter(r => r.ownerType === "tenant").length;

  return (
    <AdminLayout pageTitle="Resident Management">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Residents", value: residents.length, icon: Users,    color: "bg-blue-50 text-blue-600" },
          { label: "Active",          value: activeCount,       icon: ToggleRight, color: "bg-green-50 text-green-600" },
          { label: "Owners",          value: ownerCount,        icon: Home,     color: "bg-purple-50 text-purple-600" },
          { label: "Tenants",         value: tenantCount,       icon: Users,    color: "bg-amber-50 text-amber-600" },
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
              placeholder="Search by name, flat, email, phone…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Filter size={14} className="text-gray-400" />
            <select value={filterWing} onChange={e => setFilterWing(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Wings</option>
              {["A","B","C","D","E"].map(w => <option key={w} value={w}>Wing {w}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Types</option>
              <option value="owner">Owner</option>
              <option value="tenant">Tenant</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Add button */}
          <button
            onClick={() => setModal({ type: "add" })}
            className="flex items-center gap-2 bg-admin text-white text-sm font-medium
              px-4 py-2 rounded-xl hover:bg-admin-light transition-all flex-shrink-0"
          >
            <UserPlus size={15} /> Add Resident
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading residents…</div>
        ) : residents.length === 0 ? (
          <div className="text-center py-16">
            <Users size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">No residents found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting filters or add a new resident.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Resident", "Flat", "Contact", "Type", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase
                      tracking-wide px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {residents.map((r) => (
                  <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">

                    {/* Resident */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Flat */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700
                        text-xs font-medium px-2.5 py-1 rounded-lg">
                        <Home size={11} />
                        {r.wing && `${r.wing}-`}{r.flatNumber}
                        {r.floor && ` · F${r.floor}`}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-700">{r.phone}</p>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                        ${r.ownerType === "owner"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"}`}>
                        {r.ownerType === "owner" ? "Owner" : "Tenant"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                        ${r.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"}`}>
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => setModal({ type: "edit", data: r })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-admin hover:bg-admin/5 transition-all"
                          title="Edit">
                          <Edit2 size={15} />
                        </button>

                        {/* Toggle active */}
                        <button
                          onClick={() => handleToggle(r)}
                          className={`p-1.5 rounded-lg transition-all
                            ${r.isActive
                              ? "text-green-500 hover:bg-green-50"
                              : "text-gray-400 hover:bg-gray-100"}`}
                          title={r.isActive ? "Deactivate" : "Activate"}>
                          {r.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setModal({ type: "delete", data: r })}
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

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              Showing {residents.length} resident{residents.length !== 1 ? "s" : ""}
              {inactiveCount > 0 && ` · ${inactiveCount} inactive`}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "add" && (
        <ResidentModal mode="add" onClose={() => setModal(null)} onSaved={fetchResidents} />
      )}
      {modal?.type === "edit" && (
        <ResidentModal mode="edit" data={modal.data} onClose={() => setModal(null)} onSaved={fetchResidents} />
      )}
      {modal?.type === "delete" && (
        <DeleteModal resident={modal.data} onClose={() => setModal(null)} onDeleted={fetchResidents} />
      )}

    </AdminLayout>
  );
}