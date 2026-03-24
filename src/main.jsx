// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// ເພີ່ມ Font ພາສາລາວແບບ Global ແລະ ແກ້ໄຂບັນຫາ Input
const style = document.createElement("style");
style.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@300;400;500;600;700;900&display=swap');
  body, input, button, select, textarea {
    font-family: 'Noto Sans Lao', sans-serif !important;
  }
  
  /* --- ເພີ່ມສ່ວນນີ້ເພື່ອແກ້ໄຂບັນຫາ Input ຊະນິດ Date ຍືດນອກຂອບໃນມືຖື --- */
  input[type="date"] {
    max-width: 100% !important; /* ບັງຄັບບໍ່ໃຫ້ກວ້າງເກີນກ່ອງທີ່ຫຸ້ມມັນໄວ້ */
    width: 100% !important;     /* ໃຫ້ກວ້າງເຕັມກ່ອງພໍດີ */
    box-sizing: border-box !important; /* ໃຫ້ນັບລວມ padding ແລະ border ເຂົ້າໃນຄວາມກວ້າງ */
    display: block !important;
    -webkit-appearance: none; /* ປິດຮູບແບບດັ້ງເດີມຂອງ Safari ເພື່ອໃຫ້ຄວບຄຸມໄດ້ງ່າຍຂຶ້ນ */
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
