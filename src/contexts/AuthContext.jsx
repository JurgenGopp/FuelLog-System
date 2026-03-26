// src/contexts/AuthContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";

// --- ກຳນົດສິດການເຂົ້າເຖິງເມນູຂອງແຕ່ລະ Role ---
export const roleMenuAccess = {
  admin: [
    "dashboard",
    "form",
    "list",
    "report",
    "users",
    "locationMap",
    "locationList",
    "locationForm",
    "locationRoute",
  ],
  user: ["dashboard", "form", "list", "report", "locationMap", "locationRoute"],
  driver: ["form", "list", "locationMap", "locationRoute"],
  partner: ["dashboard", "report"],
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("fuelAppUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // --- ສ່ວນທີ່ເພີ່ມໃໝ່: ລະບົບ Auto Logout ---
  const timerRef = useRef(null);
  const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 ຊົ່ວໂມງ

  const logout = () => {
    setUser(null);
    localStorage.removeItem("fuelAppUser");
    // ດີດກັບໄປໜ້າ login ໂດຍກົງ
    window.location.href = "/login";
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (user) {
      timerRef.current = setTimeout(logout, INACTIVITY_LIMIT);
    }
  };

  useEffect(() => {
    // ລາຍຊື່ Event ທີ່ຖືວ່າເປັນການເຄື່ອນໄຫວ
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    if (user) {
      // ເລີ່ມນັບເວລາເມື່ອມີການ Login
      resetTimer();

      // ສ້າງ Event Listener
      events.forEach((event) => {
        window.addEventListener(event, resetTimer);
      });
    }

    return () => {
      // Clear ທຸກຢ່າງເມື່ອ Logout ຫຼື ປິດ Component
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);
  // ------------------------------------------

  useEffect(() => {
    if (user) {
      localStorage.setItem("fuelAppUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("fuelAppUser");
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData);
  };

  const hasAccess = (menuKey) => {
    return (
      user &&
      roleMenuAccess[user.role] &&
      roleMenuAccess[user.role].includes(menuKey)
    );
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
