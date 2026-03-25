// src/components/common/Header.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Menu, User, Calendar } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function Header({ setSidebarOpen }) {
  const location = useLocation();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState("");

  // ດຶງວັນທີປັດຈຸບັນມາສະແດງ (Format: DD/MM/YYYY)
  useEffect(() => {
    const today = new Date();
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    setCurrentDate(today.toLocaleDateString("en-GB", options));
  }, []);

  // ຟັງຊັ໋ນສຳລັບກຳນົດຊື່ໜ້າ ຕາມ URL ປັດຈຸບັນ
  const getPageTitle = (path) => {
    if (path === "/") return "ໜ້າຫຼັກ (Dashboard)";
    if (path.includes("/fuel/history")) return "ປະຫວັດການເຕີມ";
    if (path.includes("/fuel/add") || path.includes("/fuel/edit"))
      return "ບັນທຶກໃສ່ນ້ຳມັນ";
    if (path.includes("/fuel/report")) return "ລາຍງານການເຕີມນ້ຳມັນ";

    // ເມນູໂລເຄຊັ໋ນຮ້ານຄ້າ
    if (path.includes("/location/map")) return "ແຜນທີ່ຮ້ານຄ້າ";
    if (path.includes("/location/route")) return "ຄົ້ນຫາເສັ້ນທາງ";
    if (path.includes("/location/list")) return "ລາຍຊື່ຮ້ານຄ້າ";
    if (path.includes("/location/add") || path.includes("/location/edit"))
      return "ຈັດການຂໍ້ມູນຮ້ານຄ້າ";

    // ເມນູອື່ນໆ
    if (path.includes("/users")) return "ການຈັດການຜູ້ໃຊ້ງານ";

    return "ລະບົບບັນທຶກການຕື່ມນ້ຳມັນ";
  };

  return (
    <header className="bg-orange-500 text-white h-16 flex items-center justify-between px-4 md:px-6 shadow-sm sticky top-0 z-20 font-lao">
      <div className="flex items-center">
        {/* ປຸ່ມ Menu ສຳລັບມືຖື */}
        <button
          onClick={() => setSidebarOpen && setSidebarOpen(true)}
          className="lg:hidden mr-3 p-1.5 hover:bg-orange-600 rounded-lg transition"
        >
          <Menu size={24} />
        </button>

        {/* ຊື່ໜ້າປັດຈຸບັນ */}
        <h2 className="text-base md:text-xl font-bold truncate">
          {getPageTitle(location.pathname)}
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* ສ່ວນທີ່ສະແດງວັນທີ */}
        <div className="flex items-center gap-1.5 bg-orange-600/50 border border-orange-400/50 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium shadow-inner">
          <Calendar size={16} className="text-orange-100" />
          <span className="hidden sm:inline text-orange-50">ວັນທີ: </span>
          <span className="font-bold">{currentDate}</span>
        </div>

        {/* ສ່ວນສະແດງຂໍ້ມູນຜູ້ໃຊ້ */}
        <div className="hidden md:flex flex-col items-end border-l border-orange-400 pl-4 ml-1">
          <span className="text-sm font-bold">{user?.name || "ພະນັກງານ"}</span>
          <span className="text-[10px] bg-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
            {user?.role || "user"}
          </span>
        </div>

        <div className="w-8 h-8 md:w-10 md:h-10 bg-white text-orange-500 rounded-full flex items-center justify-center font-bold shadow-inner">
          <User size={20} />
        </div>
      </div>
    </header>
  );
}
