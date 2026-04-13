import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import Spinner from "./Spinner";

const ClientRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <Spinner size="lg" className="min-h-screen" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== "client") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ClientRoute;
