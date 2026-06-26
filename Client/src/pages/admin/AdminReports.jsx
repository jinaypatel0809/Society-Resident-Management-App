import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  IndianRupee, Users, MessageSquareWarning, Home,
  TrendingUp, RefreshCw, ChevronDown, CheckCircle2,
  Clock, AlertCircle, Flame,
} from "lucide-react";

const TABS = [
  { key: "collection", label: "Collection",  icon: IndianRupee },
  { key: "residents",  label: "Residents",   icon: Users },
  { key: "complaints", label: "Complaints",  icon: MessageSquareWarning },
  { key: "occupancy",  label: "Occupancy",   icon: Home },
];

const CATEGORY_LABEL = {
  plumbing: "Plumbing", electrical: "Electrical", cleaning: "Cleaning",
  security: "Security", parking: "Parking", lift: "Lift", other: "Other",
};

const fmtAmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Reusable bits ───────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={17} />
      </div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      <p className="text-xs text-gray-600 font-medium mt-1">{label}</p>
    </div>
  );
}

function Bar({ label, value, max, color, valueLabel }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs text-gray-400">{valueLabel ?? value}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="text-center py-16">
      <Icon size={32} className="mx-auto mb-2 text-gray-200" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-16 text-gray-400 text-sm">
      <RefreshCw size={20} className="mx-auto mb-2 animate-spin opacity-50" />
      Loading report…
    </div>
  );
}

