import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  Home, Plus, Search, Filter, Edit2, Trash2, X,
  User, ChevronDown, Building2, Maximize2, StickyNote,
  CheckCircle2, Wrench,
} from "lucide-react";

const WINGS      = ["A", "B", "C", "D", "E"];
const FLOORS     = ["G", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const FLAT_TYPES = ["1BHK", "2BHK", "3BHK", "4BHK", "Studio", "Duplex", "Penthouse"];

const STATUS_META = {
  occupied:    { label: "Occupied",    color: "bg-blue-50 text-blue-700",   dot: "bg-blue-500" },
  vacant:      { label: "Vacant",      color: "bg-green-50 text-green-700", dot: "bg-green-500" },
  maintenance: { label: "Maintenance", color: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
};

const EMPTY_FORM = {
  wing: "", flatNumber: "", floor: "", flatType: "2BHK",
  area: "", status: "vacant", residentId: "", notes: "",
};

// Top-level to prevent remount on keystroke
function FormField({ label, name, type = "text", required, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin transition-all" />
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
        <select value={value} onChange={e => onChange(name, e.target.value)} required={required}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm appearance-none
            focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin bg-white">
          {placeholder && <option value="" disabled hidden>{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function FlatModal({ mode, data, residents, onClose, onSaved }) {
  const [form, setForm]   = useState(
    mode === "edit"
      ? { wing: data.wing||"", flatNumber: data.flatNumber||"", floor: data.floor||"",
          flatType: data.flatType||"2BHK", area: data.area||"", status: data.status||"vacant",
          residentId: data.resident?._id||"", notes: data.notes||"" }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleResidentChange = (_, v) => {
    setForm(f => ({ ...f, residentId: v, status: v ? "occupied" : "vacant" }));
  };

  const handleSubmit = async () => {
    if (!form.flatNumber.trim()) return toast.error("Flat number is required.");
    setLoading(true);
    try {
      const payload = { ...form, residentId: form.residentId || (mode === "edit" ? null : undefined) };
      if (mode === "add") {
        const { data: res } = await api.post("/admin/flats", payload);
        toast.success(res.message);
      } else {
        const { data: res } = await api.put(`/admin/flats/${data._id}`, payload);
        toast.success(res.message);
      }
      onSaved(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{mode === "add" ? "Add New Flat" : "Edit Flat"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{mode === "add" ? "Register a new flat in the society" : "Update flat details"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Flat Location</p>
          <div className="grid grid-cols-3 gap-3">
            <FormSelect label="Wing" name="wing" placeholder="— None —" value={form.wing} onChange={set}
              options={WINGS.map(w => ({ value: w, label: `Wing ${w}` }))} />
            <FormField label="Flat No." name="flatNumber" required placeholder="101" value={form.flatNumber} onChange={set} />
            <FormSelect label="Floor" name="floor" placeholder="— None —" value={form.floor} onChange={set}
              options={FLOORS.map(f => ({ value: f, label: `Floor ${f}` }))} />
          </div>

          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pt-1">Flat Details</p>
          <div className="grid grid-cols-2 gap-3">
            <FormSelect label="Flat Type" name="flatType" required value={form.flatType} onChange={set}
              options={FLAT_TYPES.map(t => ({ value: t, label: t }))} />
            <FormField label="Area (sq ft)" name="area" type="number" placeholder="850" value={form.area} onChange={set} />
          </div>

          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pt-1">Status & Resident</p>
          <FormSelect label="Status" name="status" required value={form.status} onChange={set}
            options={[
              { value: "vacant", label: "Vacant" },
              { value: "occupied", label: "Occupied" },
              { value: "maintenance", label: "Under Maintenance" },
            ]} />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Assign Resident <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <select value={form.residentId} onChange={e => handleResidentChange("residentId", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm appearance-none
                  focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin bg-white">
                <option value="">— No resident assigned —</option>
                {residents.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.wing ? r.wing+"-" : ""}{r.flatNumber}) · {r.phone}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
            </div>
            {form.residentId && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <CheckCircle2 size={11} /> Status auto-set to Occupied
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Any additional notes…" rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin transition-all" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-admin text-white hover:bg-admin-light disabled:opacity-60 transition-all">
            {loading ? "Saving…" : mode === "add" ? "Add Flat" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ flat, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data } = await api.delete(`/admin/flats/${flat._id}`);
      toast.success(data.message); onDeleted(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Flat?</h3>
        <p className="text-sm text-gray-500 mb-5">
          Flat <span className="font-medium text-gray-700">{flat.wing ? flat.wing+"-" : ""}{flat.flatNumber}</span> will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-60">
            {loading ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminFlats() {
  const [flats, setFlats]         = useState([]);
  const [summary, setSummary]     = useState({ total: 0, occupied: 0, vacant: 0, maintenance: 0 });
  const [residents, setResidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterWing, setFilterWing]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType]     = useState("");
  const [modal, setModal]               = useState(null);

  const fetchFlats = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)       params.search   = search;
      if (filterWing)   params.wing     = filterWing;
      if (filterStatus) params.status   = filterStatus;
      if (filterType)   params.flatType = filterType;
      const { data } = await api.get("/admin/flats", { params });
      setFlats(data.flats);
      setSummary(data.summary);
    } catch { toast.error("Failed to load flats"); }
    finally { setLoading(false); }
  }, [search, filterWing, filterStatus, filterType]);

  useEffect(() => { fetchFlats(); }, [fetchFlats]);
  useEffect(() => {
    api.get("/admin/flats/residents-list")
      .then(({ data }) => setResidents(data.residents))
      .catch(() => {});
  }, []);

  return (
    <AdminLayout pageTitle="Flat Management">

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Flats",  value: summary.total,       color: "bg-gray-100 text-gray-700",  icon: Building2 },
          { label: "Occupied",     value: summary.occupied,    color: "bg-blue-50 text-blue-600",   icon: CheckCircle2 },
          { label: "Vacant",       value: summary.vacant,      color: "bg-green-50 text-green-600", icon: Home },
          { label: "Maintenance",  value: summary.maintenance, color: "bg-amber-50 text-amber-600", icon: Wrench },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}><Icon size={17} /></div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5 border-b border-gray-100">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by flat number, wing…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            <select value={filterWing} onChange={e => setFilterWing(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Wings</option>
              {WINGS.map(w => <option key={w} value={w}>Wing {w}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Status</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Types</option>
              {FLAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={() => setModal({ type: "add" })}
            className="flex items-center gap-2 bg-admin text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-admin-light transition-all flex-shrink-0">
            <Plus size={15} /> Add Flat
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading flats…</div>
        ) : flats.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">No flats found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting filters or add a new flat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Flat", "Type", "Area", "Status", "Resident", "Notes", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flats.map(flat => {
                  const st = STATUS_META[flat.status] || STATUS_META.vacant;
                  return (
                    <tr key={flat._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Home size={15} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{flat.wing ? `${flat.wing}-` : ""}{flat.flatNumber}</p>
                            <p className="text-xs text-gray-400">{flat.floor ? `Floor ${flat.floor}` : "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">{flat.flatType}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Maximize2 size={12} className="text-gray-400" />
                          {flat.area ? `${flat.area} sq ft` : "—"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {flat.resident ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <User size={13} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-800 font-medium">{flat.resident.name}</p>
                              <p className="text-xs text-gray-400">{flat.resident.phone}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 max-w-[160px]">
                        {flat.notes ? (
                          <div className="flex items-start gap-1.5">
                            <StickyNote size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-500 truncate">{flat.notes}</p>
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setModal({ type: "edit", data: flat })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-admin hover:bg-admin/5 transition-all" title="Edit">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => setModal({ type: "delete", data: flat })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              Showing {flats.length} flat{flats.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      {modal?.type === "add"    && <FlatModal mode="add" residents={residents} onClose={() => setModal(null)} onSaved={fetchFlats} />}
      {modal?.type === "edit"   && <FlatModal mode="edit" data={modal.data} residents={residents} onClose={() => setModal(null)} onSaved={fetchFlats} />}
      {modal?.type === "delete" && <DeleteModal flat={modal.data} onClose={() => setModal(null)} onDeleted={fetchFlats} />}
    </AdminLayout>
  );
}