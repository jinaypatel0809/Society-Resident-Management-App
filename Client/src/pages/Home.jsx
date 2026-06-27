import { Link } from "react-router-dom";
import {
  ShieldCheck, Home, Users, IndianRupee, Receipt,
  Bell, MessageSquareWarning, BarChart3, CheckCircle,
  ArrowRight, Building2, Star, Zap,
} from "lucide-react";

const FEATURES = [
  { icon: Users,                title: "Resident Management",    desc: "Add, edit and manage all residents and flat owners from one place." },
  { icon: IndianRupee,          title: "Maintenance Collection", desc: "Generate bills, track payments and send auto reminders." },
  { icon: Receipt,              title: "Receipt Generation",     desc: "Instant PDF receipts for every payment with one click." },
  { icon: Bell,                 title: "Smart Notifications",    desc: "Email alerts for payments, complaints and announcements." },
  { icon: MessageSquareWarning, title: "Complaint Tracking",     desc: "Residents raise complaints, admin resolves them with status updates." },
  { icon: BarChart3,            title: "Reports & Analytics",    desc: "Monthly collection reports, occupancy stats and payment history." },
];

const STATS = [
  { value: "500+", label: "Societies" },
  { value: "50k+", label: "Residents" },
  { value: "99%",  label: "Uptime" },
  { value: "24/7", label: "Support" },
];

