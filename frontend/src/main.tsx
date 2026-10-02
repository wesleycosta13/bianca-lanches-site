import React from "react";
import ReactDOM from "react-dom/client";
import AdminPanel from "./AdminPanel";
import App from "./App";
import "./styles.css";

// Rota do painel de administração configurada via .env (VITE_ADMIN_PATH)
const configuredAdminPath = (import.meta.env.VITE_ADMIN_PATH || "/admin").trim();
const normalizedAdminPath = (configuredAdminPath.startsWith("/") ? configuredAdminPath : `/${configuredAdminPath}`).replace(/\/+$/, "");

const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
const isCurrentAdmin = currentPath === normalizedAdminPath;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isCurrentAdmin ? <AdminPanel /> : <App />}
  </React.StrictMode>,
);