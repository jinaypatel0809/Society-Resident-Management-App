import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, BarChart3, Users, Receipt, Bell, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import InputField from "../../components/common/InputField";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const FEATURES = [
  { icon: Users,      text: "Full resident management" },
  { icon: Receipt,    text: "Receipt generation & PDF" },
  { icon: TrendingUp, text: "Payment tracking & reports" },
  { icon: Bell,       text: "Email & SMS notifications" },
  { icon: BarChart3,  text: "Analytics dashboard" },
];

export default function AdminSignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) { toast.error("Email is required"); return; }
    if (!password.trim()) { toast.error("Password is required"); return; }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/admin/signin", {
        email: email.trim(),
        password,
      });
      login(data.admin, "admin", data.token);
      toast.success(`Welcome back, ${data.admin.firstName}!`);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between bg-admin-dark p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-admin-gold translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-admin translate-x-[-30%] translate-y-[30%]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-admin-gold/20 flex items-center justify-center">
              <ShieldCheck size={22} className="text-admin-gold" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">SocietyMS</span>
          </div>
          <span className="text-admin-gold text-xs font-semibold uppercase tracking-widest">Admin Portal</span>
          <h1 className="text-white text-3xl font-bold mt-2 leading-tight">
            Society Control<br />Center
          </h1>
          <p className="text-white/50 text-sm mt-3 leading-relaxed">
            Manage your housing society with complete oversight of residents, collections, and maintenance records.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-admin-gold/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-admin-gold" />
                </div>
                <span className="text-white/60 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-4">
          <Lock size={14} className="text-white/40 shrink-0" />
          <p className="text-white/40 text-xs leading-relaxed">
            Secure admin access — credentials managed by society authority
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <ShieldCheck size={20} className="text-admin" />
            <span className="font-semibold text-gray-800">SocietyMS — Admin</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your admin dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Admin Email"
                type="email"
                placeholder="admin@society.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                theme="admin"
              />
              <InputField
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                theme="admin"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl font-semibold text-sm
                  bg-admin text-admin-gold hover:bg-admin-light
                  active:scale-[0.99] transition-all duration-150 disabled:opacity-60
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-admin-gold border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {loading ? "Signing in…" : "Sign In to Dashboard"}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Don't have an account?{" "}
              <Link to="/admin/signup" className="text-admin font-medium hover:underline">
                Create admin account
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Are you a resident?{" "}
            <Link to="/signin" className="text-resident font-medium hover:underline">
              Go to Resident Portal →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}