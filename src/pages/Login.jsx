// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { callApi } from "../api/config";

import LOGO_URL from "/Logo_P&P.jpg";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const username = e.target.username.value;
    const password = e.target.password.value;

    const res = await callApi({ action: "login", username, password });

    if (res.success && res.user) {
      login(res.user);

      // --- ແກ້ໄຂ: ກວດສອບ Role ກ່ອນ Redirect ---
      if (res.user.role === "driver") {
        navigate("/fuel/add"); // ຖ້າເປັນ Driver ໃຫ້ໄປໜ້າບັນທຶກເຕີມນ້ຳມັນ
      } else {
        navigate("/dashboard"); // ຖ້າເປັນ Admin, User ໃຫ້ໄປໜ້າ Dashboard
      }
    } else {
      setError(res.message || "ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ");
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-orange-500 animate-in zoom-in-95 duration-300">
      <div className="flex justify-center mb-5 md:mb-6">
        <img
          src={LOGO_URL}
          alt="Logo"
          className="h-16 md:h-20 object-contain rounded-lg"
          onError={(e) => {
            e.target.onerror = null;
            e.target.alt = "P&P Logo";
          }}
        />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800 mb-6 md:mb-8 font-lao">
        ເຂົ້າສູ່ລະບົບ - ລະບົບບັນທຶກການຕື່ມນ້ຳມັນ
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded font-lao">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 md:space-y-5 font-lao">
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
            ຊື່ຜູ້ໃຊ້
          </label>
          <input
            name="username"
            type="text"
            required
            className="w-full h-[40px] md:h-[48px] px-3 md:px-4 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition text-sm md:text-base box-border"
          />
        </div>
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
            ລະຫັດຜ່ານ
          </label>
          <input
            name="password"
            type="password"
            required
            className="w-full h-[40px] md:h-[48px] px-3 md:px-4 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition text-sm md:text-base box-border"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[40px] md:h-[48px] bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-lg md:rounded-xl transition shadow-md text-sm md:text-base mt-2 flex justify-center items-center"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "ເຂົ້າສູ່ລະບົບ"
          )}
        </button>
      </form>
    </div>
  );
}
