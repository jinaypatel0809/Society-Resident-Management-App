import { useState, useEffect, useCallback } from "react";
import UserLayout from "../../components/user/UserLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  IndianRupee, CheckCircle2, Clock, AlertCircle,
  Receipt, Home, Phone, Mail, User, Building2,
  Bell, MessageSquareWarning, Plus, Send, ChevronDown,
  CalendarDays, CreditCard, Layers, X, BadgeCheck, XCircle,
  Download,
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

const STATUS_STYLE = {
  pending:              "bg-amber-50 text-amber-700",
  paid:                 "bg-green-50 text-green-700",
  overdue:              "bg-red-50 text-red-600",
  pending_verification: "bg-blue-50 text-blue-700",
};
const STATUS_LABEL = {
  pending:              "Pending",
  paid:                 "Paid",
  overdue:              "Overdue",
  pending_verification: "Verifying…",
};
const STATUS_ICON = {
  pending:              Clock,
  paid:                 CheckCircle2,
  overdue:              AlertCircle,
  pending_verification: Clock,
};

const MODE_LABEL = {
  cash: "Cash", upi: "UPI", bank_transfer: "Bank Transfer",
  cheque: "Cheque", online: "Online",
};

const NOTIF_ICON = {
  announcement:     Bell,
  payment_verified: CheckCircle2,
  payment_rejected: XCircle,
  bill_added:       IndianRupee,
  general:          Bell,
};
const NOTIF_COLOR = {
  announcement:     "bg-purple-50 text-purple-600",
  payment_verified: "bg-green-50 text-green-600",
  payment_rejected: "bg-red-50 text-red-600",
  bill_added:       "bg-blue-50 text-blue-600",
  general:          "bg-gray-100 text-gray-500",
};

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Pay Now Modal ──────────────────────────────────────────────────
function PayNowModal({ bill, onClose, onPaid }) {
  const [form, setForm] = useState({
    paymentMode: "upi",
    transactionId: "",
    note: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (form.paymentMode === "upi" && !form.transactionId.trim()) {
      toast.error("UPI Transaction ID is required.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/user/maintenance/${bill._id}/pay`, form);
      toast.success("Payment submitted! Admin will verify shortly.");
      onPaid(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit payment");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Pay Maintenance Bill</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {MONTHS[(bill.month || 1) - 1]} {bill.year} · {formatCurrency(bill.amount)}
            </p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Amount info */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-blue-700">Amount to Pay</span>
            <span className="text-lg font-bold text-blue-700">{formatCurrency(bill.amount)}</span>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Payment Mode <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select value={form.paymentMode} onChange={e => set("paymentMode", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm appearance-none
                  focus:outline-none focus:ring-2 focus:ring-resident/30 bg-white">
                {Object.entries(MODE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Transaction ID / Reference
              {form.paymentMode === "upi" && <span className="text-red-400"> *</span>}
            </label>
            <input value={form.transactionId} onChange={e => set("transactionId", e.target.value)}
              placeholder={form.paymentMode === "cash" ? "Optional for cash" : "e.g. UPI12345XYZ"}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-resident/30" />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
            <input type="date" value={form.paymentDate} onChange={e => set("paymentDate", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-resident/30" />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
            <textarea value={form.note} onChange={e => set("note", e.target.value)}
              placeholder="Any additional info for admin…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-resident/30" />
          </div>

          <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5">
            ℹ️ Your payment will be reviewed and confirmed by the admin.
            You'll receive a notification once verified.
          </p>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm
              font-medium bg-resident-dark text-white hover:opacity-90 disabled:opacity-60">
            <Send size={13} />
            {loading ? "Submitting…" : "Submit Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section: Overview ──────────────────────────────────────────────
function OverviewSection({ user, maintenance, payments, complaints, onPayNow }) {
  const pendingBills   = maintenance.filter(b => b.status === "pending" || b.status === "overdue");
  const totalDue       = pendingBills.reduce((s, b) => s + (b.amount || 0), 0);
  const lastPayment    = payments[0];
  const openComplaints = complaints.filter(c => c.status !== "resolved").length;
  const currentBill    = maintenance[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0] || "Resident"} 🏠
        </h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {user?.wing ? `Wing ${user.wing} · ` : ""}Flat {user?.flatNumber || "—"}
        </p>
      </div>

      {/* Due banner */}
      {totalDue > 0 ? (
        <div className="bg-resident rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Outstanding Due</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalDue)}</p>
            <p className="text-white/60 text-xs mt-1">{pendingBills.length} bill{pendingBills.length > 1 ? "s" : ""} pending</p>
          </div>
          {currentBill && currentBill.status !== "paid" && !currentBill.hasPendingPayment && (
            <button onClick={() => onPayNow(currentBill)}
              className="bg-white text-resident font-semibold text-sm px-5 py-2.5 rounded-xl
                hover:bg-white/90 transition-all flex items-center gap-2 flex-shrink-0">
              <IndianRupee size={14} /> Pay Now
            </button>
          )}
          {currentBill?.hasPendingPayment && (
            <span className="bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-xl">
              Verification Pending…
            </span>
          )}
        </div>
      ) : (
        <div className="bg-green-500 rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">All Dues Cleared</p>
            <p className="text-2xl font-bold mt-1">You're all paid up! ✅</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-white" />
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Due",       value: formatCurrency(totalDue),        icon: IndianRupee,          color: totalDue > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600" },
          { label: "Last Payment",    value: lastPayment ? formatCurrency(lastPayment.amount) : "—", icon: CreditCard, color: "bg-blue-50 text-blue-600" },
          { label: "Pending Bills",   value: pendingBills.length,             icon: Clock,                color: "bg-amber-50 text-amber-600" },
          { label: "Open Complaints", value: openComplaints,                  icon: MessageSquareWarning, color: openComplaints > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400" },
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

      {/* Recent bills */}
      {maintenance.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Bills</h3>
          <div className="space-y-1">
            {maintenance.slice(0, 4).map((b) => {
              const SIcon = STATUS_ICON[b.status] || Clock;
              const canPay = b.status !== "paid" && !b.hasPendingPayment;
              return (
                <div key={b._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${STATUS_STYLE[b.hasPendingPayment ? "pending_verification" : b.status]}`}>
                      <SIcon size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{MONTHS[(b.month || 1) - 1]} {b.year}</p>
                      <p className="text-xs text-gray-400">Due: {formatDate(b.dueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(b.amount)}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                        ${STATUS_STYLE[b.hasPendingPayment ? "pending_verification" : b.status]}`}>
                        {b.hasPendingPayment ? "Verifying…" : STATUS_LABEL[b.status]}
                      </span>
                    </div>
                    {canPay && (
                      <button onClick={() => onPayNow(b)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-resident-dark text-white
                          hover:opacity-90 transition-all flex-shrink-0">
                        Pay
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section: Profile ───────────────────────────────────────────────
function ProfileSection({ user }) {
  const fields = [
    { label: "Full Name",   value: user?.name,        icon: User },
    { label: "Email",       value: user?.email,       icon: Mail },
    { label: "Phone",       value: user?.phone,       icon: Phone },
    { label: "Flat Number", value: user?.flatNumber,  icon: Home },
    { label: "Wing",        value: user?.wing ? `Wing ${user.wing}` : "—", icon: Layers },
    { label: "Floor",       value: user?.floor || "—", icon: Building2 },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
        <p className="text-gray-400 text-sm mt-0.5">Your flat and contact information</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-resident-dark flex items-center justify-center
          text-resident-accent text-2xl font-bold flex-shrink-0">
          {user?.name?.[0]?.toUpperCase() || "R"}
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{user?.name || "—"}</p>
          <p className="text-sm text-gray-500">{user?.email || "—"}</p>
          <span className="inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full bg-resident/10 text-resident-dark">Resident</span>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Flat & Contact Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800 truncate">{value || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section: Maintenance ───────────────────────────────────────────
function MaintenanceSection({ maintenance, loading, onPayNow }) {
  const totalDue = maintenance.filter(b => b.status !== "paid").reduce((s, b) => s + (b.amount || 0), 0);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">My Maintenance Bills</h2>
        <p className="text-gray-400 text-sm mt-0.5">All your maintenance bills</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Bills",   value: maintenance.length,                                  color: "bg-blue-50 text-blue-600",   icon: CalendarDays },
          { label: "Paid",          value: maintenance.filter(b => b.status === "paid").length, color: "bg-green-50 text-green-600", icon: CheckCircle2 },
          { label: "Pending / Due", value: maintenance.filter(b => b.status !== "paid").length, color: "bg-amber-50 text-amber-600", icon: Clock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center mb-2`}><Icon size={15} /></div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {totalDue > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">You have <span className="font-bold">{formatCurrency(totalDue)}</span> in outstanding dues.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading bills…</div>
        ) : maintenance.length === 0 ? (
          <div className="text-center py-12">
            <IndianRupee size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-gray-400 text-sm">No maintenance bills yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {maintenance.map((b) => {
              const effectiveStatus = b.hasPendingPayment ? "pending_verification" : b.status;
              const SIcon = STATUS_ICON[effectiveStatus] || Clock;
              const canPay = b.status !== "paid" && !b.hasPendingPayment;
              return (
                <div key={b._id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${STATUS_STYLE[effectiveStatus]}`}>
                      <SIcon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{MONTHS[(b.month || 1) - 1]} {b.year}</p>
                      <p className="text-xs text-gray-400">
                        Due: {formatDate(b.dueDate)}
                        {b.paidOn ? ` · Paid: ${formatDate(b.paidOn)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(b.amount)}</p>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[effectiveStatus]}`}>
                        {b.hasPendingPayment ? "Verifying…" : STATUS_LABEL[b.status]}
                      </span>
                    </div>
                    {canPay && (
                      <button onClick={() => onPayNow(b)}
                        className="text-xs font-medium px-3 py-2 rounded-xl bg-resident-dark text-white
                          hover:opacity-90 transition-all flex-shrink-0 flex items-center gap-1.5">
                        <IndianRupee size={12} /> Pay Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section: Payments ──────────────────────────────────────────────
function PaymentsSection({ payments, loading, onDownloadReceipt, downloadingId }) {
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
        <p className="text-gray-400 text-sm mt-0.5">All your past payment records</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
          <Receipt size={20} className="text-green-600" />
        </div>
        <div>
          <p className="text-xs text-gray-400">Total Amount Paid</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-400">{payments.length} Payment{payments.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading payments…</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <Receipt size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-gray-400 text-sm">No payment records found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map((p) => {
              const verStyle = {
                verified:             "bg-green-50 text-green-700",
                pending_verification: "bg-amber-50 text-amber-700",
                rejected:             "bg-red-50 text-red-600",
              };
              const verLabel = {
                verified:             "Verified",
                pending_verification: "Pending",
                rejected:             "Rejected",
              };
              const canDownload = p.verificationStatus === "verified";
              return (
                <div key={p._id} className="flex items-center justify-between px-5 py-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                      ${verStyle[p.verificationStatus] || "bg-gray-50 text-gray-500"}`}>
                      {p.verificationStatus === "verified" ? <BadgeCheck size={16} /> :
                       p.verificationStatus === "rejected" ? <XCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {p.month && p.year ? `${MONTHS[(p.month || 1) - 1]?.slice(0, 3)} ${p.year}` : "Payment"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(p.paymentDate)} · {MODE_LABEL[p.paymentMode] || p.paymentMode}
                        {p.transactionId ? ` · ${p.transactionId}` : ""}
                      </p>
                      {p.verificationStatus === "rejected" && p.rejectionReason && (
                        <p className="text-xs text-red-500 mt-0.5">Reason: {p.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${verStyle[p.verificationStatus]}`}>
                        {verLabel[p.verificationStatus]}
                      </span>
                    </div>
                    {canDownload && (
                      <button
                        onClick={() => onDownloadReceipt(p)}
                        disabled={downloadingId === p._id}
                        title="Download Receipt"
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl
                          bg-resident-dark text-white hover:opacity-90 disabled:opacity-60 transition-all">
                        <Download size={12} />
                        {downloadingId === p._id ? "…" : "Receipt"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section: Notifications ─────────────────────────────────────────
function NotificationsSection({ notifications, unreadCount, loading, onMarkAllRead, onMarkRead }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead}
            className="text-sm text-resident-dark font-medium hover:underline">
            Mark all read
          </button>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-gray-400 text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => {
              const NIcon = NOTIF_ICON[n.type] || Bell;
              return (
                <div key={n._id}
                  onClick={() => !n.isRead && onMarkRead(n._id)}
                  className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors
                    ${!n.isRead ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-gray-50/50"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    ${NOTIF_COLOR[n.type] || "bg-gray-100 text-gray-500"}`}>
                    <NIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${!n.isRead ? "text-gray-900" : "text-gray-700"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section: Complaints ────────────────────────────────────────────
const COMPLAINT_CATEGORIES = [
  { value: "plumbing",   label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "cleaning",   label: "Cleaning" },
  { value: "security",   label: "Security" },
  { value: "parking",    label: "Parking" },
  { value: "lift",       label: "Lift" },
  { value: "other",      label: "Other" },
];

function ComplaintsSection({ complaints, loading, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ subject: "", category: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error("Subject and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/user/complaints", form);
      toast.success("Complaint submitted! Admin has been notified.");
      setForm({ subject: "", category: "", description: "" });
      setShowForm(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit complaint.");
    } finally { setSubmitting(false); }
  };

  const CSTATUS_STYLE = { open: "bg-red-50 text-red-600", "in-progress": "bg-blue-50 text-blue-700", resolved: "bg-green-50 text-green-700" };
  const CSTATUS_LABEL = { open: "Open", "in-progress": "In Progress", resolved: "Resolved" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Complaints</h2>
          <p className="text-gray-400 text-sm mt-0.5">Raise and track your complaints</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-resident-dark text-white text-sm font-medium
            px-4 py-2 rounded-xl hover:opacity-90 transition-all">
          <Plus size={15} /> New Complaint
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-800">New Complaint</p>
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Subject (e.g. Lift not working)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-resident/30" />
          <div className="relative">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-resident/30 bg-white">
              <option value="">Select category</option>
              {COMPLAINT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the issue…" rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-resident/30" />
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-resident-dark text-white hover:opacity-90 disabled:opacity-60">
              <Send size={13} />{submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquareWarning size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-gray-400 text-sm">No complaints raised yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {complaints.map((c) => {
              const catLabel = COMPLAINT_CATEGORIES.find(cat => cat.value === c.category)?.label || c.category;
              return (
                <div key={c._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.subject}</p>
                      {catLabel && <span className="text-[10px] text-gray-400 font-medium">{catLabel}</span>}
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${CSTATUS_STYLE[c.status] || "bg-gray-100 text-gray-500"}`}>
                      {CSTATUS_LABEL[c.status] || c.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{c.description}</p>
                  {c.adminNote && (
                    <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-2">
                      <span className="font-medium">Admin:</span> {c.adminNote}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{formatDate(c.createdAt)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page title map ─────────────────────────────────────────────────
const PAGE_TITLES = {
  overview:    "Dashboard",
  profile:     "My Profile",
  maintenance: "Maintenance Bills",
  payments:    "Payment History",
  notices:     "Notices",
  complaints:  "Complaints",
};

// ── Main Page ──────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user }   = useAuth();
  const [section, setSection] = useState("overview");

  const [maintenance,    setMaintenance]    = useState([]);
  const [payments,       setPayments]       = useState([]);
  const [complaints,     setComplaints]     = useState([]);
  const [notifications,  setNotifications]  = useState([]);
  const [unreadCount,    setUnreadCount]    = useState(0);

  const [loadingM, setLoadingM] = useState(true);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingC, setLoadingC] = useState(true);
  const [loadingN, setLoadingN] = useState(true);

  const [payNowBill, setPayNowBill] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchMaintenance = useCallback(async () => {
    setLoadingM(true);
    try { const { data } = await api.get("/user/maintenance"); setMaintenance(data.bills || []); }
    catch { setMaintenance([]); } finally { setLoadingM(false); }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoadingP(true);
    try {
      const { data } = await api.get("/user/payments");
      setPayments(data.payments || []);
    } catch (err) {
      setPayments([]);
      toast.error(err.response?.data?.message || "Could not load payment history.");
    } finally { setLoadingP(false); }
  }, []);

  const fetchComplaints = useCallback(async () => {
    setLoadingC(true);
    try { const { data } = await api.get("/user/complaints"); setComplaints(data.complaints || []); }
    catch { setComplaints([]); } finally { setLoadingC(false); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoadingN(true);
    try {
      const { data } = await api.get("/user/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { setNotifications([]); } finally { setLoadingN(false); }
  }, []);

  useEffect(() => {
    fetchMaintenance();
    fetchPayments();
    fetchComplaints();
    fetchNotifications();
  }, [fetchMaintenance, fetchPayments, fetchComplaints, fetchNotifications]);

  // Poll notifications every 30s for real-time feel
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/user/notifications/${id}/read`);
      setNotifications(n => n.map(x => x._id === id ? { ...x, isRead: true } : x));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/user/notifications/read-all");
      setNotifications(n => n.map(x => ({ ...x, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDownloadReceipt = async (payment) => {
    setDownloadingId(payment._id);
    try {
      const res = await api.get(`/user/receipts/${payment._id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt-${payment._id.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to download receipt.");
    } finally {
      setDownloadingId(null);
    }
  };

  const renderSection = () => {
    switch (section) {
      case "overview":
        return <OverviewSection user={user} maintenance={maintenance} payments={payments}
          complaints={complaints} onPayNow={setPayNowBill} />;
      case "profile":
        return <ProfileSection user={user} />;
      case "maintenance":
        return <MaintenanceSection maintenance={maintenance} loading={loadingM} onPayNow={setPayNowBill} />;
      case "payments":
        return <PaymentsSection payments={payments} loading={loadingP}
          onDownloadReceipt={handleDownloadReceipt} downloadingId={downloadingId} />;
      case "notices":
        return <NotificationsSection notifications={notifications} unreadCount={unreadCount}
          loading={loadingN} onMarkAllRead={handleMarkAllRead} onMarkRead={handleMarkRead} />;
      case "complaints":
        return <ComplaintsSection complaints={complaints} loading={loadingC} onRefresh={fetchComplaints} />;
      default: return null;
    }
  };

  return (
    <>
      <UserLayout
        activeSection={section}
        onSectionChange={setSection}
        pageTitle={PAGE_TITLES[section]}
        unreadCount={unreadCount}
      >
        {renderSection()}
      </UserLayout>

      {/* Pay Now Modal */}
      {payNowBill && (
        <PayNowModal
          bill={payNowBill}
          onClose={() => setPayNowBill(null)}
          onPaid={() => { fetchMaintenance(); fetchPayments(); }}
        />
      )}
    </>
  );
}