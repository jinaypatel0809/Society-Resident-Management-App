import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, Mail, Lock, DoorOpen,
  Receipt, CreditCard, History, Bell, FileText, ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import InputField from "../../components/common/InputField";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const FEATURES = [
  { icon: CreditCard, text: "Pay maintenance fees online" },
  { icon: Receipt,    text: "Download payment receipts" },
  { icon: History,    text: "View full payment history" },
  { icon: Bell,       text: "Get due date reminders" },
  { icon: FileText,   text: "Access society notices" },
];

export default function UserSignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]           = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [isAdmin, setIsAdmin]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) { toast.error("Email is required"); return; }
    if (!password.trim()) { toast.error("Password is required"); return; }

    setLoading(true);

    try {
      const payload = { email: email.trim(), password };
      if (flatNumber.trim()) payload.flatNumber = flatNumber.trim();

      const { data } = await api.post("/auth/signin", payload);

      if (data.role === "admin") {
        login(data.admin, "admin", data.token);
        toast.success(`Welcome back, ${data.admin.firstName}!`);
        navigate("/admin/dashboard", { replace: true });
      } else {
        login(data.user, "user", data.token);
        toast.success(`Welcome, ${data.user.name}!`);
        navigate("/user/dashboard", { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";

      // Server says flat number needed → show flat field
      if (msg.toLowerCase().includes("flat number")) {
        setIsAdmin(false);
        toast.error("Please enter your flat number");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between bg-resident-dark p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-resident-light translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-resident translate-x-[-30%] translate-y-[30%]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-resident-light/20 flex items-center justify-center">
              <Home size={22} className="text-resident-accent" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">SocietyMS</span>
          </div>
          <span className="text-resident-accent text-xs font-semibold uppercase tracking-widest">Portal</span>
          <h1 className="text-white text-3xl font-bold mt-2 leading-tight">
            Your Home,<br />Your Dashboard
          </h1>
          <p className="text-white/50 text-sm mt-3 leading-relaxed">
            Access your maintenance records, pay dues, and stay connected with your society.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-resident-light/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-resident-accent" />
                </div>
                <span className="text-white/60 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs leading-relaxed">
            Residents: enter email + flat number. Admins: enter email only.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Home size={20} className="text-resident" />
            <span className="font-semibold text-gray-800">SocietyMS</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1">
                Sign in to your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                theme="resident"
              />

              <InputField
                label="Flat / Unit Number"
                placeholder="e.g. A-101  (Admins can leave blank)"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                icon={DoorOpen}
                theme="resident"
              />

              <InputField
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                theme="resident"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl font-semibold text-sm
                  bg-resident text-white hover:bg-resident-dark
                  active:scale-[0.99] transition-all duration-150 disabled:opacity-60
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Home size={16} />
                )}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div className="mt-5 p-3 rounded-xl bg-gray-50 border border-gray-100 flex gap-2 items-start">
              <ShieldCheck size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-500">Admins:</strong> leave flat number blank — you'll go to admin dashboard automatically.
              </p>
            </div>

            <p className="text-center text-xs text-gray-400 mt-5">
              New resident?{" "}
              <Link to="/signup" className="text-resident font-medium hover:underline">
                Register here
              </Link>
              {" · "}
              <Link to="/admin/signup" className="text-admin font-medium hover:underline">
                Admin signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}