import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import * as clientPortalService from "../../services/clientPortalService";
import useAuthStore from "../../store/authStore";
import tokenStore from "../../services/tokenStore";
import toast from "react-hot-toast";

const AcceptInvite = () => {
  const [searchParams]    = useSearchParams();
  const token             = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const { setUser }       = useAuthStore();
  const navigate          = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 8)  return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      const { data } = await clientPortalService.acceptInvite({ token, password });
      tokenStore.set(data.data.accessToken);
      setUser(data.data.user);
      toast.success("Account activated! Welcome.");
      navigate("/client/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired invite link");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <p className="text-red-400">Invalid invite link — no token found.</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand/15 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Set your password</h1>
          <p className="text-slate-400 text-sm">Create a password to activate your client portal account.</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <input type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full" placeholder="Min 8 characters" required />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input w-full" placeholder="Repeat password" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Activating…" : "Activate Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
