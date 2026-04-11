import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, CheckCircle } from "lucide-react";
import api from "../../services/api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const { token }   = useParams();
  const navigate    = useNavigate();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      toast.success("Password reset successfully");
      setTimeout(() => navigate("/login"), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary dark:bg-dark-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-ink dark:text-slate-100">Skillora</span>
        </div>

        {done ? (
          <div className="card text-center">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={22} className="text-success" />
            </div>
            <h2 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Password reset!</h2>
            <p className="text-sm text-ink-secondary">Redirecting you to sign in...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink dark:text-slate-100 mb-1">Set new password</h1>
            <p className="text-sm text-ink-secondary mb-7">Choose a strong password for your account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="New password" type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} required size="lg"
                suffix={
                  <button type="button" onClick={() => setShowPw((s) => !s)}
                    className="text-ink-muted hover:text-ink transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                } />
              <Button type="submit" className="w-full" size="lg" loading={loading}>Reset password</Button>
            </form>
            <Link to="/login" className="flex items-center justify-center mt-5 text-sm text-ink-secondary hover:text-ink transition-colors">
              Back to sign in
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
