import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Github, Eye, EyeOff, Check, AlertCircle, CheckCircle } from "lucide-react";
import useAuthStore from "../../store/authStore";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const CHECKS = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Contains a letter",     test: (p) => /[A-Za-z]/.test(p) },
  { label: "Contains a number",     test: (p) => /\d/.test(p) },
];

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const score = CHECKS.filter((c) => c.test(password)).length;
  const colors = ["bg-error", "bg-warning", "bg-success"];
  const labels = ["Weak", "Fair", "Strong"];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0,1,2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score-1] : "bg-surface-border dark:bg-dark-border"}`} />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {CHECKS.map((c) => (
          <span key={c.label} className={`flex items-center gap-1 text-2xs transition-colors ${c.test(password) ? "text-success" : "text-ink-muted"}`}>
            <CheckCircle size={10} />{c.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const PERKS = ["Free forever plan", "No credit card required", "Cancel anytime"];

const Register = () => {
  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const { register, isLoading, errors, clearErrors } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => () => clearErrors?.(), []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { success } = await register(form);
    if (success) navigate("/dashboard");
  };

  const apiBase = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

  return (
    <div className="min-h-screen flex bg-surface-secondary dark:bg-dark-bg">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-navy p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-dark opacity-60" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-cyan/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">Skillora</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Start your freelance<br />
              <span className="text-gradient-cyan">journey today.</span>
            </h2>
            <p className="text-slate-400 mt-3 text-base">Everything you need to run a successful freelance business.</p>
          </div>
          <div className="space-y-3">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-success" />
                </div>
                <span className="text-slate-300 text-sm">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-500 text-xs">© 2025 Skillora. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-ink dark:text-slate-100">Skillora</span>
          </div>

          <h1 className="text-2xl font-bold text-ink dark:text-slate-100 mb-1">Create your account</h1>
          <p className="text-sm text-ink-secondary mb-7">Start managing your freelance work for free</p>

          {errors?.general && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error">{errors.general}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" type="text" name="name" placeholder="Jane Doe"
              value={form.name} onChange={handleChange} error={errors?.name} required size="lg" autoComplete="name" />
            <Input label="Email address" type="email" name="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange} error={errors?.email} required size="lg" autoComplete="email" />
            <div>
              <Input label="Password" type={showPw ? "text" : "password"} name="password"
                placeholder="Min. 8 characters" value={form.password} onChange={handleChange}
                error={errors?.password} required minLength={8} size="lg" autoComplete="new-password"
                suffix={
                  <button type="button" onClick={() => setShowPw((s) => !s)}
                    className="text-ink-muted hover:text-ink transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                } />
              <PasswordStrength password={form.password} />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              Create account <ArrowRight size={15} />
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border dark:border-dark-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-ink-muted bg-surface-secondary dark:bg-dark-bg">or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href={`${apiBase}/api/auth/google`}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-surface-border dark:border-dark-border bg-white dark:bg-dark-card text-sm font-medium text-ink dark:text-slate-200 hover:border-brand/40 hover:bg-surface-secondary dark:hover:bg-dark-muted transition-all shadow-xs">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </a>
            <a href={`${apiBase}/api/auth/github`}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-surface-border dark:border-dark-border bg-white dark:bg-dark-card text-sm font-medium text-ink dark:text-slate-200 hover:border-brand/40 hover:bg-surface-secondary dark:hover:bg-dark-muted transition-all shadow-xs">
              <Github size={16} className="shrink-0" />
              GitHub
            </a>
          </div>

          <p className="mt-4 text-center text-xs text-ink-muted">
            By signing up, you agree to our{" "}
            <a href="#" className="text-brand hover:underline">Terms</a> and{" "}
            <a href="#" className="text-brand hover:underline">Privacy Policy</a>.
          </p>
          <p className="mt-4 text-center text-sm text-ink-secondary">
            Already have an account?{" "}
            <Link to="/login" className="text-brand font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
