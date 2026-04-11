import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowLeft, Mail } from "lucide-react";
import useAuthStore from "../../store/authStore";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent]   = useState(false);
  const { forgotPassword, isLoading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { success } = await forgotPassword(email);
    if (success) setSent(true);
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

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card text-center">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Mail size={22} className="text-success" />
            </div>
            <h2 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Check your email</h2>
            <p className="text-sm text-ink-secondary mb-6">
              If <strong>{email}</strong> is registered, you&apos;ll receive a reset link shortly.
            </p>
            <Link to="/login">
              <Button variant="secondary" className="w-full">Back to sign in</Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink dark:text-slate-100 mb-1">Forgot password?</h1>
            <p className="text-sm text-ink-secondary mb-7">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email address" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required size="lg" />
              <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                Send reset link
              </Button>
            </form>
            <Link to="/login" className="flex items-center justify-center gap-1.5 mt-5 text-sm text-ink-secondary hover:text-ink transition-colors">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
