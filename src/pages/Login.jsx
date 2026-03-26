// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { callApi } from "../api/config";
import { User, Lock, LogIn, AlertCircle } from "lucide-react";

import LOGO_URL from "/Logo_P&P.jpg";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. ບັງຄັບໃຫ້ພື້ນຫຼັງເຕັມຈໍ ແລະ ກຳຈັດຂອບຂາວ
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";

    // 2. ສຳຄັນ: ປ່ຽນສີພື້ນຫຼັງຂອງ Body ໃຫ້ກົງກັບສີ from-orange-400 (#fb923c)
    // ວິທີນີ້ຊ່ວຍແກ້ບັນຫາຂອບເທິງ-ລຸ່ມສີຂາວໃນ iPhone ໄດ້ 100%
    document.body.style.backgroundColor = "#fb923c";

    // 3. ປັບສີ Status Bar ຂອງມືຖື ໃຫ້ກົງກັບສີເທິງສຸດຂອງ Gradient
    const metaTheme = document.createElement("meta");
    metaTheme.name = "theme-color";
    metaTheme.content = "#fb923c"; // ປ່ຽນມາໃຊ້ສີ #fb923c ໃຫ້ກົມກືນແທ້ໆ
    document.head.appendChild(metaTheme);

    const metaApple = document.createElement("meta");
    metaApple.name = "apple-mobile-web-app-status-bar-style";
    metaApple.content = "black-translucent";
    document.head.appendChild(metaApple);

    return () => {
      // ຄືນຄ່າທັງໝົດເມື່ອອອກຈາກໜ້າ Login
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.overflow = "";
      document.body.style.backgroundColor = ""; // ລ້າງສີພື້ນຫຼັງ
      if (metaTheme.parentNode) metaTheme.parentNode.removeChild(metaTheme);
      if (metaApple.parentNode) metaApple.parentNode.removeChild(metaApple);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const username = e.target.username.value;
    const password = e.target.password.value;

    const res = await callApi({ action: "login", username, password });

    if (res.success && res.user) {
      login(res.user);
      if (res.user.role === "driver") {
        navigate("/fuel/add");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError(res.message || "ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ");
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 h-screen w-screen bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 font-lao overflow-hidden flex flex-col z-[9999]">
      {/* Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 md:w-96 md:h-96 bg-white rounded-full mix-blend-overlay filter blur-[80px] md:blur-[120px] opacity-30 animate-pulse"></div>
      <div
        className="absolute bottom-[-10%] right-[-10%] w-64 h-64 md:w-96 md:h-96 bg-orange-800 rounded-full mix-blend-multiply filter blur-[80px] md:blur-[120px] opacity-40 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* --- ສ່ວນເນື້ອຫາຫຼັກ (ກ່ອງລັອກອິນ) --- */}
      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="bg-white/70 backdrop-blur-3xl p-6 md:p-8 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.25)] w-full max-w-[360px] md:max-w-[380px] border border-white/40 animate-in zoom-in-95 duration-500">
          <div className="flex justify-center mb-5 md:mb-6">
            <div className="p-2.5 bg-white rounded-2xl shadow-md border border-gray-100">
              <img
                src={LOGO_URL}
                alt="Logo"
                className="h-14 md:h-16 object-contain rounded-lg"
              />
            </div>
          </div>

          <div className="text-center mb-6 md:mb-7">
            <h2 className="text-2xl md:text-2xl font-black text-gray-800 mb-1.5 tracking-tight uppercase">
              ຍິນດີຕ້ອນຮັບ
            </h2>
            <p className="text-xs md:text-sm text-gray-600 font-bold italic">
              ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອສືບຕໍ່
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 md:p-4 bg-red-50/90 border border-red-100 text-red-600 text-sm md:text-base rounded-2xl font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-700 ml-1 uppercase">
                ຊື່ຜູ້ໃຊ້
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="username"
                  type="text"
                  required
                  placeholder="ຊື່ຜູ້ໃຊ້"
                  className="w-full h-12 md:h-12 pl-12 pr-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm md:text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-700 ml-1 uppercase">
                ລະຫັດຜ່ານ
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-12 md:h-12 pl-12 pr-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm md:text-sm font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 md:h-12 mt-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black rounded-2xl shadow-[0_10px_20px_rgba(249,115,22,0.4)] transition-all flex justify-center items-center gap-3 text-base md:text-base uppercase"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5 md:w-5 md:h-5" />
                  <span>ເຂົ້າສູ່ລະບົບ</span>
                </>
              )}
            </button>
          </form>

          {/* --- Footer ພາຍໃນກ່ອງ: ຈັດໃຫ້ຢູ່ເຄິ່ງກາງສົມສ່ວນ --- */}
          <div className="mt-8 pt-5 border-t border-gray-100/50 flex justify-center items-center">
            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-[0.15em] text-center">
              &copy; {new Date().getFullYear()} ລະບົບຈັດການການຂົນສົ່ງ
            </p>
          </div>
        </div>
      </div>

      {/* --- Footer Main ຂອງລະບົບ --- */}
      <div className="w-full py-5 md:py-6 text-center z-20 bg-black/5 backdrop-blur-sm border-t border-white/10">
        <p className="text-xs md:text-xs text-white/90 font-bold uppercase tracking-[0.2em] flex justify-center items-center px-4">
          P And P Trading Export-Import Co.,Ltd &copy;{" "}
          {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
