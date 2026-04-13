import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, FolderOpen, User, LogOut } from "lucide-react";
import useAuthStore from "../store/authStore";
import useSocket from "../hooks/useSocket";
import useSyncEvents from "../hooks/useSyncEvents";

const navItems = [
  { to: "/client/dashboard", icon: LayoutDashboard, label: "Overview",  end: true },
  { to: "/client/invoices",  icon: FileText,         label: "Invoices" },
  { to: "/client/projects",  icon: FolderOpen,       label: "Projects" },
  { to: "/client/profile",   icon: User,             label: "Profile" },
];

const ClientLayout = () => {
  const { logout } = useAuthStore();
  const navigate   = useNavigate();
  useSocket();
  useSyncEvents();

  return (
    <div className="flex min-h-screen bg-dark-bg text-slate-100">
      <aside className="w-60 shrink-0 flex flex-col border-r border-dark-border bg-dark-surface">
        <div className="h-16 flex items-center px-6 border-b border-dark-border">
          <span className="font-bold text-lg tracking-tight text-white">
            Skillora <span className="text-cyan-400 text-xs font-semibold ml-1">CLIENT</span>
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                 ${isActive ? "bg-brand/15 text-brand" : "text-slate-400 hover:bg-dark-muted hover:text-white"}`
              }>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-dark-border">
          <button onClick={async () => { await logout(); navigate("/login"); }}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
};

export default ClientLayout;
