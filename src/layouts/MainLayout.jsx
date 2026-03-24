// src/layouts/MainLayout.jsx
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // ຖ້າຢູ່ໜ້າແຜນທີ່ ຈະບໍ່ຕ້ອງສະແດງ padding ຫຼາຍ ແລະ ບໍ່ສະແດງ Footer
  const isMapPage = location.pathname === "/location/map";

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden font-lao relative">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/50">
        <Header setSidebarOpen={setSidebarOpen} />

        <main
          className={`flex-1 overflow-y-auto ${isMapPage ? "p-0" : "p-2.5 sm:p-4 lg:p-8"}`}
        >
          <div
            className={`${isMapPage ? "w-full h-full relative" : "max-w-6xl mx-auto w-full pb-6 md:pb-8"}`}
          >
            {/* <Outlet /> ຈະຖືກແທນທີ່ດ້ວຍ Component ຂອງໜ້າຕ່າງໆ (Dashboard, List, Form...) */}
            <Outlet />
          </div>
        </main>

        {!isMapPage && <Footer />}
      </div>

      {/* Background ສີດຳໂປ່ງໃສເວລາເປີດ Sidebar ໃນມືຖື */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm transition-all"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
