// src/components/common/Footer.jsx
import React from "react";

import LOGO_URL from "/Logo_P&P.jpg"; // ປັບ Path ໃຫ້ເຂົ້າກັບໂຄງສ້າງໃໝ່ (ເກັບຮູບໄວ້ໃນ folder public/assets)

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-gray-200 py-3 md:py-4 flex-shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs md:text-sm text-gray-500 font-lao">
        <div className="flex items-center space-x-2 mb-1 md:mb-0">
          <img
            src={LOGO_URL}
            alt="Logo"
            className="h-5 md:h-6 object-contain rounded"
            onError={(e) => {
              e.target.onerror = null;
              e.target.alt = "P&P Logo";
            }}
          />
          <span className="font-bold text-gray-700">
            P AND P Trading Export-Import Co., Ltd
          </span>
          <span>© {currentYear}</span>
        </div>
        <div className="text-center md:text-right">
          <p>
            ພັດທະນາໂດຍ:{" "}
            <span className="font-semibold text-orange-600">
              K. VANSOUANSENGPHET
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
