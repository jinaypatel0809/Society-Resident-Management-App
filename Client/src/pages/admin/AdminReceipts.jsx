import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  Receipt, Search, Filter, X, Download, Eye,
  IndianRupee, RefreshCw, CheckCircle2,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────
function genMonths() {
  const list = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "long", year: "numeric" });
    list.push({ value: val, label });
  }
  return list;
}
const MONTH_OPTIONS = genMonths();

const TYPE_OPTIONS = [
  { value: "maintenance",  label: "Maintenance" },
  { value: "parking",      label: "Parking" },
  { value: "water",        label: "Water" },
  { value: "electricity",  label: "Electricity" },
  { value: "other",        label: "Other" },
];

function fmtAmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function TypeBadge({ type }) {
  const map = {
    maintenance:  "bg-blue-50 text-blue-700",
    parking:      "bg-purple-50 text-purple-700",
    water:        "bg-cyan-50 text-cyan-700",
    electricity:  "bg-yellow-50 text-yellow-700",
    other:        "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium capitalize ${map[type] || "bg-gray-100 text-gray-600"}`}>
      {type}
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

// ── Receipt preview modal ──────────────────────────────────────────
function ReceiptPreviewModal({ receipt, onClose, onDownload, downloading }) {
  const r = receipt.resident || {};
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Receipt Preview</h2>
            <p className="text-xs text-gray-400 mt-0.5">{receipt.receiptNo || "—"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={r.name} />
            <div>
              <p className="text-sm font-medium text-gray-900">{r.name || "—"}</p>
              <p className="text-xs text-gray-400">{r.wing}{r.flatNumber}{r.floor ? `, Floor ${r.floor}` : ""}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Type</p>
              <TypeBadge type={receipt.type} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Month</p>
              <p className="text-gray-800 font-medium">
                {receipt.month ? new Date(receipt.month + "-01").toLocaleString("en-IN", { month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Paid Date</p>
              <p className="text-gray-800 font-medium">{fmtDate(receipt.paidDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Due Date</p>
              <p className="text-gray-800 font-medium">{fmtDate(receipt.dueDate)}</p>
            </div>
          </div>

          {receipt.note && (
            <div>
              <p className="text-xs text-gray-400">Note</p>
              <p className="text-sm text-gray-700">{receipt.note}</p>
            </div>
          )}

          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-green-700 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Amount Paid
            </span>
            <span className="text-lg font-bold text-green-700">{fmtAmt(receipt.amount)}</span>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
            Close
          </button>
          <button onClick={() => onDownload(receipt)} disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium
              bg-admin text-white hover:bg-admin-light disabled:opacity-60">
            <Download size={14} /> {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function AdminReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary]   = useState({});
  const [loading, setLoading]   = useState(true);

  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const [preview, setPreview]         = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)      params.search = search;
      if (filterType)  params.type   = filterType;
      if (filterMonth) params.month  = filterMonth;

      const { data } = await api.get("/admin/receipts", { params });
      setReceipts(data.receipts || []);
      setSummary(data.summary || {});
    } catch {
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterMonth]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  const handleDownload = async (receipt) => {
    setDownloadingId(receipt._id);
    try {
      const res = await api.get(`/admin/receipts/${receipt._id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${receipt.receiptNo || "receipt"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download receipt");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <AdminLayout pageTitle="Receipts">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Receipts Issued", value: summary.count ?? 0,       icon: Receipt,      color: "bg-blue-50 text-blue-600" },
          { label: "Total Collected", value: fmtAmt(summary.totalAmt), icon: IndianRupee,  color: "bg-green-50 text-green-600" },
          { label: "Status",          value: "All Paid",               icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
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
              placeholder="Search by name, flat or receipt no…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400" />

            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Months</option>
              {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>

            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Types</option>
              {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            {(filterMonth || filterType || search) && (
              <button
                onClick={() => { setSearch(""); setFilterMonth(""); setFilterType(""); }}
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
            Loading receipts…
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-16">
            <Receipt size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">No receipts found</p>
            <p className="text-gray-400 text-sm mt-1">Receipts appear here once a payment is marked as paid.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Receipt No", "Resident", "Month", "Type", "Amount", "Paid Date", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">

                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono font-medium text-gray-700">{r.receiptNo || "—"}</span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.resident?.name} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.resident?.name || "—"}</p>
                          <p className="text-xs text-gray-400">{r.resident?.wing}{r.resident?.flatNumber}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {r.month
                        ? new Date(r.month + "-01").toLocaleString("en-IN", { month: "short", year: "numeric" })
                        : "—"}
                    </td>

                    <td className="px-5 py-3.5"><TypeBadge type={r.type} /></td>

                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-gray-900">{fmtAmt(r.amount)}</span>
                    </td>

                    <td className="px-5 py-3.5 text-sm text-gray-600">{fmtDate(r.paidDate)}</td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreview(r)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-admin hover:bg-admin/5 transition-all"
                          title="View Receipt">
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDownload(r)}
                          disabled={downloadingId === r._id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-admin hover:bg-admin/5 transition-all disabled:opacity-50"
                          title="Download PDF">
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              Showing {receipts.length} receipt{receipts.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      {preview && (
        <ReceiptPreviewModal
          receipt={preview}
          onClose={() => setPreview(null)}
          onDownload={handleDownload}
          downloading={downloadingId === preview._id}
        />
      )}

    </AdminLayout>
  );
}