import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, Mail, Lock, User,
  Phone, DoorOpen, Users, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import InputField from "../../components/common/InputField";
import api from "../../utils/api";

export default function UserSignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    flatNumber: "", wing: "", floor: "",
    ownerType: "owner",
    password: "", confirmPassword: "",
  });

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name)            errs.name            = "Full name is required";
    if (!form.email)           errs.email           = "Email is required";
    if (!form.phone)           errs.phone           = "Mobile number is required";
    if (!form.flatNumber)      errs.flatNumber      = "Flat number is required";
    if (!form.password)        errs.password        = "Password is required";
    else if (form.password.length < 8)
                               errs.password        = "Min 8 characters";
    if (form.password !== form.confirmPassword)
                               errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.post("/auth/user/signup", form);
      toast.success("Registration successful! Please sign in.");
      navigate("/signin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between bg-resident-dark p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-resident-light translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-resident-light/20 flex items-center justify-center">
              <Home size={22} className="text-resident-accent" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">SocietyMS</span>
          </div>

          <span className="text-resident-accent text-xs font-semibold uppercase tracking-widest">Resident Registration</span>
          <h1 className="text-white text-3xl font-bold mt-2 leading-tight">
            Join Your<br />Society Online
          </h1>
          <p className="text-white/50 text-sm mt-3 leading-relaxed">
            Register to access your personalized dashboard, pay dues online, and stay updated with society notices.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: CheckCircle2, text: "Pay maintenance fees from anywhere" },
              { icon: CheckCircle2, text: "Get instant payment receipts" },
              { icon: CheckCircle2, text: "Receive due date reminders automatically" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <Icon size={16} className="text-resident-accent mt-0.5 shrink-0" />
                <span className="text-white/60 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs leading-relaxed">
            Your registration is reviewed by the society admin before activation. You'll be notified via email or SMS.
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Home size={20} className="text-resident" />
            <span className="font-semibold text-gray-800">SocietyMS — Resident Registration</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Resident Account</h2>
              <p className="text-gray-500 text-sm mt-1">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User size={12} /> Personal Info
                </p>
                <div className="space-y-3">
                  <InputField label="Full Name" placeholder="Ramesh Patel"
                    value={form.name} onChange={set("name")} icon={User}
                    error={errors.name} theme="resident" required />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Email" type="email" placeholder="you@email.com"
                      value={form.email} onChange={set("email")} icon={Mail}
                      error={errors.email} theme="resident" required />
                    <InputField label="Mobile" type="tel" placeholder="9876543210"
                      value={form.phone} onChange={set("phone")} icon={Phone}
                      error={errors.phone} theme="resident" required />
                  </div>
                </div>
              </div>

              {/* Flat Info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <DoorOpen size={12} /> Flat Details
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <InputField label="Flat No." placeholder="101"
                      value={form.flatNumber} onChange={set("flatNumber")} icon={DoorOpen}
                      error={errors.flatNumber} theme="resident" required />
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Wing</label>
                      <select value={form.wing} onChange={set("wing")}
                        className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                          text-gray-800 transition-all input-resident">
                        <option value="">Select</option>
                        {["A","B","C","D","E"].map((w) => (
                          <option key={w} value={w}>Wing {w}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Floor</label>
                      <select value={form.floor} onChange={set("floor")}
                        className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                          text-gray-800 transition-all input-resident">
                        <option value="">Select</option>
                        {["Ground","1st","2nd","3rd","4th","5th+"].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Users size={11} /> Resident Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "owner",  label: "Owner" },
                        { value: "tenant", label: "Tenant / Renter" },
                      ].map(({ value, label }) => (
                        <label key={value}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm
                            transition-all
                            ${form.ownerType === value
                              ? "border-resident bg-resident/5 text-resident font-medium"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                          <input type="radio" name="ownerType" value={value}
                            checked={form.ownerType === value} onChange={set("ownerType")} className="sr-only" />
                          <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center
                            ${form.ownerType === value ? "border-resident" : "border-gray-300"}`}>
                            {form.ownerType === value && (
                              <span className="w-1.5 h-1.5 rounded-full bg-resident block" />
                            )}
                          </span>
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Lock size={12} /> Set Password
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Password" type="password" placeholder="Min 8 characters"
                    value={form.password} onChange={set("password")} icon={Lock}
                    error={errors.password} theme="resident" required />
                  <InputField label="Confirm Password" type="password" placeholder="Repeat"
                    value={form.confirmPassword} onChange={set("confirmPassword")} icon={Lock}
                    error={errors.confirmPassword} theme="resident" required />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl font-semibold text-sm
                  bg-resident text-white hover:bg-resident-dark
                  active:scale-[0.99] transition-all disabled:opacity-60
                  flex items-center justify-center gap-2 mt-2">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : null}
                {loading ? "Registering…" : "Register as Resident"}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-5">
              Already registered?{" "}
              <Link to="/signin" className="text-resident font-medium hover:underline">Sign in here</Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Are you an admin?{" "}
            <Link to="/admin/signin" className="text-admin font-medium hover:underline">Admin Portal →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
