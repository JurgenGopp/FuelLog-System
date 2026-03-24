// src/layouts/MainLayout.jsx
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isMapPage = location.pathname === "/location/map";

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden font-lao relative">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/50">
        <Header setSidebarOpen={setSidebarOpen} />

        {/* ສ່ວນເນື້ອຫາ: ປັບ flex ໃຫ້ຍືດເຕັມພື້ນທີ່ */}
        <main
          className={`flex-1 overflow-y-auto flex flex-col ${isMapPage ? "p-0" : "p-2.5 sm:p-4 lg:p-8"}`}
        >
          <div
            className={`flex-1 ${isMapPage ? "w-full flex flex-col relative" : "max-w-6xl mx-auto w-full pb-6 md:pb-8"}`}
          >
            <Outlet />
          </div>
        </main>

        {/* ເອົາເງື່ອນໄຂ !isMapPage ອອກ ເພື່ອໃຫ້ Footer ສະແດງທຸກໜ້າ */}
        <Footer />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm transition-all"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
