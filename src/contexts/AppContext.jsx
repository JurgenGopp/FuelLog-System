import React, { createContext, useState, useEffect } from "react";
import { API_URL, roleMenuAccess } from "../utils/helpers";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("fuelAppUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [usersList, setUsersList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: "",
    onConfirm: null,
    type: "delete",
  });

  const hasAccess = (menuKey) => {
    return (
      user &&
      roleMenuAccess[user.role] &&
      roleMenuAccess[user.role].includes(menuKey)
    );
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const confirmAction = (message, onConfirm, type = "delete") => {
    setConfirmDialog({ show: true, message, onConfirm, type });
  };

  const closeConfirm = () => {
    setConfirmDialog({
      show: false,
      message: "",
      onConfirm: null,
      type: "delete",
    });
  };

  const callApi = async (payload) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return { success: false, message: "ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້." };
    }
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    const res = await callApi({ action: "getData" });
    if (res.success) {
      setCars(res.cars || []);
      setLogs(res.logs || []);
      setUsersList(res.users || []);
    } else {
      showToast(res.message || "ບໍ່ສາມາດດຶງຂໍ້ມູນໄດ້", "error");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) loadInitialData();
  }, [user]);

  const visibleCars =
    user?.role === "admin"
      ? cars
      : cars.filter((c) => (user?.assignedCars || []).includes(c));
  const visibleLogs =
    user?.role === "admin"
      ? logs
      : logs.filter((log) =>
          (user?.assignedCars || []).includes(log.licensePlate),
        );

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        usersList,
        setUsersList,
        logs,
        setLogs,
        cars,
        visibleLogs,
        visibleCars,
        isLoading,
        setIsLoading,
        toast,
        showToast,
        confirmDialog,
        confirmAction,
        closeConfirm,
        callApi,
        loadInitialData,
        hasAccess,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
