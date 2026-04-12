import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Spinner from "./components/common/Spinner";
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import useAuthStore from "./store/authStore";

// Auth
const Login          = lazy(() => import("./pages/Auth/Login"));
const Register       = lazy(() => import("./pages/Auth/Register"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const ResetPassword  = lazy(() => import("./pages/Auth/ResetPassword"));
const OAuthCallback  = lazy(() => import("./pages/Auth/OAuthCallback"));

// App
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const Projects       = lazy(() => import("./pages/Projects"));
const ProjectDetail  = lazy(() => import("./pages/Projects/ProjectDetail"));
const Tasks          = lazy(() => import("./pages/Tasks"));
const Clients        = lazy(() => import("./pages/Clients"));
const ClientDetail   = lazy(() => import("./pages/Clients/ClientDetail"));
const Payments       = lazy(() => import("./pages/Payments"));
const InvoiceBuilder = lazy(() => import("./pages/Payments/InvoiceBuilder"));
const Skills         = lazy(() => import("./pages/Skills"));
const AI             = lazy(() => import("./pages/AI"));
const Settings       = lazy(() => import("./pages/Settings"));

const PageLoader = () => <Spinner size="lg" className="min-h-screen" />;

const App = () => {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => { fetchMe(); }, []);

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
          <Route element={<MainLayout />}>
            <Route path="/login"                  element={<Login />} />
            <Route path="/register"               element={<Register />} />
            <Route path="/forgot-password"        element={<ForgotPassword />} />
            <Route path="/reset-password/:token"  element={<ResetPassword />} />
            <Route path="/oauth/callback"         element={<OAuthCallback />} />
          </Route>

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard"        element={<Dashboard />} />
              <Route path="/projects"         element={<Projects />} />
              <Route path="/projects/:id"     element={<ProjectDetail />} />
              <Route path="/tasks"            element={<Tasks />} />
              <Route path="/clients"          element={<Clients />} />
              <Route path="/clients/:id"      element={<ClientDetail />} />
              <Route path="/payments"         element={<Payments />} />
              <Route path="/payments/new"     element={<InvoiceBuilder />} />
              <Route path="/skills"           element={<Skills />} />
              <Route path="/ai"               element={<AI />} />
              <Route path="/settings"         element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
