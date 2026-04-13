import { lazy, Suspense, useEffect, Component } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute  from "./components/common/ProtectedRoute";
import FreelancerRoute from "./components/common/FreelancerRoute";
import AdminRoute      from "./components/common/AdminRoute";
import ClientRoute     from "./components/common/ClientRoute";
import Spinner         from "./components/common/Spinner";
import MainLayout      from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout     from "./layouts/AdminLayout";
import ClientLayout    from "./layouts/ClientLayout";
import useAuthStore    from "./store/authStore";

// Landing + Auth
const Landing        = lazy(() => import("./pages/Landing"));
const Login          = lazy(() => import("./pages/Auth/Login"));
const Register       = lazy(() => import("./pages/Auth/Register"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const ResetPassword  = lazy(() => import("./pages/Auth/ResetPassword"));
const OAuthCallback  = lazy(() => import("./pages/Auth/OAuthCallback"));

// Freelancer
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const Projects       = lazy(() => import("./pages/Projects"));
const ProjectDetail  = lazy(() => import("./pages/Projects/ProjectDetail"));
const Tasks          = lazy(() => import("./pages/Tasks"));
const Clients        = lazy(() => import("./pages/Clients"));
const ClientDetail   = lazy(() => import("./pages/Clients/ClientDetail"));
const Payments       = lazy(() => import("./pages/Payments"));
const InvoiceBuilder = lazy(() => import("./pages/Payments/InvoiceBuilder"));
const InvoiceDetail  = lazy(() => import("./pages/Payments/InvoiceDetail"));
const Skills         = lazy(() => import("./pages/Skills"));
const AI             = lazy(() => import("./pages/AI"));
const Settings       = lazy(() => import("./pages/Settings"));

// Admin — direct imports (not lazy) to avoid HMR race condition with file writes
import AdminOverview from "./pages/Admin/overview";
import AdminUsers    from "./pages/Admin/Users";
import AdminRevenue  from "./pages/Admin/Revenue";
import AdminSettings from "./pages/Admin/Settings";

// Client Portal
const ClientDashboard = lazy(() => import("./pages/ClientPortal/Dashboard"));
const ClientInvoices  = lazy(() => import("./pages/ClientPortal/Invoices"));
const ClientProjects  = lazy(() => import("./pages/ClientPortal/Projects"));
const ClientProfile   = lazy(() => import("./pages/ClientPortal/Profile"));

const PageLoader = () => <Spinner size="lg" className="min-h-screen" />;

// Simple error boundary to catch lazy-load failures gracefully
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-3"
          style={{ background: "#060A14" }}>
          <p className="text-white font-semibold">Something went wrong loading this page.</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="text-sm px-4 py-2 rounded-lg"
            style={{ background: "rgba(99,91,255,0.2)", color: "#A78BFA", border: "1px solid rgba(99,91,255,0.3)" }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            fontSize: "13px",
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            background: "#111827",
            color: "#F1F5F9",
            border: "1px solid #1E2A3B",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,91,255,0.08)",
            padding: "12px 16px",
            maxWidth: "360px",
          },
          success: {
            iconTheme: { primary: "#10B981", secondary: "#111827" },
            style: {
              background: "#111827",
              border: "1px solid rgba(16,185,129,0.25)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.1)",
            },
          },
          error: {
            iconTheme: { primary: "#EF4444", secondary: "#111827" },
            style: {
              background: "#111827",
              border: "1px solid rgba(239,68,68,0.25)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(239,68,68,0.1)",
            },
          },
          loading: {
            iconTheme: { primary: "#635BFF", secondary: "#111827" },
            style: {
              background: "#111827",
              border: "1px solid rgba(99,91,255,0.25)",
            },
          },
          duration: 3500,
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route element={<MainLayout />}>
            <Route path="/login"                 element={<Login />} />
            <Route path="/register"              element={<Register />} />
            <Route path="/forgot-password"       element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/oauth/callback"        element={<OAuthCallback />} />
          </Route>

          {/* Freelancer dashboard */}
          <Route element={<FreelancerRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard"       element={<Dashboard />} />
              <Route path="/projects"        element={<Projects />} />
              <Route path="/projects/:id"    element={<ProjectDetail />} />
              <Route path="/tasks"           element={<Tasks />} />
              <Route path="/clients"         element={<Clients />} />
              <Route path="/clients/:id"     element={<ClientDetail />} />
              <Route path="/payments"        element={<Payments />} />
              <Route path="/payments/new"    element={<InvoiceBuilder />} />
              <Route path="/payments/:id"    element={<InvoiceDetail />} />
              <Route path="/skills"          element={<Skills />} />
              <Route path="/ai"              element={<AI />} />
              <Route path="/settings"        element={<Settings />} />
            </Route>
          </Route>

          {/* Admin dashboard */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin"           element={<AdminOverview />} />
              <Route path="/admin/users"     element={<AdminUsers />} />
              <Route path="/admin/revenue"   element={<AdminRevenue />} />
              <Route path="/admin/settings"  element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Client portal */}
          <Route element={<ClientRoute />}>
            <Route element={<ClientLayout />}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/invoices"  element={<ClientInvoices />} />
              <Route path="/client/projects"  element={<ClientProjects />} />
              <Route path="/client/profile"   element={<ClientProfile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
