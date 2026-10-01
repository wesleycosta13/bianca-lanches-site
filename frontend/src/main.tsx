import React from "react";
import ReactDOM from "react-dom/client";
import AdminPanel from "./AdminPanel";
import App from "./App";
import "./styles.css";

const currentPage = window.location.pathname.replace(/\/+$/, "") === "/admin" ? <AdminPanel /> : <App />;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {currentPage}
  </React.StrictMode>,
);