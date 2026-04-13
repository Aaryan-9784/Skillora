import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import useAuthStore from "../../store/authStore";
import * as clientPortalService from "../../services/clientPortalService";
import tokenStore from "../../services/tokenStore";
import toast from "react-hot-toast";

const ClientLogin = () => {
  const [form, setForm]   = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { setUser }       = useAuthStore();
  const navigate          = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await clientPortalService.clientLogin(form);
      tokenStore.set(data.data.accessToken);
      setUser(data.data.user);
      navigate("/client/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Client Portal</h1>
          <p className="text-slate-400 text-sm">Sign in to view your invoices and projects</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="email" value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input pl-9" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="password" value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input pl-9" placeholder="••••••••" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? "Signing in…" : <><span>Sign in</span><ArrowRight size={14} /></>}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          Not a client? <Link to="/login" className="text-brand hover:underline">Freelancer login</Link>
        </p>
      </div>
    </div>
  );
};

export default ClientLogin;
