import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import useAuthStore from "../../store/authStore";

const planOrder = { free: 0, pro: 1, premium: 2 };

const PlanGate = ({ requires, children }) => {
  const { user } = useAuthStore();
  const userLevel = planOrder[user?.plan] ?? 0;
  const minLevel  = planOrder[requires]   ?? 0;

  if (userLevel >= minLevel) return children;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3
                      bg-dark-bg/80 backdrop-blur-sm rounded-xl">
        <div className="w-12 h-12 rounded-full bg-brand/15 flex items-center justify-center">
          <Lock size={20} className="text-brand" />
        </div>
        <p className="text-sm font-semibold text-white">
          Requires {requires.charAt(0).toUpperCase() + requires.slice(1)} plan
        </p>
        <Link to="/settings?tab=billing" className="btn-primary btn-sm">
          Upgrade now
        </Link>
      </div>
    </div>
  );
};

export default PlanGate;
