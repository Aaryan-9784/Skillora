import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";
import useThemeStore from "./store/themeStore";

// Auto-recover if a new deployment replaces asset chunk hashes
window.addEventListener("vite:preloadError", (event) => {
  console.warn("New build deployed, reloading for latest chunks...", event);
  window.location.reload();
});

window.addEventListener("error", (e) => {
  const msg = e?.message || "";
  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Failed to load module script") ||
    msg.includes("Strict MIME type checking")
  ) {
    const lastReload = sessionStorage.getItem("app_chunk_reload");
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 8000) {
      sessionStorage.setItem("app_chunk_reload", String(now));
      window.location.reload();
    }
  }
});

// Apply persisted theme before first paint
useThemeStore.getState().init();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
