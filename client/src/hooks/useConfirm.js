import { useState, useCallback } from "react";

/**
 * Simple confirm dialog hook.
 * Returns { confirm, ConfirmDialog } — render ConfirmDialog in JSX.
 */
const useConfirm = () => {
  const [state, setState] = useState({ open: false, resolve: null, message: "" });

  const confirm = useCallback((message = "Are you sure?") =>
    new Promise((resolve) => setState({ open: true, resolve, message })),
  []);

  const handleClose = (result) => {
    state.resolve?.(result);
    setState({ open: false, resolve: null, message: "" });
  };

  return { confirm, confirmState: state, handleClose };
};

export default useConfirm;
