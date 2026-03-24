// src/layouts/AuthLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "../components/common/Footer";

export default function AuthLayout() {
  return (
    <div className="h-screen w-full bg-orange-50 flex flex-col items-center justify-between font-lao">
      <div className="flex-1 flex items-center justify-center p-4 w-full">
        {/* <Outlet /> ຈະຖືກແທນທີ່ດ້ວຍ Component ຂອງໜ້າ Login ຕອນເຮົາຕັ້ງຄ່າ Route */}
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
