// src/components/common/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  Fuel,
  History,
  BarChart3,
  Map,
  Route,
  Store,
  MapPin,
  Users,
  User,
  LogOut,
  Truck, // <-- ເພີ່ມໄອຄອນ Truck ສຳລັບໂລໂກ້
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useAlert } from "../../contexts/AlertContext";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout, hasAccess } = useAuth();
  const navigate = useNavigate();

  const alertContext = useAlert();
  const showConfirm =
    alertContext?.showConfirm ||
    ((msg, onConfirm) => {
      if (window.confirm(msg)) onConfirm();
    });

  const handleLogout = () => {
    showConfirm(
      "ທ່ານຕ້ອງການອອກຈາກລະບົບແທ້ບໍ່?",
      () => {
        logout();
        navigate("/login");
      },
      "warning",
    );
  };

  const navLinkClass = ({ isActive }) =>
    `w-full flex items-center space-x-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition text-sm md:text-base ${
      isActive
        ? "bg-orange-100 text-orange-600 font-semibold"
        : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"
    }`;

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-[300px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 md:static md:inset-0 flex flex-col font-lao`}
    >
      {/* --- ສ່ວນຫົວ: ໂລໂກ້ ແລະ ຊື່ລະບົບ --- */}
      <div className="flex items-center justify-between h-16 px-4 md:px-6 bg-orange-500 text-white flex-shrink-0 w-full">
        <div className="flex items-center space-x-2 font-bold min-w-0 flex-1 pr-2">
          {/* ເພີ່ມໂລໂກ້ລົດບັນທຸກຢູ່ບ່ອນນີ້ */}
          <Truck className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
          <span className="text-sm md:text-lg truncate">
            ລະບົບການຈັດການ ການຂົນສົ່ງ
          </span>
        </div>
        <button
          className="md:hidden shrink-0 p-1 bg-orange-600 hover:bg-orange-700 rounded-md transition"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-3 md:px-4 py-4 md:py-6 space-y-1.5 md:space-y-2 overflow-y-auto">
        {hasAccess("dashboard") && (
          <NavLink
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5" />{" "}
            <span>ໜ້າຫຼັກ</span>
          </NavLink>
        )}
        {hasAccess("form") && (
          <NavLink
            to="/fuel/add"
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <Fuel className="w-4 h-4 md:w-5 md:h-5" />{" "}
            <span>ບັນທຶກໃສ່ນ້ຳມັນ</span>
          </NavLink>
        )}
        {hasAccess("list") && (
          <NavLink
            to="/fuel/history"
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <History className="w-4 h-4 md:w-5 md:h-5" />{" "}
            <span>ປະຫວັດການເຕີມ</span>
          </NavLink>
        )}
        {hasAccess("report") && (
          <NavLink
            to="/fuel/report"
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />{" "}
            <span>ລາຍງານການເຕີມນ້ຳມັນ</span>
          </NavLink>
        )}

        {/* --- ໂລເຄຊັ໋ນຮ້ານຄ້າ --- */}
        {hasAccess("locationMap") && (
          <div className="pt-3 md:pt-4 mt-3 md:mt-4 border-t border-gray-100">
            <p className="px-3 md:px-4 text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              ໂລເຄຊັ໋ນຮ້ານຄ້າລູກຄ້າ
            </p>
            <NavLink
              to="/location/map"
              onClick={() => setSidebarOpen(false)}
              className={navLinkClass}
            >
              <Map className="w-4 h-4 md:w-5 md:h-5" />{" "}
              <span>ແຜນທີ່ຮ້ານຄ້າ</span>
            </NavLink>
            {hasAccess("locationRoute") && (
              <NavLink
                to="/location/route"
                onClick={() => setSidebarOpen(false)}
                className={navLinkClass}
              >
                <Route className="w-4 h-4 md:w-5 md:h-5" />{" "}
                <span>ຄົ້ນຫາເສັ້ນທາງ</span>
              </NavLink>
            )}
            {hasAccess("locationList") && (
              <NavLink
                to="/location/list"
                onClick={() => setSidebarOpen(false)}
                className={navLinkClass}
              >
                <Store className="w-4 h-4 md:w-5 md:h-5" />{" "}
                <span>ລາຍຊື່ຮ້ານຄ້າ</span>
              </NavLink>
            )}
            {hasAccess("locationForm") && (
              <NavLink
                to="/location/add"
                onClick={() => setSidebarOpen(false)}
                className={navLinkClass}
              >
                <MapPin className="w-4 h-4 md:w-5 md:h-5" />{" "}
                <span>ເພີ່ມຮ້ານຄ້າໃໝ່</span>
              </NavLink>
            )}
          </div>
        )}

        {/* --- ສໍາລັບຜູ້ດູແລ --- */}
        {hasAccess("users") && (
          <div className="pt-3 md:pt-4 mt-3 md:mt-4 border-t border-gray-100">
            <p className="px-3 md:px-4 text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              ສໍາລັບຜູ້ດູແລ
            </p>
            <NavLink
              to="/users"
              onClick={() => setSidebarOpen(false)}
              className={navLinkClass}
            >
              <Users className="w-4 h-4 md:w-5 md:h-5" />{" "}
              <span>ຈັດການຜູ້ໃຊ້ງານ</span>
            </NavLink>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4 border-t border-gray-100 bg-white flex-shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 bg-gray-50 rounded-xl mb-2 border border-gray-100">
          <div className="bg-orange-100 p-1.5 md:p-2 rounded-full flex-shrink-0">
            <User className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-gray-800 truncate">{user?.name}</p>
            <p className="text-[10px] md:text-xs text-orange-600 font-semibold uppercase">
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-2.5 md:py-3 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl transition shadow-sm text-sm md:text-base h-[40px] md:h-[48px]"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" /> <span>ອອກຈາກລະບົບ</span>
        </button>
      </div>
    </div>
  );
}
