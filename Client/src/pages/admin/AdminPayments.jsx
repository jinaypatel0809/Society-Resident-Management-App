import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  Search, Filter, CheckCircle2, XCircle, Clock,
  IndianRupee, AlertCircle, Trash2, X, Eye,
  CreditCard, CalendarDays, BadgeCheck,
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

const VERIFICATION_STYLE = {
  pending_verification: "bg-amber-50 text-amber-700",
  verified:             "bg-green-50 text-green-700",
  rejected:             "bg-red-50 text-red-600",
};
const VERIFICATION_LABEL = {
  pending_verification: "Pending",
  verified:             "Verified",
  rejected:             "Rejected",
};
const VERIFICATION_ICON = {
  pending_verification: Clock,
  verified:             CheckCircle2,
  rejected:             XCircle,
};

const MODE_LABEL = {
  cash: "Cash", upi: "UPI", bank_transfer: "Bank Transfer",
  cheque: "Cheque", online: "Online",
};

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Reject Modal ───────────────────────────────────────────────────
function RejectModal({ payment, onClose, onDone }) {
  const [reason, setReason]   = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await api.patch(`/admin/payments/${payment._id}/reject`, { reason });
      toast.success("Payment rejected. Resident notified.");
      onDone(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <XCircle size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Reject Payment</h3>
        <p className="text-sm text-gray-500 mb-4">
          Reject payment from <span className="font-medium text-gray-700">{payment.residentId?.name}</span>?
          Resident will be notified with your reason.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason for rejection (e.g. Invalid transaction ID)…"
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none
            focus:outline-none focus:ring-2 focus:ring-red-200 mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handle} disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-60">
            {loading ? "Rejecting…" : "Reject & Notify"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────
function DetailModal({ payment, onClose, onVerify, onReject }) {
  const resident = payment.residentId;
  const VIcon    = VERIFICATION_ICON[payment.verificationStatus] || Clock;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Payment Details</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {[
            ["Resident", `${resident?.name} · ${resident?.wing ? resident.wing + "-" : ""}${resident?.flatNumber}`],
            ["Period",   `${MONTHS[(payment.month || 1) - 1]} ${payment.year}`],
            ["Amount",   formatCurrency(payment.amount)],
            ["Mode",     MODE_LABEL[payment.paymentMode] || payment.paymentMode],
            ["Txn ID",   payment.transactionId || "—"],
            ["Date",     formatDate(payment.paymentDate)],
            ["Source",   payment.submittedBy === "user" ? "Resident (Self)" : "Admin"],
            ["Note",     payment.note || "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-gray-400">{k}</span>
              <span className="font-medium text-gray-800 text-right max-w-[60%]">{v}</span>
            </div>
          ))}

          <div className="flex justify-between text-sm pt-1">
            <span className="text-gray-400">Status</span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full
              ${VERIFICATION_STYLE[payment.verificationStatus]}`}>
              <VIcon size={11} />
              {VERIFICATION_LABEL[payment.verificationStatus]}
            </span>
          </div>

          {payment.verificationStatus === "rejected" && payment.rejectionReason && (
            <div className="bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">
              <span className="font-medium">Rejection reason:</span> {payment.rejectionReason}
            </div>
          )}
        </div>

        {payment.verificationStatus === "pending_verification" && (
          <div className="px-6 pb-5 flex gap-3">
            <button onClick={() => { onVerify(payment); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm
                font-medium bg-green-500 text-white hover:bg-green-600">
              <CheckCircle2 size={15} /> Verify & Complete
            </button>
            <button onClick={() => { onReject(payment); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm
                font-medium bg-red-500 text-white hover:bg-red-600">
              <XCircle size={15} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function AdminPayments() {
  const [payments, setPayments]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("pending_verification"); // default: show pending first
  const [filterMode, setFilterMode] = useState("");
  const [modal, setModal]           = useState(null);

  const [stats, setStats] = useState({ total: 0, totalCollected: 0, pendingCount: 0 });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)       params.search             = search;
      if (filterStatus) params.verificationStatus = filterStatus;
      if (filterMode)   params.paymentMode        = filterMode;

      const { data } = await api.get("/admin/payments", { params });
      setPayments(data.payments);
      setStats({ total: data.total, totalCollected: data.totalCollected, pendingCount: data.pendingCount });
    } catch {
      toast.error("Failed to load payments");
    } finally { setLoading(false); }
  }, [search, filterStatus, filterMode]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleVerify = async (payment) => {
    try {
      await api.patch(`/admin/payments/${payment._id}/verify`);
      toast.success("Payment verified! Resident notified via app & email.");
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <AdminLayout pageTitle="Payment Tracking">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Payments",     value: stats.total,                         icon: CreditCard,   color: "bg-blue-50 text-blue-600"   },
          { label: "Total Collected",    value: formatCurrency(stats.totalCollected), icon: IndianRupee,  color: "bg-green-50 text-green-600" },
          { label: "Pending Verify",     value: stats.pendingCount,                  icon: Clock,        color: "bg-amber-50 text-amber-600" },
          { label: "Verified",           value: stats.total - stats.pendingCount,    icon: BadgeCheck,   color: "bg-purple-50 text-purple-600" },
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

      {/* Pending verification alert */}
      {stats.pendingCount > 0 && filterStatus !== "pending_verification" && (
        <div className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">{stats.pendingCount} payment{stats.pendingCount > 1 ? "s" : ""}</span> waiting for your verification.
          </p>
          <button onClick={() => setFilterStatus("pending_verification")}
            className="ml-auto text-xs font-semibold text-amber-700 underline">
            View Now
          </button>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-5 border-b border-gray-100">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by resident, flat, txn ID…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin" />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Status</option>
              <option value="pending_verification">Pending Verify</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={filterMode} onChange={e => setFilterMode(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30 bg-white">
              <option value="">All Modes</option>
              {Object.entries(MODE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading payments…</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">No payments found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Resident", "Period", "Amount", "Mode", "Txn ID", "Date", "Source", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const resident = p.residentId;
                  const VIcon    = VERIFICATION_ICON[p.verificationStatus] || Clock;
                  return (
                    <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      {/* Resident */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-admin/10 flex items-center justify-center
                            text-admin text-xs font-bold flex-shrink-0">
                            {resident?.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{resident?.name || "—"}</p>
                            <p className="text-xs text-gray-400">{resident?.wing ? resident.wing + "-" : ""}{resident?.flatNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <CalendarDays size={13} className="text-gray-400" />
                          {MONTHS[(p.month || 1) - 1]?.slice(0, 3)} {p.year}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-700">{MODE_LABEL[p.paymentMode] || p.paymentMode}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500 font-mono">{p.transactionId || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-700">{formatDate(p.paymentDate)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${p.submittedBy === "user" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                          {p.submittedBy === "user" ? "Resident" : "Admin"}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full
                          ${VERIFICATION_STYLE[p.verificationStatus]}`}>
                          <VIcon size={11} />
                          {VERIFICATION_LABEL[p.verificationStatus]}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setModal({ type: "detail", data: p })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-admin hover:bg-admin/5 transition-all"
                            title="View Details">
                            <Eye size={15} />
                          </button>
                          {p.verificationStatus === "pending_verification" && (
                            <>
                              <button onClick={() => handleVerify(p)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition-all"
                                title="Verify">
                                <CheckCircle2 size={15} />
                              </button>
                              <button onClick={() => setModal({ type: "reject", data: p })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                title="Reject">
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          <button onClick={async () => {
                              if (!window.confirm("Delete this payment record?")) return;
                              try { await api.delete(`/admin/payments/${p._id}`); toast.success("Deleted."); fetchPayments(); }
                              catch { toast.error("Failed to delete"); }
                            }}
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
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {payments.length} record{payments.length !== 1 ? "s" : ""} · Total Collected: {formatCurrency(stats.totalCollected)}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "detail" && (
        <DetailModal
          payment={modal.data}
          onClose={() => setModal(null)}
          onVerify={(p) => { setModal(null); handleVerify(p); }}
          onReject={(p) => setModal({ type: "reject", data: p })}
        />
      )}
      {modal?.type === "reject" && (
        <RejectModal payment={modal.data} onClose={() => setModal(null)} onDone={fetchPayments} />
      )}
    </AdminLayout>
  );
}