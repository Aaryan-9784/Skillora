import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import useSyncStore from "../store/syncStore";

const POLL_INTERVAL_MS = 30000; // 30 seconds

/**
 * Hook to manage automatic background refresh & tab visibility revalidation.
 */
export const useAutoRefresh = () => {
  const location = useLocation();
  const { triggerRefresh, isRefreshing, lastRefreshedAt, isOnline, setOnline } = useSyncStore();
  const timerRef = useRef(null);

  const refreshNow = useCallback(() => {
    return triggerRefresh(true, location.pathname);
  }, [triggerRefresh, location.pathname]);

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      triggerRefresh(true, location.pathname);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline, triggerRefresh, location.pathname]);

  // Visibility and window focus listeners (SWR-like revalidation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh(false, location.pathname);
      }
    };

    const handleFocus = () => {
      triggerRefresh(false, location.pathname);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [triggerRefresh, location.pathname]);

  // Gentle periodic background timer (only active while tab is visible)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        triggerRefresh(false, location.pathname);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [triggerRefresh, location.pathname]);

  return {
    refreshNow,
    isRefreshing,
    lastRefreshedAt,
    isOnline,
  };
};

export default useAutoRefresh;
