// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";

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
  ],
  user: ["dashboard", "form", "list", "report", "locationMap"],
  driver: ["form", "list", "locationMap"],
  partner: ["dashboard", "report"],
};

// ສ້າງ Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // ດຶງຂໍ້ມູນຜູ້ໃຊ້ຈາກ LocalStorage ຕອນໂຫຼດໜ້າເວັບ
    const savedUser = localStorage.getItem("fuelAppUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ອັບເດດ LocalStorage ທຸກຄັ້ງທີ່ state ຂອງ user ປ່ຽນແປງ
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

  const logout = () => {
    setUser(null);
  };

  // ຟັງຊັ໋ນກວດສອບສິດການເຂົ້າເຖິງ
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

// Custom Hook ສຳລັບເອີ້ນໃຊ້ AuthContext ໄດ້ງ່າຍຂຶ້ນ
export const useAuth = () => {
  return useContext(AuthContext);
};
