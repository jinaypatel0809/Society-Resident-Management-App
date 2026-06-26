import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import InputField from "../../components/common/InputField";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { User, Building2, Lock, Save, ShieldCheck } from "lucide-react";

function ProfileForm() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName:      user?.firstName || "",
    lastName:       user?.lastName  || "",
    phone:          user?.phone     || "",
    societyName:    user?.societyName    || "",
    societyAddress: user?.societyAddress || "",
    totalFlats:     user?.totalFlats     || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim() ||
        !form.societyName.trim() || !form.societyAddress.trim() || !String(form.totalFlats).trim()) {
      toast.error("Please fill all fields.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put("/auth/admin/profile", form);
      updateUser(data.admin);
      toast.success(data.message || "Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-admin-gold/15 flex items-center justify-center">
          <User size={18} className="text-admin-gold" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Profile Information</h3>
          <p className="text-xs text-gray-400">Your personal and society details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="First Name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required theme="admin" />
        <InputField label="Last Name"  value={form.lastName}  onChange={(e) => set("lastName", e.target.value)}  required theme="admin" />
      </div>

      <InputField label="Email" value={user?.email || ""} disabled theme="admin" />
      <p className="text-[11px] text-gray-400 -mt-3">Email cannot be changed.</p>

      <InputField label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} required theme="admin" />

      <div className="pt-2 pb-1 flex items-center gap-2">
        <Building2 size={14} className="text-gray-400" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Society Details</p>
      </div>

      <InputField label="Society Name" value={form.societyName} onChange={(e) => set("societyName", e.target.value)} required theme="admin" />
      <InputField label="Society Address" value={form.societyAddress} onChange={(e) => set("societyAddress", e.target.value)} required theme="admin" />
      <InputField label="Total Flats" value={form.totalFlats} onChange={(e) => set("totalFlats", e.target.value)} required theme="admin" />

      <div className="pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-admin text-admin-gold text-sm font-semibold
            px-5 py-2.5 rounded-xl hover:bg-admin-light transition-all disabled:opacity-60">
          <Save size={15} />
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error("Please fill all fields.");
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put("/auth/admin/change-password", {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      toast.success(data.message || "Password changed!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-admin-gold/15 flex items-center justify-center">
          <Lock size={18} className="text-admin-gold" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
          <p className="text-xs text-gray-400">Use a strong, unique password</p>
        </div>
      </div>

      <InputField label="Current Password" type="password" value={form.currentPassword}
        onChange={(e) => set("currentPassword", e.target.value)} required theme="admin" />
      <InputField label="New Password" type="password" value={form.newPassword}
        onChange={(e) => set("newPassword", e.target.value)} required theme="admin" />
      <InputField label="Confirm New Password" type="password" value={form.confirmPassword}
        onChange={(e) => set("confirmPassword", e.target.value)} required theme="admin" />

      <div className="pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-admin text-admin-gold text-sm font-semibold
            px-5 py-2.5 rounded-xl hover:bg-admin-light transition-all disabled:opacity-60">
          <ShieldCheck size={15} />
          {saving ? "Updating…" : "Update Password"}
        </button>
      </div>
    </form>
  );
}

export default function AdminSettings() {
  return (
    <AdminLayout pageTitle="Settings">
      <div className="max-w-2xl space-y-6">
        <ProfileForm />
        <PasswordForm />
      </div>
    </AdminLayout>
  );
}
