import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";
import CommandPalette from "../components/ui/CommandPalette";
import GlobalSearch from "../components/ui/GlobalSearch";
import FloatingAiButton from "../components/ai/FloatingAiButton";

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen]     = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const isAiPage = location.pathname.startsWith("/ai");

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen((o) => !o); }
      if ((e.metaKey || e.ctrlKey) && e.key === "p") { e.preventDefault(); setCmdOpen((o) => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080E1A" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden"
           style={{ background: "linear-gradient(135deg, #0B1120 0%, #0D1526 100%)" }}>
        <Navbar onCommandPalette={() => setSearchOpen(true)} />
        <motion.main key="main" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 overflow-y-auto">
          <Outlet />
        </motion.main>
      </div>
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      {!isAiPage && <FloatingAiButton />}
    </div>
  );
};

export default DashboardLayout;
