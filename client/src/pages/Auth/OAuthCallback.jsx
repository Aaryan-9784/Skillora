import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";

/**
 * Handles the redirect from backend after OAuth.
 * Backend redirects to: /oauth/callback#token=<accessToken>
 * We read the token from the URL fragment, store in memory, then redirect.
 */
const OAuthCallback = () => {
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const { handleOAuthToken } = useAuthStore();
  const handled   = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const error = params.get("error");
    if (error) {
      toast.error("OAuth sign-in failed. Please try again.");
      navigate("/login", { replace: true });
      return;
    }

    const fragment   = window.location.hash.slice(1);
    const tokenParam = new URLSearchParams(fragment).get("token");

    if (!tokenParam) {
      toast.error("Authentication failed. No token received.");
      navigate("/login", { replace: true });
      return;
    }

    // Clear token from URL immediately
    window.history.replaceState(null, "", window.location.pathname);

    handleOAuthToken(tokenParam).then((ok) => {
      if (ok) navigate("/dashboard", { replace: true });
      else {
        toast.error("Failed to complete sign-in. Please try again.");
        navigate("/login", { replace: true });
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface-secondary dark:bg-dark-bg">
      <Spinner size="lg" />
      <p className="text-sm text-ink-secondary">Completing sign-in...</p>
    </div>
  );
};

export default OAuthCallback;
