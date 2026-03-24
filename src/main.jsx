// src/main.jsx (ສຳລັບ Vite) ຫຼື src/index.js (ສຳລັບ CRA)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // ໄຟລ໌ Tailwind CSS ຂອງທ່ານ

// ເພີ່ມ Font ພາສາລາວແບບ Global
const style = document.createElement("style");
style.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@300;400;500;600;700;900&display=swap');
  body, input, button, select, textarea {
    font-family: 'Noto Sans Lao', sans-serif !important;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
