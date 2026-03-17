import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App.jsx";
import "./index.css";
import { registerSW } from "./core/pwa/registerSW.js";

// Register Service Worker for PWA / offline-first
registerSW();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
