import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import Spinner from "./Spinner";

/**
 * ProtectedRoute — blocks unauthenticated access.
 *
 * While isLoading is true (fetchMe in flight on first load),
 * we show a spinner instead of immediately redirecting.
 * This prevents a flash-redirect when the user has a valid refresh token.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Show spinner only for protected routes while session is being restored
  if (isLoading) {
    return <Spinner size="lg" className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
