// src/components/common/Header.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Calendar } from "lucide-react";

export default function Header({ setSidebarOpen }) {
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState("");

  // ດຶງວັນທີປັດຈຸບັນມາສະແດງ
  useEffect(() => {
    const today = new Date();
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    setCurrentDate(today.toLocaleDateString("en-GB", options));
  }, []);

  const getPageTitle = (path) => {
    if (path === "/") return "ໜ້າຫຼັກ (Dashboard)";
    if (path.includes("/fuel/history")) return "ປະຫວັດການເຕີມ";
    if (path.includes("/fuel/add") || path.includes("/fuel/edit"))
      return "ບັນທຶກໃສ່ນ້ຳມັນ";
    if (path.includes("/fuel/report")) return "ລາຍງານການເຕີມນ້ຳມັນ";

    if (path.includes("/location/map")) return "ແຜນທີ່ຮ້ານຄ້າ";
    if (path.includes("/location/route")) return "ຄົ້ນຫາເສັ້ນທາງ";
    if (path.includes("/location/list")) return "ລາຍຊື່ຮ້ານຄ້າ";
    if (path.includes("/location/add") || path.includes("/location/edit"))
      return "ຈັດການຂໍ້ມູນຮ້ານຄ້າ";

    if (path.includes("/users")) return "ການຈັດການຜູ້ໃຊ້ງານ";

    return "ໜ້າຫຼັກ (Dashboard)";
  };

  // --- ຟັງຊັ໋ນສຳລັບເລື່ອນໜ້າຈໍຂຶ້ນເທິງສຸດ (ອັບເດດໃໝ່ໃຫ້ຮອງຮັບທຸກ Layout) ---
  const scrollToTop = () => {
    // 1. ເລື່ອນ window ຫຼັກ
    window.scrollTo({ top: 0, behavior: "smooth" });

    // 2. ເລື່ອນ container ພາຍໃນ (ສຳລັບເວັບທີ່ໃຊ້ Layout ແບບ Fix ໜ້າຈໍ)
    const scrollableElements = document.querySelectorAll(
      ".overflow-y-auto, .overflow-auto, main",
    );
    scrollableElements.forEach((el) => {
      el.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <header
      onClick={scrollToTop}
      className="bg-orange-500 text-white h-16 flex items-center justify-between px-4 md:px-6 shadow-sm sticky top-0 z-20 font-lao active:bg-orange-600 transition-colors cursor-pointer select-none"
    >
      <div className="flex items-center">
        {/* ປຸ່ມ Menu ສຳລັບມືຖື */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // ປ້ອງກັນບໍ່ໃຫ້ການກົດປຸ່ມນີ້ ໄປເອີ້ນໃຊ້ scrollToTop
            setSidebarOpen && setSidebarOpen(true);
          }}
          className="lg:hidden mr-3 p-1.5 hover:bg-orange-600 rounded-lg transition"
        >
          <Menu size={24} />
        </button>

        {/* ຊື່ໜ້າປັດຈຸບັນ */}
        <h2 className="text-base md:text-xl font-bold truncate">
          {getPageTitle(location.pathname)}
        </h2>
      </div>

      <div
        className="flex items-center gap-3 md:gap-4"
        onClick={(e) => e.stopPropagation()} // ປ້ອງກັນເວລາກົດຖືກວັນທີແລ້ວເລື່ອນຂຶ້ນ
      >
        {/* ສ່ວນທີ່ສະແດງວັນທີພຽງຢ່າງດຽວ */}
        <div className="flex items-center gap-1.5 bg-orange-600/50 border border-orange-400/50 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium shadow-inner cursor-default">
          <Calendar size={16} className="text-orange-100" />
          <span className="hidden sm:inline text-orange-50">ວັນທີ: </span>
          <span className="font-bold">{currentDate}</span>
        </div>
      </div>
    </header>
  );
}
