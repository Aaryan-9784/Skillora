import { useEffect } from "react";
import useAuthStore from "../store/authStore";

/**
 * Convenience hook — exposes auth state and actions.
 * Also bootstraps the session on mount.
 */
const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, register, logout, fetchMe } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, isAuthenticated, isLoading, login, register, logout };
};

export default useAuth;