// ── 1. Collection Report ─────────────────────────────────────────────
function CollectionReport({ year, setYear }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/reports/collection", { params: { year } });
      setData(data);
    } catch {
      toast.error("Failed to load collection report");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingState />;
  if (!data) return null;

  const { monthly, summary, availableYears } = data;
  const maxBilled = Math.max(...monthly.map((m) => m.billed), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">Month-wise maintenance collection for <span className="font-semibold text-gray-700">{year}</span></p>
        <div className="relative">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm bg-white appearance-none
              focus:outline-none focus:ring-2 focus:ring-admin/30">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Billed"   value={fmtAmt(summary.totalBilled)}    icon={IndianRupee}  color="bg-blue-50 text-blue-600" />
        <StatCard label="Collected"      value={fmtAmt(summary.totalCollected)} icon={CheckCircle2} color="bg-green-50 text-green-600" sub={`${summary.collectionRate}% rate`} />
        <StatCard label="Pending"        value={fmtAmt(summary.totalPending)}   icon={Clock}        color="bg-amber-50 text-amber-600" />
        <StatCard label="Overdue"        value={fmtAmt(summary.totalOverdue)}   icon={AlertCircle}  color="bg-red-50 text-red-600" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <TrendingUp size={16} className="text-admin-light" /> Monthly Breakdown
        </h3>
        <div className="space-y-4">
          {monthly.map((m) => (
            <Bar key={m.monthNum} label={m.month}
              value={m.collected} max={maxBilled}
              valueLabel={`${fmtAmt(m.collected)} / ${fmtAmt(m.billed)}`}
              color={m.billed === 0 ? "bg-gray-200" : "bg-green-500"} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 2. Resident-wise Report ──────────────────────────────────────────
function ResidentReport({ month, year, setMonth, setYear }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/reports/residents", { params: { month, year } });
      setData(data);
    } catch {
      toast.error("Failed to load resident report");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingState />;
  if (!data) return null;

  const { rows, summary } = data;
  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const STATUS_STYLE = {
    paid: "bg-green-50 text-green-700", pending: "bg-amber-50 text-amber-700",
    pending_verification: "bg-blue-50 text-blue-700", overdue: "bg-red-50 text-red-600",
    no_bill: "bg-gray-100 text-gray-500",
  };
  const STATUS_LABEL = {
    paid: "Paid", pending: "Pending", pending_verification: "Verifying…",
    overdue: "Overdue", no_bill: "No Bill",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          Resident payment status for <span className="font-semibold text-gray-700">
            {new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <input type="month" value={`${year}-${String(month).padStart(2, "0")}`}
            onChange={(e) => { const [y, m] = e.target.value.split("-"); setYear(Number(y)); setMonth(Number(m)); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin/30" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Residents" value={summary.totalResidents} icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard label="Paid"            value={summary.paid}           icon={CheckCircle2} color="bg-green-50 text-green-600" sub={fmtAmt(summary.totalCollected)} />
        <StatCard label="Pending"         value={summary.pending}        icon={Clock} color="bg-amber-50 text-amber-600" sub={fmtAmt(summary.totalPending)} />
        <StatCard label="Overdue"         value={summary.overdue}        icon={AlertCircle} color="bg-red-50 text-red-600" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 overflow-x-auto">
          {["all", "paid", "pending", "overdue", "no_bill"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-all
                ${filter === f ? "bg-admin text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
              {f === "all" ? "All" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Users} text="No residents match this filter." />
        ) : (
          <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
            {filtered.map((r) => (
              <div key={r.residentId} className="flex items-center justify-between px-5 py-3.5 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-400">Flat {r.flat}{r.paidOn ? ` · Paid ${fmtDate(r.paidOn)}` : ""}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{fmtAmt(r.billAmount)}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 3. Complaints Report ─────────────────────────────────────────────
function ComplaintsReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/reports/complaints");
      setData(data);
    } catch {
      toast.error("Failed to load complaints report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingState />;
  if (!data) return null;

  const { byCategory, byPriority, summary } = data;
  const categoryRows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(...categoryRows.map(([, c]) => c), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Complaints" value={summary.total}        icon={MessageSquareWarning} color="bg-gray-100 text-gray-600" />
        <StatCard label="Open"              value={summary.open}         icon={AlertCircle}          color="bg-red-50 text-red-600" />
        <StatCard label="In Progress"       value={summary.inProgress}   icon={Clock}                color="bg-blue-50 text-blue-600" />
        <StatCard label="Resolved"          value={summary.resolved}     icon={CheckCircle2}          color="bg-green-50 text-green-600"
          sub={summary.avgResolutionDays != null ? `Avg ${summary.avgResolutionDays}d to resolve` : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
            <MessageSquareWarning size={16} className="text-admin-light" /> By Category
          </h3>
          {categoryRows.length === 0 ? (
            <EmptyState icon={MessageSquareWarning} text="No complaints yet." />
          ) : (
            <div className="space-y-4">
              {categoryRows.map(([cat, count]) => (
                <Bar key={cat} label={CATEGORY_LABEL[cat] || cat} value={count} max={maxCategory}
                  color="bg-admin-light" />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
            <Flame size={16} className="text-admin-light" /> By Priority
          </h3>
          <div className="space-y-4">
            <Bar label="High"   value={byPriority.high || 0}   max={summary.total || 1} color="bg-red-500" />
            <Bar label="Medium" value={byPriority.medium || 0} max={summary.total || 1} color="bg-amber-500" />
            <Bar label="Low"    value={byPriority.low || 0}    max={summary.total || 1} color="bg-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 4. Occupancy Report ──────────────────────────────────────────────
function OccupancyReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/reports/occupancy");
      setData(data);
    } catch {
      toast.error("Failed to load occupancy report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingState />;
  if (!data) return null;

  const { byWing, byType, summary } = data;
  const wingRows = Object.entries(byWing);
  const typeRows = Object.entries(byType);
  const maxWingTotal = Math.max(...wingRows.map(([, w]) => w.total), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Flats" value={summary.totalFlats}   icon={Home}         color="bg-gray-100 text-gray-600" />
        <StatCard label="Occupied"    value={summary.occupied}     icon={CheckCircle2} color="bg-green-50 text-green-600" sub={`${summary.occupancyRate}% occupancy`} />
        <StatCard label="Vacant"      value={summary.vacant}       icon={AlertCircle}  color="bg-amber-50 text-amber-600" />
        <StatCard label="Maintenance" value={summary.maintenance}  icon={Clock}        color="bg-blue-50 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
            <Home size={16} className="text-admin-light" /> By Wing
          </h3>
          {wingRows.length === 0 ? (
            <EmptyState icon={Home} text="No flats added yet." />
          ) : (
            <div className="space-y-4">
              {wingRows.map(([wing, w]) => (
                <Bar key={wing} label={`Wing ${wing}`} value={w.occupied} max={maxWingTotal}
                  valueLabel={`${w.occupied}/${w.total} occupied`}
                  color="bg-green-500" />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
            <Home size={16} className="text-admin-light" /> By Flat Type
          </h3>
          {typeRows.length === 0 ? (
            <EmptyState icon={Home} text="No flats added yet." />
          ) : (
            <div className="space-y-4">
              {typeRows.map(([type, count]) => (
                <Bar key={type} label={type} value={count} max={Math.max(...typeRows.map(([, c]) => c), 1)}
                  color="bg-admin-light" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function AdminReports() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState("collection");
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  return (
    <AdminLayout pageTitle="Reports">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Society Reports</h2>
        <p className="text-gray-400 text-sm mt-0.5">Insights into collections, residents, complaints and occupancy.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
              ${activeTab === key ? "bg-admin text-white" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {activeTab === "collection" && <CollectionReport year={year} setYear={setYear} />}
      {activeTab === "residents"  && <ResidentReport month={month} year={year} setMonth={setMonth} setYear={setYear} />}
      {activeTab === "complaints" && <ComplaintsReport />}
      {activeTab === "occupancy"  && <OccupancyReport />}
    </AdminLayout>
  );
}
