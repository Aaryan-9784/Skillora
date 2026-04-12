/**
 * useCommandPalette
 *
 * Manages open/close state and the global Cmd+K / Ctrl+K shortcut.
 * Import this hook wherever you need to control the palette.
 *
 * Usage:
 *   const { isOpen, open, close, toggle } = useCommandPalette();
 */

import { useState, useEffect, useCallback } from "react";

const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open   = useCallback(() => setIsOpen(true),  []);
  const close  = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((o) => !o), []);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  return { isOpen, open, close, toggle };
};

export default useCommandPalette;
