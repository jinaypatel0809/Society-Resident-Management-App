import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, Mail, Lock, User,
  Building2, Phone, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import InputField from "../../components/common/InputField";
import api from "../../utils/api";

const STEPS = ["Account Info", "Society Details", "Security"];

export default function AdminSignUp() {
  const navigate = useNavigate();

  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    societyName: "", societyAddress: "", totalFlats: "",
    password: "", confirmPassword: "",
  });

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: "" }));
  };

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!form.firstName) errs.firstName = "Required";
      if (!form.lastName)  errs.lastName  = "Required";
      if (!form.email)     errs.email     = "Required";
      if (!form.phone)     errs.phone     = "Required";
    }
    if (step === 1) {
      if (!form.societyName)    errs.societyName    = "Required";
      if (!form.societyAddress) errs.societyAddress = "Required";
      if (!form.totalFlats)     errs.totalFlats     = "Required";
    }
    if (step === 2) {
      if (!form.password)                              errs.password = "Required";
      else if (form.password.length < 8)               errs.password = "Min 8 characters";
      if (form.password !== form.confirmPassword)      errs.confirmPassword = "Passwords do not match";
    }
    return errs;
  };

  const next = () => {
    const errs = validateStep();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.post("/auth/admin/signup", form);
      toast.success("Admin account created! Please sign in.");
      navigate("/admin/signin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between bg-admin-dark p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-admin-gold translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-admin-gold/20 flex items-center justify-center">
              <ShieldCheck size={22} className="text-admin-gold" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">SocietyMS</span>
          </div>

          <span className="text-admin-gold text-xs font-semibold uppercase tracking-widest">Admin Registration</span>
          <h1 className="text-white text-3xl font-bold mt-2 leading-tight">
            Set Up Your<br />Society Portal
          </h1>
          <p className="text-white/50 text-sm mt-3 leading-relaxed">
            Register your society and start managing residents, dues, and communications in minutes.
          </p>

          {/* Step indicators */}
          <div className="mt-10 space-y-3">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${i < step  ? "bg-admin-gold text-admin-dark"
                  : i === step ? "bg-admin-gold/20 border border-admin-gold text-admin-gold"
                               : "bg-white/10 text-white/30"}`}>
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className={`text-sm ${i <= step ? "text-white" : "text-white/30"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs leading-relaxed">
            Your data is encrypted and securely stored. Society admin credentials are managed exclusively by your organization.
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <ShieldCheck size={20} className="text-admin" />
            <span className="font-semibold text-gray-800">SocietyMS — Admin Setup</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Step progress (mobile) */}
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-admin" : "bg-gray-200"}`} />
              ))}
            </div>

            <div className="mb-6">
              <p className="text-xs font-semibold text-admin uppercase tracking-widest">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{STEPS[step]}</h2>
            </div>

            <form onSubmit={step < 2 ? (e) => { e.preventDefault(); next(); } : handleSubmit} className="space-y-4">
              {/* Step 0 — Account Info */}
              {step === 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="First Name" placeholder="Ramesh" value={form.firstName}
                      onChange={set("firstName")} icon={User} error={errors.firstName} theme="admin" required />
                    <InputField label="Last Name" placeholder="Patel" value={form.lastName}
                      onChange={set("lastName")} icon={User} error={errors.lastName} theme="admin" required />
                  </div>
                  <InputField label="Email Address" type="email" placeholder="admin@society.com"
                    value={form.email} onChange={set("email")} icon={Mail} error={errors.email} theme="admin" required />
                  <InputField label="Phone Number" type="tel" placeholder="9876543210"
                    value={form.phone} onChange={set("phone")} icon={Phone} error={errors.phone} theme="admin" required />
                </>
              )}

              {/* Step 1 — Society Details */}
              {step === 1 && (
                <>
                  <InputField label="Society Name" placeholder="Shyam Nagar Co-op Society"
                    value={form.societyName} onChange={set("societyName")} icon={Building2}
                    error={errors.societyName} theme="admin" required />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Society Address <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      placeholder="123, Park Street, Ahmedabad - 380001"
                      value={form.societyAddress}
                      onChange={set("societyAddress")}
                      rows={3}
                      className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-gray-800
                        placeholder-gray-400 resize-none transition-all duration-150
                        ${errors.societyAddress ? "border-red-400" : "border-gray-200"} input-admin`}
                    />
                    {errors.societyAddress && <p className="text-xs text-red-500">{errors.societyAddress}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total Flats / Units <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.totalFlats}
                      onChange={set("totalFlats")}
                      className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-gray-800
                        transition-all duration-150
                        ${errors.totalFlats ? "border-red-400" : "border-gray-200"} input-admin`}
                    >
                      <option value="">Select range</option>
                      {["1–20","21–50","51–100","101–200","200+"].map((v) => (
                        <option key={v} value={v}>{v} flats</option>
                      ))}
                    </select>
                    {errors.totalFlats && <p className="text-xs text-red-500">{errors.totalFlats}</p>}
                  </div>
                </>
              )}

              {/* Step 2 — Security */}
              {step === 2 && (
                <>
                  <InputField label="Create Password" type="password" placeholder="Min 8 characters"
                    value={form.password} onChange={set("password")} icon={Lock}
                    error={errors.password} theme="admin" required />
                  <InputField label="Confirm Password" type="password" placeholder="Repeat password"
                    value={form.confirmPassword} onChange={set("confirmPassword")} icon={Lock}
                    error={errors.confirmPassword} theme="admin" required />
                  <div className="bg-admin/5 border border-admin/20 rounded-xl p-3 text-xs text-admin/70 leading-relaxed">
                    By creating an account you agree to manage resident data responsibly and in accordance with society rules.
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-1">
                {step > 0 && (
                  <button type="button" onClick={() => setStep((s) => s - 1)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium
                      text-gray-600 hover:bg-gray-50 transition-all">
                    Back
                  </button>
                )}
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm
                    bg-admin text-admin-gold hover:bg-admin-light
                    active:scale-[0.99] transition-all disabled:opacity-60
                    flex items-center justify-center gap-2">
                  {loading
                    ? <span className="w-4 h-4 border-2 border-admin-gold border-t-transparent rounded-full animate-spin" />
                    : null}
                  {loading ? "Creating…" : step < 2 ? "Continue →" : "Create Admin Account"}
                </button>
              </div>
            </form>

            <p className="text-center text-xs text-gray-400 mt-5">
              Already registered?{" "}
              <Link to="/admin/signin" className="text-admin font-medium hover:underline">Sign in</Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Are you a resident?{" "}
            <Link to="/signup" className="text-resident font-medium hover:underline">Resident Portal →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
