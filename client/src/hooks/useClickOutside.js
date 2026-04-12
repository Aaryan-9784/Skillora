import { useEffect, useCallback } from "react";

/**
 * useClickOutside
 *
 * Fires `callback` when the user clicks or touches outside `ref`.
 * Optionally also fires on Escape key press.
 *
 * @param {React.RefObject} ref       - ref attached to the element to watch
 * @param {Function}        callback  - function to call on outside click
 * @param {Object}          options
 * @param {boolean}         options.enabled   - toggle the listener (default true)
 * @param {boolean}         options.escKey    - also close on Escape (default true)
 */
const useClickOutside = (ref, callback, { enabled = true, escKey = true } = {}) => {
  // Stable callback reference — avoids re-registering listeners on every render
  const stableCallback = useCallback(callback, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handlePointer = (e) => {
      // Ignore if click is inside the ref element or its children
      if (!ref.current || ref.current.contains(e.target)) return;
      stableCallback(e);
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") stableCallback(e);
    };

    // Use mousedown + touchstart for instant response (before click fires)
    document.addEventListener("mousedown",  handlePointer);
    document.addEventListener("touchstart", handlePointer, { passive: true });
    if (escKey) document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown",  handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      if (escKey) document.removeEventListener("keydown", handleEsc);
    };
  }, [ref, stableCallback, enabled, escKey]);
};

export default useClickOutside;