const WHY = [
  "No complicated setup — ready in minutes",
  "Separate portals for Admin and Residents",
  "Secure JWT-based authentication",
  "Mobile-friendly responsive design",
  "Real-time payment & complaint tracking",
  "PDF receipt generation built-in",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-admin flex items-center justify-center">
              <Building2 size={16} className="text-admin-gold" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">SocietyMS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5"
            >
              Resident Login
            </Link>
            <Link
              to="/admin/signin"
              className="text-sm font-semibold bg-admin text-admin-gold px-4 py-2 rounded-xl hover:bg-admin-light transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-admin-dark via-admin to-admin-light">
        {/* decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-admin-gold/10" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-admin-gold/20 border border-admin-gold/30 text-admin-gold text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Zap size={12} /> Smart Society Management Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Manage Your Society<br />
            <span className="text-admin-gold">Smarter & Faster</span>
          </h1>

          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            One platform for admins to manage residents, collect maintenance, generate receipts
            and track complaints — and for residents to pay dues, view history and stay informed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/admin/signup"
              className="flex items-center gap-2 bg-admin-gold hover:bg-admin-gold-light text-admin-dark font-bold
                px-7 py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-admin-gold/20 hover:scale-[1.02]"
            >
              <ShieldCheck size={17} /> Get Started as Admin
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold
                px-7 py-3.5 rounded-2xl transition-all text-sm"
            >
              <Home size={17} /> Resident Sign Up
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{value}</p>
                <p className="text-white/50 text-sm mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-admin text-xs font-bold uppercase tracking-widest">Features</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Everything You Need</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              From maintenance collection to complaint resolution — SocietyMS covers it all in one clean dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-11 h-11 rounded-xl bg-admin/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-admin" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two Portals ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-admin text-xs font-bold uppercase tracking-widest">Portals</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Two Separate Portals</h2>
            <p className="text-gray-500 mt-3 text-sm">One for admins, one for residents. Each with its own secure login.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Admin Portal */}
            <div className="relative overflow-hidden rounded-3xl bg-admin-dark p-8 text-white">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-admin-gold/10 translate-x-12 -translate-y-12" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-admin-gold/20 flex items-center justify-center mb-5">
                  <ShieldCheck size={22} className="text-admin-gold" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Admin Portal</h3>
                <p className="text-white/50 text-sm mb-6 leading-relaxed">
                  Full control over your society — manage residents, collect dues, generate receipts and send announcements.
                </p>
                <ul className="space-y-2 mb-8">
                  {["Manage residents & flats","Generate maintenance bills","Verify payments & receipts","Send notifications","View reports"].map(t => (
                    <li key={t} className="flex items-center gap-2.5 text-sm text-white/70">
                      <CheckCircle size={14} className="text-admin-gold shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3">
                  <Link to="/admin/signin"
                    className="flex items-center gap-2 bg-admin-gold text-admin-dark font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition">
                    Sign In <ArrowRight size={15} />
                  </Link>
                  <Link to="/admin/signup"
                    className="flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-white/20 transition">
                    Register
                  </Link>
                </div>
              </div>
            </div>

            {/* Resident Portal */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-resident-dark to-resident p-8 text-white">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 translate-x-12 -translate-y-12" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-5">
                  <Home size={22} className="text-resident-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Resident Portal</h3>
                <p className="text-white/50 text-sm mb-6 leading-relaxed">
                  Simple, clean dashboard for residents — pay maintenance, download receipts, raise complaints and stay updated.
                </p>
                <ul className="space-y-2 mb-8">
                  {["View maintenance dues","Pay online with proof","Download PDF receipts","Raise & track complaints","Get society notifications"].map(t => (
                    <li key={t} className="flex items-center gap-2.5 text-sm text-white/70">
                      <CheckCircle size={14} className="text-resident-accent shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3">
                  <Link to="/signin"
                    className="flex items-center gap-2 bg-white text-resident-dark font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition">
                    Sign In <ArrowRight size={15} />
                  </Link>
                  <Link to="/signup"
                    className="flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-white/20 transition">
                    Register
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Why SocietyMS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="text-admin text-xs font-bold uppercase tracking-widest">Why Us</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-4">
                Built for Modern Housing Societies
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                SocietyMS is designed from the ground up for Indian housing societies — simple enough
                for any admin, powerful enough for large complexes.
              </p>
              <ul className="space-y-3">
                {WHY.map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-admin/10 flex items-center justify-center shrink-0">
                      <CheckCircle size={12} className="text-admin" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* visual card stack */}
            <div className="relative h-72 hidden lg:block">
              <div className="absolute top-0 left-8 right-8 bg-white rounded-2xl border border-gray-100 shadow p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <IndianRupee size={15} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Payment Received</p>
                    <p className="text-[11px] text-gray-400">Flat A-101 · Just now</p>
                  </div>
                  <span className="ml-auto text-sm font-bold text-green-600">₹1,500</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className="h-1.5 bg-green-500 rounded-full w-[92%]" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">92% collected this month</p>
              </div>

              <div className="absolute top-28 left-0 right-0 bg-admin-dark rounded-2xl p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/50 text-xs">Total Collection — June 2026</p>
                    <p className="text-white text-2xl font-extrabold mt-1">₹1,84,000</p>
                  </div>
                  <div className="text-right">
                    <p className="text-admin-gold text-xs font-semibold">↑ 8% vs last month</p>
                    <p className="text-white/30 text-[11px] mt-0.5">122 / 140 paid</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-8 right-8 bg-white rounded-2xl border border-gray-100 shadow p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <MessageSquareWarning size={15} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-700">New Complaint — Water Leakage</p>
                  <p className="text-[11px] text-gray-400">Flat B-203 · High priority</p>
                </div>
                <span className="text-[10px] bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">Open</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-admin-dark">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-admin-gold text-admin-gold" />)}
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to Modernize Your Society?
          </h2>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Join hundreds of housing societies already using SocietyMS to simplify management.
            Free to get started — no credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/admin/signup"
              className="flex items-center gap-2 bg-admin-gold hover:opacity-90 text-admin-dark font-bold
                px-8 py-3.5 rounded-2xl transition-all text-sm shadow-lg hover:scale-[1.02]">
              <ShieldCheck size={17} /> Create Admin Account
            </Link>
            <Link to="/signup"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white
                font-semibold px-8 py-3.5 rounded-2xl transition-all text-sm">
              <Home size={17} /> Register as Resident
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-admin flex items-center justify-center">
              <Building2 size={13} className="text-admin-gold" />
            </div>
            <span className="text-white font-bold text-sm">SocietyMS</span>
          </div>
          <p className="text-gray-500 text-xs">© {new Date().getFullYear()} SocietyMS. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/signin"       className="text-gray-500 hover:text-white text-xs transition-colors">Resident Login</Link>
            <Link to="/admin/signin" className="text-gray-500 hover:text-white text-xs transition-colors">Admin Login</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}