import { useEffect, useState } from "react";
import * as clientPortalService from "../../services/clientPortalService";
import toast from "react-hot-toast";

const ClientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({ name: "", phone: "", company: "" });
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    clientPortalService.getProfile().then(r => {
      const c = r.data.data.client;
      setProfile(c);
      setForm({ name: c.name || "", phone: c.phone || "", company: c.company || "" });
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clientPortalService.updateProfile(form);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-white mb-6">Your Profile</h1>
      <div className="card">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input w-full" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="input w-full" />
          </div>
          <div>
            <label className="label">Company</label>
            <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              className="input w-full" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClientProfile;
