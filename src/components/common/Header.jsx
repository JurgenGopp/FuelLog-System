// src/components/common/Header.jsx
import React from "react";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { formatDateDisplay } from "../../utils/helpers";

export default function Header({ setSidebarOpen }) {
  const location = useLocation();
  const path = location.pathname;

  // ກຳນົດຊື່ໜ້າຕາມ Path ປັດຈຸບັນ
  let pageTitle = "ລະບົບບັນທຶກການຕື່ມນ້ຳມັນ";
  if (path === "/dashboard") pageTitle = "ພາບລວມລະບົບ";
  else if (path === "/fuel/add") pageTitle = "ບັນທຶກການໃສ່ນ້ຳມັນໃໝ່";
  else if (path.includes("/fuel/edit")) pageTitle = "ແກ້ໄຂຂໍ້ມູນໃສ່ນ້ຳມັນ";
  else if (path === "/fuel/history") pageTitle = "ປະຫວັດການໃສ່ນ້ຳມັນ";
  else if (path === "/fuel/report") pageTitle = "ລາຍງານການເຕີມນ້ຳມັນ";
  else if (path === "/users") pageTitle = "ການຈັດການຜູ້ໃຊ້ງານ";
  else if (path === "/location/map") pageTitle = "ແຜນທີ່ຮ້ານຄ້າລູກຄ້າ";
  else if (path === "/location/list") pageTitle = "ລາຍຊື່ຮ້ານຄ້າລູກຄ້າ";
  else if (path === "/location/add" || path.includes("/location/edit"))
    pageTitle = "ຈັດການຂໍ້ມູນສະຖານທີ່";

  return (
    <header className="h-14 md:h-16 bg-orange-500 shadow-md flex items-center justify-between px-3 md:px-4 lg:px-8 border-b border-orange-600 flex-shrink-0 z-10 text-white">
      <button
        className="md:hidden p-2 text-white hover:bg-orange-600 rounded-lg transition shrink-0"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="text-base md:text-xl font-black truncate px-2 flex-1 text-left font-lao">
        {pageTitle}
      </div>
      <div className="flex items-center space-x-2 md:space-x-4 text-xs md:text-sm font-bold text-white bg-orange-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg whitespace-nowrap shrink-0 shadow-inner font-lao">
        <span>ວັນທີ: {formatDateDisplay(new Date())}</span>
      </div>
    </header>
  );
}
