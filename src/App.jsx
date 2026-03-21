import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Menu,
  X,
  Home,
  Droplet,
  List,
  LogOut,
  Plus,
  Edit,
  Trash2,
  User,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  Search,
  Users,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Activity,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Car,
  RefreshCw,
  Map as MapIcon,
  PlusCircle,
  MapPin,
  Navigation,
  Crosshair,
  Save,
  ArrowLeft,
  LocateFixed,
  Layers,
} from "lucide-react";

import LOGO_URL from "./assets/Logo_P&P.jpg";

// --- ເຊື່ອມຕໍ່ກັບ GAS API URL ຫຼັກ (ບັນທຶກນ້ຳມັນ) ---
const API_URL =
  "https://script.google.com/macros/s/AKfycbxUEqs7nHH2Mz6zp3CzwDNVwLqXwA1S8w4SGobcflKJ56-EaYNm3RXvK8nAiCGENg/exec";

// --- ເຊື່ອມຕໍ່ກັບ GAS API URL (ໂລເຄຊັ໋ນລູກຄ້າ) ---
const LOCATION_GAS_URL =
  "https://script.google.com/macros/s/AKfycbxJxbIvQMBejY5ZmuKS3unVCvyf6ugUd-rJAQ5pljsvk7wtACW9dAjMhElY3ti6x0wT/exec";
const GOOGLE_MAPS_API_KEY = "AIzaSyBfhXi-1tPdrU5x0TpwOLdsYVRUv-ugyIg";

// --- ກຳນົດສິດການເຂົ້າເຖິງເມນູຂອງແຕ່ລະ Role ---
const roleMenuAccess = {
  admin: ["dashboard", "form", "list", "report", "users", "location"],
  user: ["dashboard", "form", "list", "report", "location"],
  driver: ["form", "list", "location"],
  partner: ["dashboard", "report"],
};

// --- Helper Function: ດຶງວັນທີ ແລະ ບັງຄັບເຂດເວລາເປັນຂອງປະເທດລາວ (Asia/Vientiane) ຮູບແບບ YYYY-MM-DD ---
const getLaosDateString = (dateInput) => {
  let d = dateInput ? new Date(dateInput) : new Date();

  if (typeof dateInput === "string" && dateInput.length === 10) {
    d = new Date(`${dateInput}T00:00:00`);
  }

  if (isNaN(d.getTime())) {
    return typeof dateInput === "string" ? dateInput.split("T")[0] : "";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Vientiane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;

  return `${year}-${month}-${day}`;
};

// --- Helper Function: ແຍກພາກສ່ວນວັນທີ YYYY, MM, DD ຕາມເວລາລາວ ---
const getLaosDateParts = (dateInput) => {
  const dateStr = getLaosDateString(dateInput);
  if (!dateStr) return { yyyy: "", mm: "", dd: "" };
  const [yyyy, mm, dd] = dateStr.split("-");
  return { yyyy, mm, dd };
};

// --- Helper Functions: ສ້າງ ID ແລະ ຊື່ໄຟລ໌ຮູບແບບໃໝ່ (ອີງຕາມເວລາລາວ) ---
const generateLogId = (dateStr, allLogs) => {
  const { yyyy, mm, dd } = getLaosDateParts(dateStr);
  if (!yyyy) return Date.now().toString();
  const prefix = `${yyyy}${mm}${dd}`;

  const todaysLogs = allLogs.filter(
    (l) => l.id && String(l.id).startsWith(prefix),
  );
  let maxSeq = 0;
  todaysLogs.forEach((l) => {
    const seq = parseInt(String(l.id).slice(8), 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  });
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
};

const generateUserId = (allUsers) => {
  const { yyyy, mm } = getLaosDateParts(new Date());
  const prefix = `${yyyy}${mm}`;

  const monthUsers = allUsers.filter(
    (u) => u.id && String(u.id).startsWith(prefix),
  );
  let maxSeq = 0;
  monthUsers.forEach((u) => {
    const seq = parseInt(String(u.id).slice(6), 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  });
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
};

const generateImageFilename = (type, plate, dateStr, allLogs, currentId) => {
  const { yyyy, mm, dd } = getLaosDateParts(dateStr);
  const prefixDate = yyyy ? `${yyyy}${mm}${dd}` : "YYYYMMDD";

  const sameDayCarLogs = allLogs.filter(
    (l) =>
      l.date === dateStr &&
      l.licensePlate === plate &&
      String(l.id) !== String(currentId),
  );
  const seq = sameDayCarLogs.length + 1;
  return `${type}_${plate}_${prefixDate}${String(seq).padStart(2, "0")}`;
};

// --- Helper Function: ແປງຮູບແບບວັນທີເປັນ DD/MM/YYYY ---
const formatDateDisplay = (dateInput) => {
  const ymd = getLaosDateString(dateInput);
  if (ymd && typeof ymd === "string" && ymd.includes("-")) {
    const parts = ymd.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateInput;
};

// --- Helper Function: ແປງຕົວເລກເປັນຮູບແບບ XXX,XXX.XX (ສຳລັບລິດ, ອັດຕາສິ້ນເປືອງ) ---
const formatNumber = (val) => {
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// --- Helper Function: ແປງຕົວເລກເປັນຮູບແບບ XXX,XXX ບໍ່ມີຈຸດທົດສະນິຍົມ (ສຳລັບເງິນ, ເລກກິໂລ) ---
const formatInteger = (val) => {
  const num = Number(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
};

export default function FuelApp() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("fuelAppUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [usersList, setUsersList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [cars, setCars] = useState([]);

  const [view, setView] = useState(() => {
    const savedUser = localStorage.getItem("fuelAppUser");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const allowed = roleMenuAccess[parsedUser.role] || ["list"];
      return allowed[0];
    }
    return "dashboard";
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
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
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API Error:", error);
      return {
        success: false,
        message: "ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້. ກະລຸນາກວດສອບອິນເຕີເນັດ.",
      };
    }
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@300;400;500;600;700&display=swap');
      body, input, button, select, textarea {
        font-family: 'Noto Sans Lao', sans-serif !important;
      }
      .gm-style-iw { padding: 0 !important; border-radius: 8px !important; }
      .gm-style-iw-d { padding: 12px !important; overflow: hidden !important; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

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
    if (user && usersList.length > 0) {
      const currentUserData = usersList.find(
        (u) => u.username === user.username,
      );
      if (
        currentUserData &&
        JSON.stringify(currentUserData) !== JSON.stringify(user)
      ) {
        setUser(currentUserData);
        localStorage.setItem("fuelAppUser", JSON.stringify(currentUserData));
      }
    }
  }, [usersList]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const username = e.target.username.value;
    const password = e.target.password.value;

    const res = await callApi({ action: "login", username, password });

    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem("fuelAppUser", JSON.stringify(res.user));

      const allowedMenus = roleMenuAccess[res.user.role] || ["list"];
      setView(allowedMenus[0]);

      showToast(`ຍິນດີຕ້ອນຮັບ, ${res.user.name}`, "success");
    } else {
      showToast(res.message || "ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ", "error");
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    confirmAction(
      "ທ່ານຕ້ອງການອອກຈາກລະບົບແທ້ບໍ່?",
      () => {
        setUser(null);
        localStorage.removeItem("fuelAppUser");
        setView("dashboard");
        setLogs([]);
        setCars([]);
        setUsersList([]);
        showToast("ອອກຈາກລະບົບສຳເລັດ", "success");
      },
      "logout",
    );
  };

  const handleSaveLog = async (formData) => {
    setIsLoading(true);
    const isEdit = !!editingId;
    const finalId = isEdit ? editingId : generateLogId(formData.date, logs);

    const receiptFileName = generateImageFilename(
      "Receipt",
      formData.licensePlate,
      formData.date,
      logs,
      editingId,
    );
    const odoFileName = generateImageFilename(
      "ODO",
      formData.licensePlate,
      formData.date,
      logs,
      editingId,
    );

    const payloadData = {
      ...formData,
      id: finalId,
      receiptFileName,
      odoFileName,
      createdAt: isEdit
        ? formData.createdAt
        : new Date().toLocaleString("lo-LA", { timeZone: "Asia/Vientiane" }),
      createdBy: isEdit ? formData.createdBy : user.name,
    };

    const res = await callApi({
      action: isEdit ? "editLog" : "addLog",
      data: payloadData,
    });

    if (res.success !== false) {
      if (isEdit) {
        setLogs(logs.map((l) => (l.id === editingId ? payloadData : l)));
      } else {
        setLogs([...logs, payloadData]);
      }
      setView("list");
      setEditingId(null);
      showToast("ບັນທຶກຂໍ້ມູນສຳເລັດ", "success");
    } else {
      showToast(res.message || "ບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ", "error");
    }
    setIsLoading(false);
  };

  const handleDelete = (id) => {
    confirmAction(
      "ທ່ານຕ້ອງການລຶບຂໍ້ມູນການເຕີມນ້ຳມັນນີ້ແທ້ບໍ່?",
      async () => {
        setIsLoading(true);
        const res = await callApi({ action: "deleteLog", id });

        if (res.success !== false) {
          setLogs(logs.filter((l) => l.id !== id));
          showToast("ລຶບຂໍ້ມູນສຳເລັດ", "success");
        } else {
          showToast(res.message || "ລຶບຂໍ້ມູນບໍ່ສຳເລັດ", "error");
        }
        setIsLoading(false);
      },
      "delete",
    );
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setView("form");
  };

  const handleSaveUser = async (userData) => {
    setIsLoading(true);
    const isEdit = !!userData.id;
    const finalId = isEdit ? userData.id : generateUserId(usersList);

    const finalUserData = {
      ...userData,
      id: finalId,
    };

    const res = await callApi({
      action: isEdit ? "editUser" : "addUser",
      data: finalUserData,
    });

    if (res.success !== false) {
      if (isEdit) {
        setUsersList(
          usersList.map((u) => (u.id === userData.id ? finalUserData : u)),
        );
      } else {
        setUsersList([...usersList, finalUserData]);
      }
      setView("users");
      showToast(
        isEdit ? "ແກ້ໄຂຜູ້ໃຊ້ງານສຳເລັດ" : "ເພີ່ມຜູ້ໃຊ້ງານສຳເລັດ",
        "success",
      );
    } else {
      showToast(res.message || "ບັນທຶກຜູ້ໃຊ້ບໍ່ສຳເລັດ", "error");
    }
    setIsLoading(false);
  };

  const handleDeleteUser = (id) => {
    if (id === user?.id)
      return showToast("ທ່ານບໍ່ສາມາດລຶບບັນຊີທີ່ກຳລັງໃຊ້ງານຢູ່ໄດ້", "error");

    confirmAction(
      "ຕ້ອງການລຶບຜູ້ໃຊ້ງານນີ້ແທ້ບໍ່?",
      async () => {
        setIsLoading(true);
        const res = await callApi({ action: "deleteUser", id });

        if (res.success !== false) {
          setUsersList(usersList.filter((u) => u.id !== id));
          showToast("ລຶບຜູ້ໃຊ້ງານສຳເລັດ", "success");
        } else {
          showToast(res.message || "ລຶບຜູ້ໃຊ້ບໍ່ສຳເລັດ", "error");
        }
        setIsLoading(false);
      },
      "delete",
    );
  };

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
    <div className="h-screen bg-gray-50 flex overflow-hidden font-lao relative">
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-[9999] px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl flex items-center space-x-3 transform transition-all duration-300 animate-in slide-in-from-top-10 fade-in ${toast.type === "success" ? "bg-white border-l-4 border-green-500" : "bg-white border-l-4 border-red-500"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
          )}
          <div>
            <p className="text-sm md:text-base font-bold text-gray-800">
              {toast.type === "success" ? "ສຳເລັດ!" : "ຜິດພາດ!"}
            </p>
            <p className="text-xs md:text-sm text-gray-600">{toast.message}</p>
          </div>
        </div>
      )}

      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[9999] flex items-center justify-center backdrop-blur-sm px-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 md:p-6 text-center space-y-3 md:space-y-4">
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 ${confirmDialog.type === "logout" ? "bg-orange-100 text-orange-500" : "bg-red-100 text-red-500"}`}
              >
                {confirmDialog.type === "logout" ? (
                  <LogOut className="w-6 h-6 md:w-8 md:h-8" />
                ) : (
                  <AlertTriangle className="w-6 h-6 md:w-8 md:h-8" />
                )}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800">
                {confirmDialog.type === "logout"
                  ? "ອອກຈາກລະບົບ?"
                  : "ຢືນຢັນການລຶບ?"}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex border-t border-gray-100 text-sm md:text-base">
              <button
                onClick={closeConfirm}
                className="flex-1 px-4 py-3 md:py-4 text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  closeConfirm();
                }}
                className={`flex-1 px-4 py-3 md:py-4 font-bold transition ${confirmDialog.type === "logout" ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
              >
                {confirmDialog.type === "logout" ? "ຕົກລົງ" : "ຕົກລົງ, ລຶບເລີຍ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[9998] flex items-center justify-center backdrop-blur-sm transition-all">
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-2xl flex flex-col items-center space-y-3 md:space-y-4">
            <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-sm md:text-base font-bold text-gray-700">
              ກຳລັງປະມວນຜົນ...
            </span>
          </div>
        </div>
      )}

      {!user ? (
        <div className="h-screen w-full bg-orange-50 flex flex-col items-center justify-between">
          <div className="flex-1 flex items-center justify-center p-4 w-full">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-orange-500">
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
                ເຂົ້າສູ່ລະບົບ - ບັນທຶກນ້ຳມັນ
              </h2>
              <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
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
                  className="w-full h-[40px] md:h-[48px] bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-lg md:rounded-xl transition shadow-md text-sm md:text-base mt-2"
                >
                  ເຂົ້າສູ່ລະບົບ
                </button>
              </form>
            </div>
          </div>
          <Footer />
        </div>
      ) : (
        <>
          <div
            className={`fixed inset-y-0 left-0 z-50 w-[300px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:inset-0 flex flex-col`}
          >
            <div className="h-full flex flex-col font-lao">
              <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6 bg-orange-500 text-white flex-shrink-0 w-full">
                <div className="flex items-center space-x-2 font-bold min-w-0 flex-1 pr-2">
                  <span className="text-sm md:text-lg truncate">
                    ລະບົບບັນທຶກການຕື່ມນ້ຳມັນ
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
                  <button
                    onClick={() => {
                      setView("dashboard");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition text-sm md:text-base ${view === "dashboard" ? "bg-orange-100 text-orange-600 font-semibold" : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"}`}
                  >
                    <Home className="w-4 h-4 md:w-5 md:h-5" />{" "}
                    <span>ໜ້າຫຼັກ</span>
                  </button>
                )}
                {hasAccess("form") && (
                  <button
                    onClick={() => {
                      setView("form");
                      setEditingId(null);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition text-sm md:text-base ${view === "form" ? "bg-orange-100 text-orange-600 font-semibold" : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"}`}
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />{" "}
                    <span>ບັນທຶກໃສ່ນ້ຳມັນ</span>
                  </button>
                )}
                {hasAccess("list") && (
                  <button
                    onClick={() => {
                      setView("list");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition text-sm md:text-base ${view === "list" ? "bg-orange-100 text-orange-600 font-semibold" : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"}`}
                  >
                    <List className="w-4 h-4 md:w-5 md:h-5" />{" "}
                    <span>ປະຫວັດການເຕີມ</span>
                  </button>
                )}
                {hasAccess("report") && (
                  <button
                    onClick={() => {
                      setView("report");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition text-sm md:text-base ${view === "report" ? "bg-orange-100 text-orange-600 font-semibold" : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"}`}
                  >
                    <Activity className="w-4 h-4 md:w-5 md:h-5" />{" "}
                    <span>ລາຍງານການເຕີມນ້ຳມັນ</span>
                  </button>
                )}
                {hasAccess("location") && (
                  <button
                    onClick={() => {
                      setView("location");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition text-sm md:text-base ${view === "location" ? "bg-orange-100 text-orange-600 font-semibold" : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"}`}
                  >
                    <MapPin className="w-4 h-4 md:w-5 md:h-5" />{" "}
                    <span>ໂລເຄຊັ໋ນຮ້ານຄ້າ</span>
                  </button>
                )}

                {hasAccess("users") && (
                  <div className="pt-3 md:pt-4 mt-3 md:mt-4 border-t border-gray-100">
                    <p className="px-3 md:px-4 text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      ສໍາລັບຜູ້ດູແລ
                    </p>
                    <button
                      onClick={() => {
                        setView("users");
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition text-sm md:text-base ${view === "users" ? "bg-orange-100 text-orange-600 font-semibold" : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"}`}
                    >
                      <Users className="w-4 h-4 md:w-5 md:h-5" />{" "}
                      <span>ຈັດການຜູ້ໃຊ້ງານ</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 md:p-4 border-t border-gray-100 bg-white flex-shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 bg-gray-50 rounded-xl mb-2 border border-gray-100">
                  <div className="bg-orange-100 p-1.5 md:p-2 rounded-full flex-shrink-0">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-800 truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] md:text-xs text-orange-600 font-semibold uppercase">
                      {user.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-2.5 md:py-3 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl transition shadow-sm text-sm md:text-base h-[40px] md:h-[48px]"
                >
                  <LogOut className="w-4 h-4 md:w-5 md:h-5" />{" "}
                  <span>ອອກຈາກລະບົບ</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden font-lao bg-gray-50/50">
            <header className="h-14 md:h-16 bg-orange-500 shadow-md flex items-center justify-between px-3 md:px-4 lg:px-8 border-b border-orange-600 flex-shrink-0 z-10 text-white">
              <button
                className="md:hidden p-2 text-white hover:bg-orange-600 rounded-lg transition shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="text-base md:text-xl font-black truncate px-2 flex-1 text-left">
                {view === "dashboard" && "ພາບລວມລະບົບ"}
                {view === "form" &&
                  (editingId
                    ? "ແກ້ໄຂຂໍ້ມູນໃສ່ນ້ຳມັນ"
                    : "ບັນທຶກການໃສ່ນ້ຳມັນໃໝ່")}
                {view === "list" && "ປະຫວັດການໃສ່ນ້ຳມັນ"}
                {view === "report" && "ລາຍງານການເຕີມນ້ຳມັນ"}
                {view === "users" && "ການຈັດການຜູ້ໃຊ້ງານ"}
                {view === "location" && "ໂລເຄຊັ໋ນຮ້ານຄ້າລູກຄ້າ"}
              </div>
              <div className="flex items-center space-x-2 md:space-x-4 text-xs md:text-sm font-bold text-white bg-orange-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg whitespace-nowrap shrink-0 shadow-inner">
                <span>ວັນທີ: {formatDateDisplay(new Date())}</span>
              </div>
            </header>

            <main
              className={`flex-1 overflow-y-auto ${view === "location" ? "p-0" : "p-2.5 sm:p-4 lg:p-8"}`}
            >
              <div
                className={`${view === "location" ? "w-full h-full relative" : "max-w-6xl mx-auto w-full pb-6 md:pb-8"}`}
              >
                {view === "dashboard" && hasAccess("dashboard") && (
                  <Dashboard logs={visibleLogs} cars={visibleCars} />
                )}
                {view === "list" && hasAccess("list") && (
                  <LogList
                    logs={visibleLogs}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    setView={setView}
                    role={user.role}
                    cars={visibleCars}
                    onRefresh={loadInitialData}
                  />
                )}
                {view === "report" && hasAccess("report") && (
                  <FuelReport
                    logs={visibleLogs}
                    cars={visibleCars}
                    onRefresh={loadInitialData}
                  />
                )}
                {view === "form" && hasAccess("form") && (
                  <FuelForm
                    onSave={handleSaveLog}
                    onCancel={() => setView("list")}
                    initialData={
                      editingId
                        ? visibleLogs.find((l) => l.id === editingId)
                        : null
                    }
                    allLogs={visibleLogs}
                    cars={visibleCars}
                  />
                )}
                {view === "users" && hasAccess("users") && (
                  <UserManagement
                    users={usersList}
                    allCars={cars}
                    onSave={handleSaveUser}
                    onDelete={handleDeleteUser}
                  />
                )}
                {view === "location" && hasAccess("location") && (
                  <StoreLocation user={user} />
                )}
              </div>
            </main>
            {view !== "location" && <Footer />}
          </div>

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm transition-all"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}
        </>
      )}
    </div>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-3 md:py-4 flex-shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs md:text-sm text-gray-500 font-lao">
        <div className="flex items-center space-x-2 mb-1 md:mb-0">
          <img
            src={LOGO_URL}
            alt="Logo"
            className="h-5 md:h-6 object-contain rounded"
            onError={(e) => {
              e.target.onerror = null;
              e.target.alt = "P&P Logo";
            }}
          />
          <span className="font-bold text-gray-700">
            P AND P Trading Export-Import Co., Ltd
          </span>
          <span>© {currentYear}</span>
        </div>
        <div className="text-center md:text-right">
          <p>
            ພັດທະນາໂດຍ:{" "}
            <span className="font-semibold text-orange-600">
              K. VANSOUANSENGPHET
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ----------------------------------------------------
// ໂລເຄຊັ໋ນຮ້ານຄ້າ (Store Location Component)
// ----------------------------------------------------
function StoreLocation({ user }) {
  const [activeTab, setActiveTab] = useState("map"); // 'map', 'list', 'form'
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setScriptLoaded(true);
    } else {
      window.initGoogleMapForStore = () => {
        setScriptLoaded(true);
      };
      const scriptId = "google-maps-script";
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async&callback=initGoogleMapForStore`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      } else {
        const origCallback = window.initGoogleMapForStore;
        window.initGoogleMapForStore = () => {
          if (origCallback) origCallback();
          setScriptLoaded(true);
        };
      }
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (LOCATION_GAS_URL) {
        const res = await fetch(LOCATION_GAS_URL, {
          method: "GET",
          redirect: "follow",
        });

        const text = await res.text();
        try {
          const json = JSON.parse(text);

          if (json.status !== "success" && !json.data) {
            setError(
              `API ຕອບກັບຜິດພາດ: ${json.message || "ບໍ່ມີຂໍ້ມູນໃນ Sheet"}`,
            );
            setLoading(false);
            return;
          }

          const mappedCustomers = (json.data || []).map((rawRow, index) => {
            const row = {};
            for (let key in rawRow) {
              if (key) row[key.trim()] = rawRow[key];
            }

            const getVal = (keys) => {
              for (let k of keys) {
                if (row[k] !== undefined && row[k] !== null && row[k] !== "")
                  return String(row[k]).trim();
              }
              return "";
            };

            let lat = "",
              lng = "";
            const locationStr = getVal(["location", "ທີ່ຕັ້ງ", "ພິກັດ"]);
            if (locationStr) {
              const parts = locationStr.split(",");
              if (parts.length === 2) {
                lat = parts[0].trim();
                lng = parts[1].trim();
              }
            }

            return {
              id: String(row.id || `temp-id-${index}-${Date.now()}`),
              customerCode: getVal(["ລະຫັດ", "ລະຫັດລູກຄ້າ", "customerCode"]),
              customerName: getVal([
                "ລາຍຊື່ລູກຄ້າ",
                "ຊື່ລູກຄ້າ",
                "ລາຍຊື່",
                "customerName",
              ]),
              channel: getVal(["ຊ່ອງທາງ", "channel"]),
              phone: getVal(["ເບີໂທ", "ເບີໂທຕິດຕໍ່", "ເບີໂທລະສັບ", "phone"]),
              village: getVal(["ບ້ານ", "village"]),
              district: getVal(["ເມືອງ", "district"]),
              province: getVal(["ແຂວງ", "province"]),
              lat: lat || getVal(["lat", "latitude"]),
              lng: lng || getVal(["lng", "longitude"]),
              salesperson: getVal([
                "ຝ່າຍຂາຍຮັບຜິດຊອບ",
                "ພະນັກງານຂາຍ",
                "ຝ່າຍຂາຍ",
                "salesperson",
              ]),
              createDate: getVal(["ວັນທີສ້າງ", "ວັນທີ", "createDate"]),
              creator: getVal(["ຜູ້ສ້າງ", "creator"]),
              salesPhone: getVal([
                "ເບີໂທຝ່າຍຂາຍ",
                "ເບີໂທພະນັກງານ",
                "salesPhone",
              ]),
            };
          });

          setCustomers(mappedCustomers);
        } catch (e) {
          console.error("API Error Response:", text);
          if (text.includes("<html") || text.includes("Sign in")) {
            setError(
              'ບໍ່ສາມາດດຶງຂໍ້ມູນໄດ້ ເພາະຕິດໜ້າ Login ຂອງ Google. ກະລຸນາກວດສອບການ Deploy App Script ໃນຊ່ອງ "Who has access" ຕ້ອງເລືອກເປັນ "Anyone" ເທົ່ານັ້ນ.',
            );
          } else {
            setError(
              `ຮູບແບບຂໍ້ມູນບໍ່ຖືກຕ້ອງ (Parse Error): ${text.substring(0, 100)}...`,
            );
          }
        }
      } else {
        const localData = JSON.parse(
          localStorage.getItem("mockCustomers") || "[]",
        );
        setCustomers(localData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        `ການເຊື່ອມຕໍ່ຖືກບຼັອກ (CORS / Network Error). ກະລຸນາກວດສອບ URL: ${err.message}`,
      );
    }
    setLoading(false);
  };

  const saveData = async (action, payload) => {
    setLoading(true);
    setError(null);
    try {
      const apiPayload = {
        ...payload,
        location: `${payload.lat}, ${payload.lng}`,
        ລະຫັດ: payload.customerCode,
        ລາຍຊື່ລູກຄ້າ: payload.customerName,
        ຊ່ອງທາງ: payload.channel,
        ເບີໂທ: payload.phone,
        ບ້ານ: payload.village,
        ເມືອງ: payload.district,
        ແຂວງ: payload.province,
        ຝ່າຍຂາຍຮັບຜິດຊອບ: payload.salesperson,
        ຜູ້ສ້າງ: payload.creator || user?.name,
      };

      if (LOCATION_GAS_URL) {
        await fetch(LOCATION_GAS_URL, {
          method: "POST",
          redirect: "follow",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({ action, payload: apiPayload }),
        });
        await fetchData();
      } else {
        let localData = JSON.parse(
          localStorage.getItem("mockCustomers") || "[]",
        );
        if (action === "ADD") {
          payload.id = Date.now().toString();
          payload.createDate = new Date().toISOString();
          localData.push(payload);
        } else if (action === "EDIT") {
          localData = localData.map((c) =>
            c.id === payload.id ? { ...c, ...payload } : c,
          );
        } else if (action === "DELETE") {
          localData = localData.filter((c) => c.id !== payload.id);
        }
        localStorage.setItem("mockCustomers", JSON.stringify(localData));
        setCustomers(localData);
      }
    } catch (err) {
      console.error("Error saving data:", err);
      setError(`ບັນທຶກບໍ່ສຳເລັດ: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 relative overflow-hidden">
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg z-50 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-red-800 text-sm">ເກີດຂໍ້ຜິດພາດ:</h3>
          <p className="text-xs mt-1 text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto relative pb-[70px]">
        {activeTab === "map" && (
          <MapView
            customers={customers}
            search={search}
            setSearch={setSearch}
            scriptLoaded={scriptLoaded}
            userLocation={userLocation}
            setUserLocation={setUserLocation}
            onRefresh={fetchData}
          />
        )}
        {activeTab === "list" && (
          <ListView
            customers={customers}
            search={search}
            setSearch={setSearch}
            onEdit={(c) => setActiveTab({ name: "form", data: c })}
            onDelete={(id) => {
              if (window.confirm("ທ່ານຕ້ອງການລຶບຂໍ້ມູນນີ້ແທ້ບໍ່?")) {
                saveData("DELETE", { id });
              }
            }}
            onRefresh={fetchData}
          />
        )}
        {(activeTab === "form" || activeTab?.name === "form") && (
          <FormView
            initialData={activeTab?.data || null}
            user={user}
            onSave={(data, isEdit) => {
              saveData(isEdit ? "EDIT" : "ADD", data);
              setActiveTab("list");
            }}
            onCancel={() => setActiveTab("list")}
            scriptLoaded={scriptLoaded}
          />
        )}
      </div>

      <div className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center p-2 pb-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center w-full py-2 ${activeTab === "map" ? "text-orange-500 font-semibold" : "text-gray-400 hover:text-gray-600"}`}
        >
          <MapIcon size={24} />
          <span className="text-[11px] mt-1">ແຜນທີ່</span>
        </button>
        <button
          onClick={() => setActiveTab("form")}
          className={`flex flex-col items-center w-full py-2 relative -top-5`}
        >
          <div className="bg-orange-500 text-white p-3 rounded-full shadow-lg border-4 border-slate-50 hover:bg-orange-600 transition-transform active:scale-95">
            <PlusCircle size={28} />
          </div>
          <span
            className={`text-[11px] mt-1 ${activeTab === "form" || activeTab?.name === "form" ? "text-orange-500 font-semibold" : "text-gray-400 hover:text-gray-600"}`}
          >
            ເພີ່ມໃໝ່
          </span>
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`flex flex-col items-center w-full py-2 ${activeTab === "list" ? "text-orange-500 font-semibold" : "text-gray-400 hover:text-gray-600"}`}
        >
          <List size={24} />
          <span className="text-[11px] mt-1">ລາຍຊື່</span>
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}

function MapView({
  customers,
  search,
  setSearch,
  scriptLoaded,
  userLocation,
  setUserLocation,
  onRefresh,
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef({});
  const infoWindowRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchKeyword = String(search || "")
    .toLowerCase()
    .replace(/\s/g, "");
  const filteredCustomers = customers.filter((c) => {
    const name = String(c.customerName || "")
      .toLowerCase()
      .replace(/\s/g, "");
    const code = String(c.customerCode || "")
      .toLowerCase()
      .replace(/\s/g, "");
    const id = String(c.id || "")
      .toLowerCase()
      .replace(/\s/g, "");
    const phone = String(c.phone || "")
      .toLowerCase()
      .replace(/\s/g, "");

    return (
      name.includes(searchKeyword) ||
      code.includes(searchKeyword) ||
      id.includes(searchKeyword) ||
      phone.includes(searchKeyword)
    );
  });

  useEffect(() => {
    if (
      scriptLoaded &&
      window.google &&
      window.google.maps &&
      mapRef.current &&
      !map
    ) {
      const vteCoords = { lat: 17.9757, lng: 102.6331 };
      const m = new window.google.maps.Map(mapRef.current, {
        center: vteCoords,
        zoom: 12,
        disableDefaultUI: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: window.google.maps.ControlPosition.TOP_LEFT,
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });
      setMap(m);
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }
  }, [scriptLoaded, mapRef, map]);

  const focusOnCustomer = (c) => {
    setSearch(c.customerName);
    setShowDropdown(false);
    if (
      map &&
      markersRef.current[c.id] &&
      window.google &&
      window.google.maps
    ) {
      const lat = parseFloat(c.lat);
      const lng = parseFloat(c.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setCenter({ lat, lng });
        map.setZoom(18);
        window.google.maps.event.trigger(markersRef.current[c.id], "click");
      }
    }
  };

  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    Object.values(markersRef.current).forEach((m) => m.setMap(null));
    markersRef.current = {};

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidPoints = false;

    filteredCustomers.forEach((c) => {
      const lat = parseFloat(c.lat);
      const lng = parseFloat(c.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        hasValidPoints = true;
        const position = { lat, lng };
        bounds.extend(position);

        const marker = new window.google.maps.Marker({
          position,
          map,
          title: c.customerName,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#f97316",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            scale: 10,
          },
        });

        marker.addListener("click", () => {
          const content = `
            <div style="min-width: 200px;">
              <h3 style="font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                ${c.customerName}
              </h3>
              <div style="font-size: 13px; color: #475569; margin-bottom: 8px; line-height: 1.5;">
                <p style="margin: 2px 0;"><b>ລະຫັດ:</b> ${c.customerCode}</p>
                <p style="margin: 2px 0;"><b>ເບີໂທ:</b> ${c.phone}</p>
                <p style="margin: 2px 0;"><b>ສະຖານທີ່:</b> ບ.${c.village}, ມ.${c.district}, ຂ.${c.province}</p>
                <p style="margin: 2px 0;"><b>ຝ່າຍຂາຍ:</b> ${c.salesperson}</p>
              </div>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" 
                 style="display: block; width: 100%; background: #f97316; color: white; text-align: center; padding: 8px 0; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(249,115,22,0.3);">
                <span style="display:flex; align-items:center; justify-content:center; gap: 4px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                  ນຳທາງ (Navigate)
                </span>
              </a>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        });

        markersRef.current[c.id] = marker;
      }
    });

    if (hasValidPoints && filteredCustomers.length > 0) {
      map.fitBounds(bounds);
      const listener = window.google.maps.event.addListenerOnce(
        map,
        "idle",
        function () {
          if (map.getZoom() > 16) {
            map.setZoom(16);
          }
        },
      );
    }
  }, [map, filteredCustomers]);

  const handleLocateMe = () => {
    if (navigator.geolocation && map && window.google && window.google.maps) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(pos);
          map.setCenter(pos);
          map.setZoom(15);

          if (userMarkerRef.current) userMarkerRef.current.setMap(null);

          userMarkerRef.current = new window.google.maps.Marker({
            position: pos,
            map: map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
            title: "ຕຳແໜ່ງຂອງທ່ານ",
          });
        },
        () => alert("ບໍ່ສາມາດດຶງທີ່ຢູ່ປັດຈຸບັນໄດ້. ກະລຸນາເປີດ GPS."),
      );
    }
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[92%] max-w-[420px] z-20 flex gap-2">
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex-1 flex items-center p-3 border border-gray-100 relative">
          <Search className="text-gray-400 mr-2" size={20} />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່, ລະຫັດ ຫຼື ເບີໂທ..."
            className="flex-1 outline-none text-sm font-medium"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filteredCustomers.length > 0) {
                focusOnCustomer(filteredCustomers[0]);
              }
            }}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setShowDropdown(false);
              }}
            >
              <X className="text-gray-400" size={18} />
            </button>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="bg-white p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.15)] text-orange-500 hover:bg-orange-50"
          title="ໂຫຼດຂໍ້ມູນໃໝ່"
        >
          <RefreshCw size={20} />
        </button>

        {showDropdown && search && filteredCustomers.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-12 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto z-30">
            {filteredCustomers.map((c, index) => (
              <div
                key={c.id || `dropdown-${index}`}
                onClick={() => focusOnCustomer(c)}
                className="p-3 border-b border-gray-50 last:border-0 hover:bg-orange-50 cursor-pointer flex justify-between items-center transition-colors"
              >
                <div>
                  <div className="font-bold text-sm text-gray-800">
                    {c.customerName}
                  </div>
                  <div className="text-xs text-gray-500">
                    ບ.{c.village || "-"}, ມ.{c.district || "-"}
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md">
                  {c.customerCode}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        ref={mapRef}
        className="w-full h-full bg-gray-200"
        onClick={() => setShowDropdown(false)}
      />

      <button
        onClick={handleLocateMe}
        className="absolute bottom-[30px] right-[10px] w-10 h-10 flex items-center justify-center bg-white rounded-sm shadow-[0_1px_4px_rgba(0,0,0,0.3)] text-gray-600 hover:text-orange-500 transition-colors z-10"
        title="ສະແດງຕຳແໜ່ງປັດຈຸບັນ"
      >
        <LocateFixed size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function ListView({
  customers,
  search,
  setSearch,
  onEdit,
  onDelete,
  onRefresh,
}) {
  const searchKeyword = String(search || "")
    .toLowerCase()
    .replace(/\s/g, "");
  const filtered = customers.filter((c) => {
    const name = String(c.customerName || "")
      .toLowerCase()
      .replace(/\s/g, "");
    const code = String(c.customerCode || "")
      .toLowerCase()
      .replace(/\s/g, "");
    const id = String(c.id || "")
      .toLowerCase()
      .replace(/\s/g, "");
    const phone = String(c.phone || "")
      .toLowerCase()
      .replace(/\s/g, "");

    return (
      name.includes(searchKeyword) ||
      code.includes(searchKeyword) ||
      id.includes(searchKeyword) ||
      phone.includes(searchKeyword)
    );
  });

  return (
    <div className="p-4 flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex gap-2 mb-4 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm flex-1 flex items-center p-3 border border-gray-200">
          <Search className="text-gray-400 mr-2" size={20} />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່, ລະຫັດ ຫຼື ເບີໂທ..."
            className="flex-1 outline-none text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={onRefresh}
          className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 text-orange-500 hover:bg-orange-50"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <MapPin size={48} className="mx-auto mb-2 opacity-20" />
            <p>ບໍ່ພົບຂໍ້ມູນລູກຄ້າ</p>
          </div>
        ) : (
          filtered.map((c, index) => (
            <div
              key={c.id || `list-${index}`}
              className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex justify-between items-start relative overflow-hidden hover:shadow-md transition"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
              <div className="flex-1 pl-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md">
                    {c.customerCode}
                  </span>
                  <h3 className="font-bold text-gray-800">{c.customerName}</h3>
                </div>
                <div className="text-sm text-gray-500 space-y-1 mt-2">
                  <p className="flex items-center gap-2">
                    <Navigation size={14} className="text-gray-400" /> ບ.
                    {c.village}, ມ.{c.district}, ຂ.{c.province}
                  </p>
                  <p className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" /> ຝ່າຍຂາຍ:{" "}
                    {c.salesperson} ({c.salesPhone})
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onEdit(c)}
                  className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FormView({ initialData, user, onSave, onCancel, scriptLoaded }) {
  const [showPicker, setShowPicker] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    customerCode: "",
    customerName: "",
    channel: "",
    phone: "",
    village: "",
    district: "",
    province: "",
    lat: "",
    lng: "",
    salesperson: "",
    salesPhone: "",
    creator: user?.name || "",
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.lat || !formData.lng) {
      alert("ກະລຸນາເລືອກພິກັດສະຖານທີ່ຈາກແຜນທີ່");
      return;
    }
    onSave(formData, !!initialData);
  };

  if (showPicker) {
    return (
      <LocationPicker
        initialLat={formData.lat}
        initialLng={formData.lng}
        scriptLoaded={scriptLoaded}
        onConfirm={(lat, lng) => {
          setFormData((prev) => ({ ...prev, lat, lng }));
          setShowPicker(false);
        }}
        onCancel={() => setShowPicker(false)}
      />
    );
  }

  return (
    <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="text-orange-500" size={20} />
            {initialData ? "ແກ້ໄຂຂໍ້ມູນສະຖານທີ່" : "ເພີ່ມສະຖານທີ່ຮ້ານຄ້າໃໝ່"}
          </h2>
          {initialData && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                ລະຫັດລູກຄ້າ *
              </label>
              <input
                required
                name="customerCode"
                value={formData.customerCode}
                onChange={handleChange}
                className="w-full border border-gray-300 bg-gray-50 rounded-lg p-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white transition text-sm"
                placeholder="Cust-001"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                ຊ່ອງທາງ
              </label>
              <input
                name="channel"
                value={formData.channel}
                onChange={handleChange}
                className="w-full border border-gray-300 bg-gray-50 rounded-lg p-2.5 outline-none focus:border-orange-500 focus:bg-white transition text-sm"
                placeholder="Facebook, ຮ້ານ..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              ຊື່ລູກຄ້າ / ຊື່ຮ້ານ *
            </label>
            <input
              required
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-gray-50 rounded-lg p-2.5 outline-none focus:border-orange-500 focus:bg-white transition text-sm"
              placeholder="ປ້ອນຊື່ລູກຄ້າ"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              ເບີໂທຕິດຕໍ່
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-gray-50 rounded-lg p-2.5 outline-none focus:border-orange-500 focus:bg-white transition text-sm"
              placeholder="020 xxxx xxxx"
            />
          </div>

          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3 shadow-inner">
            <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2">
              <MapPin size={16} /> ທີ່ຕັ້ງສະຖານທີ່
            </h3>

            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="w-full bg-white border border-orange-300 text-orange-600 font-semibold py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors"
            >
              <Crosshair size={18} />{" "}
              {formData.lat ? "ປ່ຽນພິກັດໃໝ່" : "ເລືອກພິກັດຈາກແຜນທີ່ *"}
            </button>

            {formData.lat && (
              <div className="text-xs text-center text-gray-600 bg-white py-1.5 rounded border border-orange-200 font-medium">
                Lat: {Number(formData.lat).toFixed(5)}, Lng:{" "}
                {Number(formData.lng).toFixed(5)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  ບ້ານ
                </label>
                <input
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  ເມືອງ
                </label>
                <input
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  ແຂວງ
                </label>
                <input
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                ພະນັກງານຂາຍ
              </label>
              <input
                name="salesperson"
                value={formData.salesperson}
                onChange={handleChange}
                className="w-full border border-gray-300 bg-gray-50 focus:bg-white rounded-lg p-2.5 text-sm outline-none focus:border-orange-500 transition"
                placeholder="ຊື່ຜູ້ຮັບຜິດຊອບ"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                ເບີໂທພະນັກງານ
              </label>
              <input
                name="salesPhone"
                value={formData.salesPhone}
                onChange={handleChange}
                className="w-full border border-gray-300 bg-gray-50 focus:bg-white rounded-lg p-2.5 text-sm outline-none focus:border-orange-500 transition"
                placeholder="020..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              ຜູ້ສ້າງຂໍ້ມູນ (User)
            </label>
            <input
              name="creator"
              value={formData.creator}
              disabled
              className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg p-2.5 text-sm outline-none cursor-not-allowed font-medium"
              placeholder="ຊື່ແອັດມິນ"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 flex justify-center items-center gap-2 mt-4 transition-all active:scale-95"
          >
            <Save size={20} /> ບັນທຶກຂໍ້ມູນ
          </button>
        </form>
      </div>
    </div>
  );
}

function LocationPicker({
  initialLat,
  initialLng,
  onConfirm,
  onCancel,
  scriptLoaded,
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (
      scriptLoaded &&
      window.google &&
      window.google.maps &&
      mapRef.current &&
      !map
    ) {
      const center = {
        lat: parseFloat(initialLat) || 17.9757,
        lng: parseFloat(initialLng) || 102.6331,
      };
      const m = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 16,
        disableDefaultUI: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: window.google.maps.ControlPosition.TOP_LEFT,
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
      });
      setMap(m);

      if (!initialLat && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          m.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
      }
    }
  }, [scriptLoaded, mapRef, map, initialLat, initialLng]);

  const handleConfirm = () => {
    if (map) {
      const center = map.getCenter();
      onConfirm(center.lat(), center.lng());
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 animate-in slide-in-from-bottom-full duration-300 pb-[calc(env(safe-area-inset-bottom)+20px)]">
      <div className="flex justify-between items-center p-4 bg-white shadow-sm z-10">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-gray-800">
          ເລື່ອນແຜນທີ່ເພື່ອປັກໝຸດ
        </h2>
        <div className="w-8"></div>
      </div>

      <div className="relative flex-1">
        <div ref={mapRef} className="w-full h-full" />

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-md pb-8">
          <MapPin size={40} className="text-orange-600 fill-orange-500" />
          <div className="w-3 h-1 bg-black/20 rounded-full mx-auto mt-1 blur-[1px]"></div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <button
          className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 active:scale-95 transition-transform"
          onClick={handleConfirm}
        >
          ຢືນຢັນພິກັດນີ້
        </button>
      </div>
    </div>
  );
}

// --- Component ສຳລັບສ້າງກາຟ (Responsive) ---
function FuelChart({
  data,
  barKey = "liters",
  barName = "ປະລິມານນ້ຳມັນ",
  barUnit = "ລິດ",
  formatBar = formatNumber,
  barColor = "#fdba74",
  barColorHover = "#f97316",
  barTextColor = "#9a3412",

  lineKey = "consumption",
  lineName = "ອັດຕາສິ້ນເປືອງ",
  lineUnit = "ກມ/ລິດ",
  formatLine = formatNumber,
  lineColor = "#3b82f6",
  lineTextColor = "#1e3a8a",
}) {
  const containerRef = useRef(null);
  const [viewBoxWidth, setViewBoxWidth] = useState(800);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setViewBoxWidth(Math.max(containerRef.current.clientWidth, 300));
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // ສຳລັບປິດ Popup ເວລາຄິກບ່ອນອື່ນເທິງໜ້າຈໍ
  useEffect(() => {
    const handleClickOutside = () => {
      if (tooltip) setTooltip(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [tooltip]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 md:py-16 text-xs md:text-sm text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
        ບໍ່ມີຂໍ້ມູນການເຕີມນ້ຳມັນສຳລັບສ້າງກາຟ
      </div>
    );
  }

  const maxBarVal = Math.max(...data.map((d) => d[barKey] || 0), 10) * 1.25;
  const maxLineVal = Math.max(...data.map((d) => d[lineKey] || 0), 5) * 1.25;

  const viewBoxHeight = 300;
  const isMobile = viewBoxWidth < 500;

  // ເພີ່ມ bottom padding ຖ້າຂໍ້ມູນມີຫຼາຍ ເພື່ອໃຫ້ພໍດີກັບຕົວໜັງສືທີ່ອຽງລົງ
  const bottomPad = data.length > 12 ? 60 : 40;
  const padding = {
    top: 50,
    right: isMobile ? 65 : 85,
    bottom: bottomPad,
    left: isMobile ? 45 : 60,
  };

  const width = viewBoxWidth - padding.left - padding.right;
  const height = viewBoxHeight - padding.top - padding.bottom;

  const barWidth = Math.min(48, (width / data.length) * (isMobile ? 0.6 : 0.5));
  const showValues = data.length <= 15; // ເຊື່ອງຕົວເລກເທິງແທ່ງກາຟຖ້າຂໍ້ມູນມີຫຼາຍກວ່າ 15 ອັນ ເພື່ອບໍ່ໃຫ້ມັນອັ່ງ

  const points = data.map((d, i) => {
    const x = padding.left + (i + 0.5) * (width / data.length);
    const yBar = padding.top + height - ((d[barKey] || 0) / maxBarVal) * height;
    const yLine =
      padding.top + height - ((d[lineKey] || 0) / maxLineVal) * height;

    let litY = yBar - 10;
    let consY = yLine - 15;

    if (Math.abs(litY - consY) < 25) {
      if (yLine < yBar) {
        consY = yLine - 18;
        litY = yBar + 15;
      } else {
        litY = yBar - 18;
        consY = yLine + 18;
      }
    }

    return { ...d, x, yBar, yLine, litY, consY };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.yLine}`).join(" ");

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* ປັອບອັບສະແດງລາຍລະອຽດລົດ (Tooltip) */}
      {tooltip &&
        (() => {
          const leftPercent = (tooltip.x / viewBoxWidth) * 100;
          let translateX = "-50%";
          let arrowLeft = "50%";
          if (leftPercent < 25) {
            translateX = "-20%";
            arrowLeft = "20%";
          } else if (leftPercent > 75) {
            translateX = "-80%";
            arrowLeft = "80%";
          }

          return (
            <div
              className="absolute z-50 bg-gray-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl text-xs sm:text-sm transform pointer-events-none w-max min-w-[200px] max-w-[260px] border border-gray-600/50 flex flex-col"
              style={{
                left: `${leftPercent}%`,
                top: `${(tooltip.y / viewBoxHeight) * 100}%`,
                marginTop: "-15px",
                transform: `translate(${translateX}, -100%)`,
              }}
            >
              {/* Tooltip Arrow */}
              <div
                className="absolute w-3 h-3 bg-gray-800 border-b border-r border-gray-600/50 transform rotate-45 -bottom-1.5"
                style={{ left: arrowLeft, marginLeft: "-6px" }}
              ></div>

              <p className="font-bold border-b border-gray-600/50 pb-1.5 mb-1.5 text-center text-orange-400 w-full">
                {tooltip.label}
              </p>
              {tooltip.carDetailsArray && tooltip.carDetailsArray.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 w-full">
                  {tooltip.carDetailsArray.map((car, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white/10 hover:bg-white/20 transition p-1.5 rounded-lg gap-3"
                    >
                      <span className="font-bold text-gray-100 truncate flex-1">
                        {car.plate}
                      </span>
                      <div className="text-right flex flex-col shrink-0">
                        <span className="text-orange-400 font-bold">
                          {formatInteger(car.actualPaid)} ₭
                        </span>
                        <span className="text-gray-300 text-[10px]">
                          {formatNumber(car.liters)} L
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-2">
                  ບໍ່ມີຂໍ້ມູນລົດແຍກຍ່ອຍ
                </p>
              )}
            </div>
          );
        })()}

      <div className="w-full bg-white">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-auto font-lao overflow-visible"
        >
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + height * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={viewBoxWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#6b7280"
                  fontSize={isMobile ? "10" : "12"}
                  fontWeight="bold"
                >
                  {formatBar(maxBarVal * ratio)}
                </text>
                <text
                  x={viewBoxWidth - padding.right + 8}
                  y={y + 4}
                  textAnchor="start"
                  fill="#6b7280"
                  fontSize={isMobile ? "10" : "12"}
                  fontWeight="bold"
                >
                  {formatLine(maxLineVal * ratio)}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left - 8}
            y={padding.top - 15}
            textAnchor="end"
            fill={barTextColor}
            fontSize={isMobile ? "10" : "12"}
            fontWeight="900"
          >
            {barUnit}
          </text>
          <text
            x={viewBoxWidth - padding.right + 8}
            y={padding.top - 15}
            textAnchor="start"
            fill={lineTextColor}
            fontSize={isMobile ? "10" : "12"}
            fontWeight="900"
          >
            {lineUnit}
          </text>

          {/* Bars */}
          {points.map((p, i) => {
            const barHeight = padding.top + height - p.yBar;
            const isMany = data.length > 12;
            const labelY = viewBoxHeight - padding.bottom + (isMany ? 25 : 20);
            const isHovered = tooltip && tooltip.key === p.key;

            return (
              <g
                key={`bar-${i}`}
                onMouseEnter={() => setTooltip({ ...p, y: p.yBar })}
                onMouseLeave={() => setTooltip(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setTooltip(
                    tooltip && tooltip.key === p.key
                      ? null
                      : { ...p, y: p.yBar },
                  );
                }}
                className="cursor-pointer"
              >
                {/* ພື້ນທີ່ໂປ່ງໃສເພີ່ມພື້ນທີ່ຮັບການຄລິກ/hover */}
                <rect
                  x={p.x - barWidth}
                  y={padding.top}
                  width={barWidth * 2}
                  height={height}
                  fill="transparent"
                />

                <rect
                  x={p.x - barWidth / 2}
                  y={p.yBar}
                  width={barWidth}
                  height={Math.max(0, barHeight)}
                  fill={isHovered ? barColorHover : barColor}
                  rx="4"
                  className="transition-colors duration-200"
                />

                <text
                  x={p.x}
                  y={labelY}
                  textAnchor={isMany ? "end" : "middle"}
                  fill="#1f2937"
                  fontSize={isMobile ? "9" : "11"}
                  fontWeight="bold"
                  transform={isMany ? `rotate(-45, ${p.x}, ${labelY})` : ""}
                >
                  {p.label}
                </text>

                {showValues && p[barKey] > 0 && (
                  <>
                    <text
                      x={p.x}
                      y={p.litY}
                      textAnchor="middle"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinejoin="round"
                      fontSize={isMobile ? "10" : "11"}
                      fontWeight="900"
                    >
                      {formatBar(p[barKey])}
                    </text>
                    <text
                      x={p.x}
                      y={p.litY}
                      textAnchor="middle"
                      fill={barTextColor}
                      fontSize={isMobile ? "10" : "11"}
                      fontWeight="900"
                    >
                      {formatBar(p[barKey])}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Line */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke={lineColor}
            strokeWidth={isMobile ? "2" : "3"}
            pointerEvents="none"
          />

          {/* Points */}
          {points.map((p, i) => (
            <g key={`point-${i}`} pointerEvents="none">
              <circle
                cx={p.x}
                cy={p.yLine}
                r={isMobile ? "3" : "4"}
                fill="#ffffff"
                stroke={lineColor}
                strokeWidth="2"
              />
              {showValues && p[lineKey] > 0 && (
                <>
                  <text
                    x={p.x}
                    y={p.consY}
                    textAnchor="middle"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    fontSize={isMobile ? "10" : "11"}
                    fontWeight="900"
                  >
                    {formatLine(p[lineKey])}
                  </text>
                  <text
                    x={p.x}
                    y={p.consY}
                    textAnchor="middle"
                    fill={lineTextColor}
                    fontSize={isMobile ? "10" : "11"}
                    fontWeight="900"
                  >
                    {formatLine(p[lineKey])}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 md:mt-6 text-xs md:text-sm text-gray-600 font-bold font-lao">
          <div className="flex items-center space-x-1.5 md:space-x-2">
            <div
              className="w-3 h-3 md:w-4 md:h-4 rounded"
              style={{ backgroundColor: barColor }}
            ></div>
            <span>
              {barName} ({barUnit})
            </span>
          </div>
          <div className="flex items-center space-x-1.5 md:space-x-2">
            <div
              className="w-3 h-1 md:w-4 md:h-1 rounded"
              style={{ backgroundColor: lineColor }}
            ></div>
            <div
              className="w-2.5 h-2.5 md:w-3 md:h-3 bg-white border-2 rounded-full -ml-2.5 md:-ml-3"
              style={{ borderColor: lineColor }}
            ></div>
            <span>
              {lineName} ({lineUnit})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ logs, cars }) {
  const totalLiters = logs.reduce(
    (sum, log) => sum + Number(log.liters || 0),
    0,
  );
  const totalCost = logs.reduce(
    (sum, log) => sum + Number(log.actualPaid || 0),
    0,
  );
  const totalCars = cars ? cars.length : 0;

  const monthlyData = useMemo(() => {
    const grouped = {};
    logs.forEach((log) => {
      const localDateStr = getLaosDateString(log.date);
      if (!localDateStr) return;
      const monthKey = localDateStr.substring(0, 7); // "YYYY-MM"
      if (!grouped[monthKey]) {
        const [y, m] = monthKey.split("-");
        grouped[monthKey] = {
          key: monthKey,
          label: `${m}/${y}`,
          liters: 0,
          distance: 0,
          validLiters: 0,
          actualPaid: 0,
          cars: {},
        };
      }
      const l = Number(log.liters || 0);
      const d = Number(log.distance || 0);
      const p = Number(log.actualPaid || 0);
      const plate = log.licensePlate || "ບໍ່ລະບຸ";

      grouped[monthKey].liters += l;
      grouped[monthKey].actualPaid += p;
      if (d > 0) {
        grouped[monthKey].distance += d;
        grouped[monthKey].validLiters += l;
      }

      if (!grouped[monthKey].cars[plate]) {
        grouped[monthKey].cars[plate] = { liters: 0, actualPaid: 0 };
      }
      grouped[monthKey].cars[plate].liters += l;
      grouped[monthKey].cars[plate].actualPaid += p;
    });

    const sorted = Object.values(grouped)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6);

    return sorted.map((item) => {
      const carDetailsArray = Object.keys(item.cars)
        .map((plate) => ({
          plate,
          liters: item.cars[plate].liters,
          actualPaid: item.cars[plate].actualPaid,
        }))
        .sort((a, b) => b.actualPaid - a.actualPaid); // ລຽງຕາມຍອດເງິນຫຼາຍໄປໜ້ອຍ

      return {
        ...item,
        carDetailsArray,
        consumption:
          item.validLiters > 0
            ? Number((item.distance / item.validLiters).toFixed(2))
            : 0,
      };
    });
  }, [logs]);

  return (
    <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3 md:space-x-4 hover:shadow-md transition overflow-hidden">
          <div className="bg-purple-100 p-2.5 md:p-4 rounded-full text-purple-500 shrink-0">
            <Car className="w-5 h-5 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-[10px] md:text-sm font-bold truncate">
              ຈຳນວນລົດ (ຄັນ)
            </p>
            <p
              className="text-lg md:text-2xl lg:text-3xl font-black text-gray-800 truncate"
              title={totalCars}
            >
              {formatInteger(totalCars)}
            </p>
          </div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3 md:space-x-4 hover:shadow-md transition overflow-hidden">
          <div className="bg-blue-100 p-2.5 md:p-4 rounded-full text-blue-500 shrink-0">
            <List className="w-5 h-5 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-[10px] md:text-sm font-bold truncate">
              ຈຳນວນຄັ້ງທີ່ເຕີມ
            </p>
            <p
              className="text-lg md:text-2xl lg:text-3xl font-black text-gray-800 truncate"
              title={logs.length}
            >
              {formatInteger(logs.length)}
            </p>
          </div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3 md:space-x-4 hover:shadow-md transition overflow-hidden">
          <div className="bg-orange-100 p-2.5 md:p-4 rounded-full text-orange-500 shrink-0">
            <Droplet className="w-5 h-5 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-[10px] md:text-sm font-bold truncate">
              ນ້ຳມັນລວມ (ລິດ)
            </p>
            <p
              className="text-lg md:text-2xl lg:text-3xl font-black text-gray-800 truncate"
              title={formatNumber(totalLiters)}
            >
              {formatNumber(totalLiters)}
            </p>
          </div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3 md:space-x-4 hover:shadow-md transition overflow-hidden">
          <div className="bg-green-100 p-2.5 md:p-4 rounded-full text-green-500 shrink-0">
            <FileText className="w-5 h-5 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-[10px] md:text-sm font-bold truncate">
              ຄ່ານ້ຳມັນລວມ (ກີບ)
            </p>
            <p
              className="text-lg md:text-2xl lg:text-3xl font-black text-gray-800 truncate"
              title={formatInteger(totalCost)}
            >
              {formatInteger(totalCost)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-4 md:mb-6 font-lao flex items-center">
          <Activity className="w-4 h-4 md:w-5 md:h-5 mr-2 text-orange-500" />{" "}
          ກາຟຄ່ານ້ຳມັນລວມ ແລະ ປະລິມານນ້ຳມັນ (6 ເດືອນຫຼ້າສຸດ)
        </h3>
        <FuelChart
          data={monthlyData}
          barKey="actualPaid"
          barName="ຄ່ານ້ຳມັນລວມ"
          barUnit="ກີບ"
          formatBar={formatInteger}
          barColor="#fdba74"
          barColorHover="#f97316"
          barTextColor="#9a3412"
          lineKey="liters"
          lineName="ປະລິມານນ້ຳມັນ"
          lineUnit="ລິດ"
          formatLine={formatNumber}
          lineColor="#3b82f6"
          lineTextColor="#1e3a8a"
        />
      </div>
    </div>
  );
}

function LogList({ logs, onEdit, onDelete, setView, role, cars, onRefresh }) {
  const [filterDate, setFilterDate] = useState("");
  const [filterPlate, setFilterPlate] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const filteredLogs = logs.filter((log) => {
    const logDateLocal = getLaosDateString(log.date);
    const matchDate = filterDate ? logDateLocal === filterDate : true;
    const matchPlate = filterPlate ? log.licensePlate === filterPlate : true;
    return matchDate && matchPlate;
  });

  const sortedLogs = useMemo(() => {
    let sortableItems = [...filteredLogs];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (["liters", "actualPaid", "odometer"].includes(sortConfig.key)) {
          aValue = Number(aValue || 0);
          bValue = Number(bValue || 0);
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredLogs, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey)
      return (
        <ArrowUpDown className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-gray-400 opacity-50" />
      );
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-orange-500" />
    ) : (
      <ArrowDown className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-orange-500" />
    );
  };

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-base md:text-lg font-bold text-gray-800 font-lao flex items-center space-x-2">
          <span>ປະຫວັດການໃສ່ນ້ຳມັນ</span>
          <button
            onClick={onRefresh}
            className="p-1.5 md:p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </h3>
        <button
          onClick={() => setView("form")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1 md:space-x-2 transition shadow-md md:shadow-lg shadow-orange-200"
        >
          <Plus className="w-3 h-3 md:w-4 h-4" /> <span>ເພີ່ມໃໝ່</span>
        </button>
      </div>

      <div className="p-4 md:p-5 border-b border-gray-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
        <div className="flex flex-col z-20 relative min-w-0 w-full">
          <label className="text-[10px] md:text-xs font-bold text-gray-500 mb-1.5 md:mb-2">
            ຄົ້ນຫາຕາມວັນທີ:
          </label>
          <div className="relative w-full min-w-0">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="block w-full min-w-full h-[40px] md:h-[48px] pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 border border-gray-300 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-xs md:text-sm font-medium bg-gray-50 focus:bg-white box-border appearance-none m-0"
            />
            <Filter className="w-3 h-3 md:w-4 h-4 text-gray-400 absolute left-2.5 md:left-3.5 top-2.5 md:top-3 pointer-events-none" />
          </div>
        </div>
        <div className="flex flex-col z-20 relative min-w-0 w-full">
          <SearchableSelect
            label="ຄົ້ນຫາຕາມທະບຽນລົດ:"
            placeholder="-- ທັງໝົດ --"
            value={filterPlate}
            options={cars}
            onChange={(val) => setFilterPlate(val)}
            showAllOption={true}
            labelClassName="text-[10px] md:text-xs font-bold text-gray-500 mb-1.5 md:mb-2"
          />
        </div>
        <div className="flex items-end z-10 relative">
          <button
            onClick={() => {
              setFilterDate("");
              setFilterPlate("");
              setSortConfig({ key: "date", direction: "desc" });
            }}
            className="px-4 md:px-5 h-[40px] md:h-[48px] text-xs md:text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg md:rounded-xl font-bold transition w-full md:w-auto"
          >
            ລ້າງການຄົ້ນຫາ/ຈັດລຽງ
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-[65vh]">
        <table className="w-full text-left text-xs md:text-sm text-gray-600 whitespace-nowrap relative">
          <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] md:text-xs border-b border-gray-100 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr>
              <th className="px-3 py-3 md:px-4 md:py-4 w-10 md:w-12 text-center text-gray-500 font-bold bg-gray-50">
                ລ/ດ
              </th>
              <th
                className="px-3 py-3 md:px-6 md:py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                onClick={() => requestSort("date")}
              >
                ວັນທີ {renderSortIcon("date")}
              </th>
              <th
                className="px-3 py-3 md:px-6 md:py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                onClick={() => requestSort("licensePlate")}
              >
                ທະບຽນລົດ {renderSortIcon("licensePlate")}
              </th>
              <th
                className="px-3 py-3 md:px-6 md:py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                onClick={() => requestSort("liters")}
              >
                ລິດ {renderSortIcon("liters")}
              </th>
              <th
                className="px-3 py-3 md:px-6 md:py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                onClick={() => requestSort("actualPaid")}
              >
                ຈ່າຍຈິງ (ກີບ) {renderSortIcon("actualPaid")}
              </th>
              <th
                className="px-3 py-3 md:px-6 md:py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                onClick={() => requestSort("odometer")}
              >
                ເລກຫຼັກລົດ (ກມ) {renderSortIcon("odometer")}
              </th>
              <th className="px-3 py-3 md:px-6 md:py-4 text-center font-bold bg-gray-50">
                ຮູບພາບ
              </th>
              <th className="px-3 py-3 md:px-6 md:py-4 text-center font-bold bg-gray-50">
                ຈັດການ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedLogs.length > 0 ? (
              sortedLogs.map((log, index) => (
                <tr key={log.id} className="hover:bg-orange-50/50 transition">
                  <td className="px-3 py-3 md:px-4 md:py-4 text-center text-gray-400 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-3 py-3 md:px-6 md:py-4 font-medium">
                    {formatDateDisplay(log.date)}
                  </td>
                  <td className="px-3 py-3 md:px-6 md:py-4 font-black text-gray-800">
                    {log.licensePlate}
                  </td>
                  <td className="px-3 py-3 md:px-6 md:py-4">
                    {formatNumber(log.liters)}
                  </td>
                  <td className="px-3 py-3 md:px-6 md:py-4 text-orange-600 font-black">
                    {formatInteger(log.actualPaid)}
                  </td>
                  <td className="px-3 py-3 md:px-6 md:py-4">
                    {formatInteger(log.odometer)}
                  </td>
                  <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                    <div className="flex justify-center space-x-1.5 md:space-x-2">
                      {log.receiptUrl && log.receiptUrl.startsWith("http") ? (
                        <a
                          href={log.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-1.5 py-1 md:px-2 md:py-1 bg-orange-100 text-orange-600 font-bold rounded md:rounded-lg hover:bg-orange-200 transition flex items-center space-x-1"
                          title="ເບິ່ງຮູບບິນ"
                        >
                          <ExternalLink className="w-2.5 h-2.5 md:w-3 h-3" />{" "}
                          <span>ບິນ</span>
                        </a>
                      ) : (
                        <span className="text-gray-300 text-[10px] md:text-xs px-1.5 py-1">
                          -
                        </span>
                      )}
                      {log.odometerUrl && log.odometerUrl.startsWith("http") ? (
                        <a
                          href={log.odometerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-1.5 py-1 md:px-2 md:py-1 bg-blue-100 text-blue-600 font-bold rounded md:rounded-lg hover:bg-blue-200 transition flex items-center space-x-1"
                          title="ເບິ່ງຮູບເລກກິໂລ"
                        >
                          <ExternalLink className="w-2.5 h-2.5 md:w-3 h-3" />{" "}
                          <span>ກິໂລ</span>
                        </a>
                      ) : (
                        <span className="text-gray-300 text-[10px] md:text-xs px-1.5 py-1">
                          -
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                    <div className="flex justify-center space-x-1.5 md:space-x-2">
                      <button
                        onClick={() => onEdit(log.id)}
                        className="p-1.5 md:p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded md:rounded-lg transition"
                      >
                        <Edit className="w-3 h-3 md:w-4 h-4" />
                      </button>
                      {(role === "admin" || role === "user") && (
                        <button
                          onClick={() => onDelete(log.id)}
                          className="p-1.5 md:p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded md:rounded-lg transition"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="text-center py-12 md:py-16 text-gray-400 text-xs md:text-sm"
                >
                  ບໍ່ມີຂໍ້ມູນທີ່ກົງກັບການຄົ້ນຫາ (ຫຼື
                  ທ່ານຍັງບໍ່ໄດ້ຮັບສິດໃຫ້ເຫັນລົດຄັນໃດ)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FuelForm({ onSave, onCancel, initialData, allLogs, cars }) {
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      let editDate = getLaosDateString(initialData.date) || "";
      return { ...initialData, date: editDate };
    }
    return {
      date: getLaosDateString(new Date()),
      licensePlate: "",
      liters: "",
      pricePerLiter: "",
      totalPrice: "0.00",
      actualPaid: "",
      difference: "0.00",
      odometer: "",
      distance: "0.00",
      consumption: "0.00",
      receiptUrl: "",
      odometerUrl: "",
    };
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newData = { ...formData, [name]: value };

    const liters = parseFloat(newData.liters) || 0;
    const price = parseFloat(newData.pricePerLiter) || 0;
    const paid = parseFloat(newData.actualPaid) || 0;

    newData.totalPrice = (liters * price).toFixed(2);
    newData.difference = (liters * price - paid).toFixed(2);

    if (name === "licensePlate" || name === "odometer" || name === "liters") {
      const currentOdo = parseFloat(newData.odometer) || 0;
      const pastLogs = allLogs.filter(
        (l) => l.licensePlate === newData.licensePlate && l.id !== formData.id,
      );
      let prevOdo = 0;
      if (pastLogs.length > 0) {
        prevOdo = Math.max(...pastLogs.map((l) => parseFloat(l.odometer) || 0));
      }
      const dist =
        prevOdo > 0 && currentOdo > prevOdo ? currentOdo - prevOdo : 0;
      newData.distance = dist.toFixed(2);
      newData.consumption =
        dist > 0 && liters > 0 ? (dist / liters).toFixed(2) : "0.00";
    }
    setFormData(newData);
  };

  const handleImageUpload = (e, fieldPrefix) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [`${fieldPrefix}Url`]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 font-lao animate-in slide-in-from-bottom-4 duration-300 mb-4">
      <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4 md:mb-8 border-b pb-3 md:pb-4 flex items-center space-x-2 md:space-x-3">
        <div className="bg-orange-100 p-1.5 md:p-2 rounded-lg">
          <Droplet className="text-orange-500 w-5 h-5 md:w-6 h-6" />
        </div>
        <span>{initialData ? "ແກ້ໄຂຂໍ້ມູນ" : "ບັນທຶກການໃສ່ນ້ຳມັນ"}</span>
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
        }}
        className="space-y-6 md:space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          <div className="space-y-4 md:space-y-5 min-w-0">
            <div className="relative min-w-0 w-full">
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                ວັນທີ
              </label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="block w-full min-w-full h-[40px] md:h-[48px] px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-gray-50 hover:bg-white font-medium text-xs md:text-base box-border appearance-none m-0"
              />
            </div>

            <div className="z-20 relative min-w-0 w-full">
              <SearchableSelect
                label="ທະບຽນລົດ (ສະເພາະລົດທີ່ໄດ້ຮັບສິດ)"
                placeholder="-- ເລືອກ ຫຼື ພິມຄົ້ນຫາທະບຽນລົດ --"
                value={formData.licensePlate}
                options={cars}
                onChange={(val) =>
                  handleChange({ target: { name: "licensePlate", value: val } })
                }
                labelClassName="block text-xs md:text-sm font-bold text-gray-700 mb-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-5 z-10 relative">
              <div className="min-w-0">
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                  ຈຳນວນ (ລິດ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="liters"
                  required
                  value={formData.liters}
                  onChange={handleChange}
                  className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-gray-50 hover:bg-white font-medium text-sm md:text-base box-border"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                  ລາຄາ/ລິດ (ກີບ)
                </label>
                <input
                  type="number"
                  name="pricePerLiter"
                  required
                  value={formData.pricePerLiter}
                  onChange={handleChange}
                  className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-gray-50 hover:bg-white font-medium text-sm md:text-base box-border"
                />
              </div>
            </div>

            <div className="bg-orange-50 p-4 md:p-6 rounded-xl md:rounded-2xl space-y-3 md:space-y-4 border border-orange-100 shadow-inner z-0 relative min-w-0">
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-gray-600 font-medium">
                  ລາຄາລວມ (Auto):
                </span>
                <span className="text-base md:text-lg font-black text-gray-800">
                  {formatInteger(formData.totalPrice)} ກີບ
                </span>
              </div>
              <div className="min-w-0">
                <label className="block text-xs md:text-sm font-black text-gray-800 mb-1.5 md:mb-2">
                  ລາຄາຈ່າຍຈິງ (ກີບ)
                </label>
                <input
                  type="number"
                  name="actualPaid"
                  required
                  value={formData.actualPaid}
                  onChange={handleChange}
                  className="w-full min-w-0 h-[48px] md:h-[56px] px-3 md:px-4 border-2 border-orange-300 rounded-lg md:rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition font-bold text-lg md:text-xl text-orange-600 box-border"
                />
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm pt-2.5 md:pt-3 border-t border-orange-200">
                <span className="text-gray-600 font-medium">
                  ສ່ວນຕ່າງ (Auto):
                </span>
                <span
                  className={`text-base md:text-lg font-black ${Number(formData.difference) < 0 ? "text-red-500" : "text-green-600"}`}
                >
                  {Number(formData.difference) > 0 ? "+" : ""}
                  {formatInteger(formData.difference)} ກີບ
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 md:space-y-5 min-w-0">
            <div className="min-w-0">
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">
                ເລກຫຼັກລົດ (ກມ.)
              </label>
              <input
                type="number"
                name="odometer"
                required
                value={formData.odometer}
                onChange={handleChange}
                className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-gray-50 hover:bg-white font-medium text-sm md:text-base box-border"
              />
            </div>

            <div className="bg-blue-50 p-4 md:p-6 rounded-xl md:rounded-2xl space-y-2 md:space-y-3 border border-blue-100 text-xs md:text-sm shadow-inner min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  ໄລຍະທາງຫຼັງເຕີມລ່າສຸດ:
                </span>
                <span className="text-lg md:text-xl font-black text-blue-600">
                  {formatNumber(formData.distance)}{" "}
                  <span className="text-xs md:text-sm font-normal">ກມ.</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  ອັດຕາສິ້ນເປືອງ:
                </span>
                <span className="text-lg md:text-xl font-black text-blue-600">
                  {formatNumber(formData.consumption)}{" "}
                  <span className="text-xs md:text-sm font-normal">
                    ກມ./ລິດ
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-5 pt-2 md:pt-3">
              <div className="border-2 border-dashed border-gray-300 rounded-xl md:rounded-2xl p-0 hover:border-orange-400 hover:bg-orange-50 transition relative overflow-hidden group h-28 md:h-40 flex flex-col justify-center items-center cursor-pointer bg-gray-50">
                {formData.receiptUrl ? (
                  <div className="absolute inset-0 w-full h-full z-10">
                    <img
                      src={formData.receiptUrl}
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white font-bold px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-black bg-opacity-60 rounded-lg md:rounded-xl backdrop-blur-sm flex items-center space-x-1.5 md:space-x-2">
                        <Edit className="w-3 h-3 md:w-4 h-4" />{" "}
                        <span>ປ່ຽນຮູບ</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-0 flex flex-col items-center p-3 md:p-4">
                    <div className="bg-white p-2 md:p-3 rounded-full shadow-sm mb-2 md:mb-3 group-hover:scale-110 transition">
                      <ImageIcon className="w-5 h-5 md:w-6 h-6 text-orange-400" />
                    </div>
                    <span className="text-xs md:text-sm text-gray-700 font-bold">
                      ອັບໂຫຼດ ຮູບບິນ
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "receipt")}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl md:rounded-2xl p-0 hover:border-orange-400 hover:bg-orange-50 transition relative overflow-hidden group h-28 md:h-40 flex flex-col justify-center items-center cursor-pointer bg-gray-50">
                {formData.odometerUrl ? (
                  <div className="absolute inset-0 w-full h-full z-10">
                    <img
                      src={formData.odometerUrl}
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white font-bold px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-black bg-opacity-60 rounded-lg md:rounded-xl backdrop-blur-sm flex items-center space-x-1.5 md:space-x-2">
                        <Edit className="w-3 h-3 md:w-4 h-4" />{" "}
                        <span>ປ່ຽນຮູບ</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-0 flex flex-col items-center p-3 md:p-4">
                    <div className="bg-white p-2 md:p-3 rounded-full shadow-sm mb-2 md:mb-3 group-hover:scale-110 transition">
                      <ImageIcon className="w-5 h-5 md:w-6 h-6 text-orange-400" />
                    </div>
                    <span className="text-xs md:text-sm text-gray-700 font-bold">
                      ອັບໂຫຼດ ຮູບເລກກິໂລ
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "odometer")}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 md:space-x-4 pt-6 md:pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 md:px-8 py-2.5 md:py-3.5 text-sm md:text-base text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg md:rounded-xl transition"
          >
            ຍົກເລີກ
          </button>
          <button
            type="submit"
            className="px-6 md:px-8 py-2.5 md:py-3.5 text-sm md:text-base text-white bg-orange-500 hover:bg-orange-600 font-bold rounded-lg md:rounded-xl transition shadow-md md:shadow-lg shadow-orange-200 transform hover:-translate-y-0.5"
          >
            ບັນທຶກຂໍ້ມູນ
          </button>
        </div>
      </form>
    </div>
  );
}

function FuelReport({ logs, cars, onRefresh }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPlate, setSelectedPlate] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [expandedGroup, setExpandedGroup] = useState(null);

  const filteredLogs = logs.filter((l) => {
    const logDateStr = getLaosDateString(l.date);
    const d = new Date(logDateStr);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    let matchDate = true;
    if (start && d < start) matchDate = false;
    if (end && d > end) matchDate = false;

    const matchPlate = selectedPlate ? l.licensePlate === selectedPlate : true;

    return matchDate && matchPlate;
  });

  const chartData = useMemo(() => {
    let isDayGrouping = false;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
      if (diffDays <= 31) isDayGrouping = true;
    } else if (startDate || endDate) {
      isDayGrouping = true;
    }

    const grouped = {};
    filteredLogs.forEach((log) => {
      const localDateStr = getLaosDateString(log.date);
      if (!localDateStr) return;

      let key = localDateStr;
      let label = formatDateDisplay(localDateStr).substring(0, 5);

      if (!isDayGrouping) {
        key = localDateStr.substring(0, 7);
        const [y, m] = key.split("-");
        label = `${m}/${y}`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          key,
          label,
          liters: 0,
          distance: 0,
          validLiters: 0,
          actualPaid: 0,
          cars: {},
        };
      }
      const l = Number(log.liters || 0);
      const d = Number(log.distance || 0);
      const p = Number(log.actualPaid || 0);
      const plate = log.licensePlate || "ບໍ່ລະບຸ";

      grouped[key].liters += l;
      grouped[key].actualPaid += p;
      if (d > 0) {
        grouped[key].distance += d;
        grouped[key].validLiters += l;
      }

      if (!grouped[key].cars[plate]) {
        grouped[key].cars[plate] = { liters: 0, actualPaid: 0 };
      }
      grouped[key].cars[plate].liters += l;
      grouped[key].cars[plate].actualPaid += p;
    });

    const sorted = Object.values(grouped).sort((a, b) =>
      a.key.localeCompare(b.key),
    );

    return sorted.map((item) => {
      const carDetailsArray = Object.keys(item.cars)
        .map((plate) => ({
          plate,
          liters: item.cars[plate].liters,
          actualPaid: item.cars[plate].actualPaid,
        }))
        .sort((a, b) => b.actualPaid - a.actualPaid);

      return {
        ...item,
        carDetailsArray,
        consumption:
          item.validLiters > 0
            ? Number((item.distance / item.validLiters).toFixed(2))
            : 0,
      };
    });
  }, [filteredLogs, startDate, endDate]);

  const summary = {};
  filteredLogs.forEach((log) => {
    let rawDate = getLaosDateString(log.date);
    const key = `${rawDate}_${log.licensePlate}`;

    if (!summary[key]) {
      summary[key] = {
        date: rawDate,
        plate: log.licensePlate,
        count: 0,
        liters: 0,
        actualPaid: 0,
        details: [],
      };
    }
    summary[key].count += 1;
    summary[key].liters += Number(log.liters || 0);
    summary[key].actualPaid += Number(log.actualPaid || 0);
    summary[key].details.push(log);
  });

  const reportData = useMemo(() => {
    let rawData = Object.values(summary);

    if (sortConfig.key !== null) {
      rawData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (["count", "liters", "actualPaid"].includes(sortConfig.key)) {
          aValue = Number(aValue || 0);
          bValue = Number(bValue || 0);
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      rawData.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return rawData;
  }, [summary, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey)
      return (
        <ArrowUpDown className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-gray-400 opacity-50" />
      );
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-orange-500" />
    ) : (
      <ArrowDown className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-orange-500" />
    );
  };

  const toggleGroup = (key) => {
    if (expandedGroup === key) setExpandedGroup(null);
    else setExpandedGroup(key);
  };

  const grandTotalLiters = reportData.reduce((sum, row) => sum + row.liters, 0);
  const grandTotalCost = reportData.reduce(
    (sum, row) => sum + row.actualPaid,
    0,
  );

  let validDistance = 0;
  let validLitersForAvg = 0;
  filteredLogs.forEach((log) => {
    const d = Number(log.distance || 0);
    const l = Number(log.liters || 0);
    if (d > 0) {
      validDistance += d;
      validLitersForAvg += l;
    }
  });
  const averageConsumption =
    validLitersForAvg > 0
      ? (validDistance / validLitersForAvg).toFixed(2)
      : "0.00";
  const grandTotalCount = filteredLogs.length;

  return (
    <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300 mb-4">
      <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-base md:text-xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center space-x-2 md:space-x-3 border-b pb-3 md:pb-4">
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <div className="bg-orange-100 p-1.5 md:p-2 rounded-lg shrink-0">
              <Activity className="text-orange-500 w-4 h-4 md:w-6 h-6" />
            </div>
            <span className="truncate">ລາຍງານການເຕີມນ້ຳມັນ</span>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 md:p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition ml-auto shrink-0"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
          <div className="flex flex-col z-20 relative min-w-0 w-full">
            <label className="text-[10px] md:text-xs font-bold text-gray-500 mb-1.5 md:mb-2">
              ຕັ້ງແຕ່ວັນທີ:
            </label>
            <div className="relative w-full min-w-0">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full min-w-full h-[40px] md:h-[48px] px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-xs md:text-sm font-medium bg-gray-50 focus:bg-white transition box-border appearance-none m-0"
              />
            </div>
          </div>
          <div className="flex flex-col z-20 relative min-w-0 w-full">
            <label className="text-[10px] md:text-xs font-bold text-gray-500 mb-1.5 md:mb-2">
              ເຖິງວັນທີ:
            </label>
            <div className="relative w-full min-w-0">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full min-w-full h-[40px] md:h-[48px] px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-xs md:text-sm font-medium bg-gray-50 focus:bg-white transition box-border appearance-none m-0"
              />
            </div>
          </div>
          <div className="flex flex-col z-20 relative min-w-0 w-full">
            <SearchableSelect
              label="ທະບຽນລົດ:"
              placeholder="-- ທັງໝົດ --"
              value={selectedPlate}
              options={cars}
              onChange={(val) => setSelectedPlate(val)}
              showAllOption={true}
              labelClassName="text-[10px] md:text-xs font-bold text-gray-500 mb-1.5 md:mb-2"
            />
          </div>
          <div className="flex items-end z-10 relative">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSelectedPlate("");
                setSortConfig({ key: "date", direction: "desc" });
                setExpandedGroup(null);
              }}
              className="px-4 md:px-5 h-[40px] md:h-[48px] w-full text-xs md:text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg md:rounded-xl font-bold transition"
            >
              ລ້າງການຄົ້ນຫາ/ຈັດລຽງ
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="bg-orange-50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-orange-100 flex flex-col justify-center shadow-inner min-w-0">
            <span className="text-orange-800 font-bold text-[10px] md:text-sm mb-0.5 md:mb-1 truncate">
              ລວມຈຳນວນລິດ (ທີ່ກັ່ນຕອງ):
            </span>
            <span
              className="text-lg md:text-2xl font-black text-orange-600 truncate"
              title={`${formatNumber(grandTotalLiters)} ລິດ`}
            >
              {formatNumber(grandTotalLiters)}{" "}
              <span className="text-xs md:text-sm font-bold">ລິດ</span>
            </span>
          </div>
          <div className="bg-green-50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-green-100 flex flex-col justify-center shadow-inner min-w-0">
            <span className="text-green-800 font-bold text-[10px] md:text-sm mb-0.5 md:mb-1 truncate">
              ລວມຄ່ານ້ຳມັນ (ທີ່ກັ່ນຕອງ):
            </span>
            <span
              className="text-lg md:text-2xl font-black text-green-600 truncate"
              title={`${formatInteger(grandTotalCost)} ກີບ`}
            >
              {formatInteger(grandTotalCost)}{" "}
              <span className="text-xs md:text-sm font-bold">ກີບ</span>
            </span>
          </div>
          <div className="bg-blue-50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-blue-100 flex flex-col justify-center shadow-inner min-w-0">
            <span className="text-blue-800 font-bold text-[10px] md:text-sm mb-0.5 md:mb-1 truncate">
              ອັດຕາການສິ້ນເປືອງສະເລ່ຍ:
            </span>
            <span
              className="text-lg md:text-2xl font-black text-blue-600 truncate"
              title={`${formatNumber(averageConsumption)} ກມ./ລິດ`}
            >
              {formatNumber(averageConsumption)}{" "}
              <span className="text-xs md:text-sm font-bold">ກມ./ລິດ</span>
            </span>
          </div>
          <div className="bg-purple-50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-purple-100 flex flex-col justify-center shadow-inner min-w-0">
            <span className="text-purple-800 font-bold text-[10px] md:text-sm mb-0.5 md:mb-1 truncate">
              ຈຳນວນຄັ້ງທີ່ເຕີມ (ທີ່ກັ່ນຕອງ):
            </span>
            <span
              className="text-lg md:text-2xl font-black text-purple-600 truncate"
              title={`${grandTotalCount} ຄັ້ງ`}
            >
              {grandTotalCount}{" "}
              <span className="text-xs md:text-sm font-bold">ຄັ້ງ</span>
            </span>
          </div>
        </div>

        {/* ກາຟລາຍງານແບບໄດນາມິກ ຕາມເງື່ອນໄຂຄົ້ນຫາ */}
        {filteredLogs.length > 0 && (
          <div className="bg-gray-50/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 mb-6 md:mb-8">
            <h4 className="text-sm md:text-base font-bold text-gray-800 mb-4 font-lao flex items-center">
              <Activity className="w-4 h-4 md:w-5 md:h-5 mr-2 text-orange-500" />{" "}
              ກາຟສະແດງຄ່ານ້ຳມັນລວມ ແລະ ປະລິມານນ້ຳມັນ (ຕາມເງື່ອນໄຂຄົ້ນຫາ)
            </h4>
            <FuelChart
              data={chartData}
              barKey="actualPaid"
              barName="ຄ່ານ້ຳມັນລວມ"
              barUnit="ກີບ"
              formatBar={formatInteger}
              barColor="#fdba74"
              barColorHover="#f97316"
              barTextColor="#9a3412"
              lineKey="liters"
              lineName="ປະລິມານນ້ຳມັນ"
              lineUnit="ລິດ"
              formatLine={formatNumber}
              lineColor="#3b82f6"
              lineTextColor="#1e3a8a"
            />
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full text-left text-xs md:text-sm text-gray-600 whitespace-nowrap relative">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] md:text-xs border-b border-gray-100 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <tr>
                  <th className="px-3 py-3 md:px-4 md:py-4 w-10 md:w-12 text-center text-gray-500 font-bold bg-gray-50">
                    ລ/ດ
                  </th>
                  <th
                    className="px-3 py-3 md:px-6 md:py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                    onClick={() => requestSort("date")}
                  >
                    ວັນທີ {renderSortIcon("date")}
                  </th>
                  <th
                    className="px-3 py-3 md:px-6 md:py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                    onClick={() => requestSort("plate")}
                  >
                    ທະບຽນລົດ {renderSortIcon("plate")}
                  </th>
                  <th
                    className="px-3 py-3 md:px-6 md:py-4 text-center cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                    onClick={() => requestSort("count")}
                  >
                    ຈຳນວນຄັ້ງ {renderSortIcon("count")}
                  </th>
                  <th
                    className="px-3 py-3 md:px-6 md:py-4 text-right cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                    onClick={() => requestSort("liters")}
                  >
                    ລວມນ້ຳມັນ (ລິດ) {renderSortIcon("liters")}
                  </th>
                  <th
                    className="px-3 py-3 md:px-6 md:py-4 text-right cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                    onClick={() => requestSort("actualPaid")}
                  >
                    ລວມຄ່ານ້ຳມັນ (ກີບ) {renderSortIcon("actualPaid")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.length > 0 ? (
                  reportData.map((row, idx) => {
                    const groupKey = row.date + "_" + row.plate;
                    const isExpanded = expandedGroup === groupKey;
                    return (
                      <React.Fragment key={idx}>
                        <tr
                          className="hover:bg-orange-50/50 transition cursor-pointer"
                          onClick={() => toggleGroup(groupKey)}
                        >
                          <td className="px-3 py-3 md:px-4 md:py-4 text-center text-gray-400 font-medium flex items-center justify-center space-x-1">
                            <span>{idx + 1}</span>
                            <ChevronDown
                              className={`w-3 h-3 md:w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-orange-500" : ""}`}
                            />
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 font-medium">
                            {formatDateDisplay(row.date)}
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 font-black text-gray-800">
                            {row.plate}
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 text-center bg-gray-50/50 font-bold text-gray-700">
                            {row.count}
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 text-right font-black text-orange-600">
                            {formatNumber(row.liters)}
                          </td>
                          <td className="px-3 py-3 md:px-6 md:py-4 text-right font-black text-green-600">
                            {formatInteger(row.actualPaid)}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td
                              colSpan="6"
                              className="p-0 bg-gray-50 border-b border-gray-200"
                            >
                              <div className="p-2 pl-6 md:p-4 md:pl-12 shadow-inner bg-orange-50/30">
                                <h4 className="text-xs md:text-sm font-bold text-gray-700 mb-2 md:mb-3 flex items-center space-x-1.5 md:space-x-2">
                                  <List className="w-3 h-3 md:w-4 h-4 text-orange-500" />
                                  <span>
                                    ລາຍລະອຽດການເຕີມ (ວັນທີ:{" "}
                                    {formatDateDisplay(row.date)})
                                  </span>
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-[10px] md:text-xs text-gray-600 whitespace-nowrap bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                                      <tr>
                                        <th className="px-2 py-2 md:px-4 md:py-3 font-bold text-center">
                                          ຄັ້ງທີ
                                        </th>
                                        <th className="px-2 py-2 md:px-4 md:py-3 font-bold">
                                          ຈຳນວນ (ລິດ)
                                        </th>
                                        <th className="px-2 py-2 md:px-4 md:py-3 font-bold">
                                          ລາຄາ/ລິດ (ກີບ)
                                        </th>
                                        <th className="px-2 py-2 md:px-4 md:py-3 font-bold">
                                          ຈ່າຍຈິງ (ກີບ)
                                        </th>
                                        <th className="px-2 py-2 md:px-4 md:py-3 font-bold">
                                          ໄລຍະທາງ (ກມ)
                                        </th>
                                        <th className="px-2 py-2 md:px-4 md:py-3 font-bold">
                                          ສິ້ນເປືອງ (ກມ/ລິດ)
                                        </th>
                                        <th className="px-2 py-2 md:px-4 md:py-3 font-bold text-center">
                                          ຮູບພາບ
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {row.details.map((det, dIdx) => (
                                        <tr
                                          key={det.id || dIdx}
                                          className="hover:bg-gray-50 transition"
                                        >
                                          <td className="px-2 py-2 md:px-4 md:py-2.5 text-center font-medium text-gray-500">
                                            {dIdx + 1}
                                          </td>
                                          <td className="px-2 py-2 md:px-4 md:py-2.5 font-bold">
                                            {formatNumber(det.liters)}
                                          </td>
                                          <td className="px-2 py-2 md:px-4 md:py-2.5">
                                            {formatInteger(det.pricePerLiter)}
                                          </td>
                                          <td className="px-2 py-2 md:px-4 md:py-2.5 font-bold text-green-600">
                                            {formatInteger(det.actualPaid)}
                                          </td>
                                          <td className="px-2 py-2 md:px-4 md:py-2.5">
                                            {formatNumber(det.distance)}
                                          </td>
                                          <td className="px-2 py-2 md:px-4 md:py-2.5 text-blue-600 font-medium">
                                            {formatNumber(det.consumption)}
                                          </td>
                                          <td className="px-2 py-2 md:px-4 md:py-2.5 flex justify-center space-x-1.5 md:space-x-2">
                                            {det.receiptUrl &&
                                            det.receiptUrl.startsWith(
                                              "http",
                                            ) ? (
                                              <a
                                                href={det.receiptUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-1.5 py-1 md:px-3 md:py-1 bg-orange-100 text-orange-600 font-bold rounded md:rounded-lg hover:bg-orange-200 transition flex items-center space-x-1"
                                                title="ເບິ່ງຮູບບິນ"
                                              >
                                                <ExternalLink className="w-2.5 h-2.5 md:w-3 h-3" />{" "}
                                                <span>ບິນ</span>
                                              </a>
                                            ) : (
                                              <span className="text-gray-300 text-[10px] md:text-xs px-1.5 py-1 md:px-2 md:py-1">
                                                -
                                              </span>
                                            )}
                                            {det.odometerUrl &&
                                            det.odometerUrl.startsWith(
                                              "http",
                                            ) ? (
                                              <a
                                                href={det.odometerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-1.5 py-1 md:px-3 md:py-1 bg-blue-100 text-blue-600 font-bold rounded md:rounded-lg hover:bg-blue-200 transition flex items-center space-x-1"
                                                title="ເບິ່ງຮູບເລກກິໂລ"
                                              >
                                                <ExternalLink className="w-2.5 h-2.5 md:w-3 h-3" />{" "}
                                                <span>ກິໂລ</span>
                                              </a>
                                            ) : (
                                              <span className="text-gray-300 text-[10px] md:text-xs px-1.5 py-1 md:px-2 md:py-1">
                                                -
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-12 md:py-16 text-gray-400 text-xs md:text-sm font-medium"
                    >
                      ບໍ່ມີຂໍ້ມູນລາຍງານໃນຊ່ວງເວລານີ້ (ຫຼື ທ່ານຍັງບໍ່ໄດ້ຮັບສິດ)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  showAllOption = false,
  labelClassName = "block text-xs md:text-sm font-bold text-gray-700 mb-1",
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const containerRef = React.useRef(null);

  const filteredOptions = (options || []).filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full min-w-0" ref={containerRef}>
      {label && <label className={labelClassName}>{label}</label>}
      <div
        className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 border border-gray-300 rounded-lg md:rounded-xl bg-gray-50 hover:bg-white flex justify-between items-center cursor-pointer focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition text-sm md:text-base box-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={
            value
              ? "text-gray-800 font-bold truncate"
              : "text-gray-400 font-medium truncate"
          }
        >
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 md:w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 md:mt-2 bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2.5 md:p-3 border-b border-gray-100 flex items-center space-x-2 md:space-x-3 bg-gray-50">
            <Search className="w-4 h-4 md:w-5 h-5 text-gray-400 shrink-0" />
            <input
              autoFocus
              className="w-full text-xs md:text-sm outline-none py-1 bg-transparent font-bold"
              placeholder="ພິມເພື່ອຄົ້ນຫາ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {showAllOption && (
              <div
                className={`px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm cursor-pointer transition border-b border-gray-50 ${!value ? "bg-orange-50 text-orange-600 font-bold" : "text-gray-700 hover:bg-gray-50 hover:text-orange-500 font-bold"}`}
                onClick={() => handleSelect("")}
              >
                -- ທັງໝົດ --
              </div>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  className={`px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm cursor-pointer transition border-b border-gray-50 last:border-0 ${value === opt ? "bg-orange-50 text-orange-600 font-bold" : "text-gray-700 hover:bg-gray-50 hover:text-orange-500 font-bold"}`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-4 md:px-5 py-4 md:py-6 text-center text-gray-400 text-xs md:text-sm font-medium">
                ບໍ່ພົບທະບຽນລົດໃນສິດຂອງທ່ານ
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UserManagement({ users, allCars, onSave, onDelete }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    username: "",
    password: "",
    role: "user",
    assignedCars: [],
  });

  const handleEdit = (u) => {
    setFormData({
      ...u,
      assignedCars: u.assignedCars || [],
    });
    setIsEditing(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "user",
      assignedCars: [],
    });
    setIsEditing(false);
  };

  const handleCarToggle = (car) => {
    setFormData((prev) => {
      const current = prev.assignedCars || [];
      if (current.includes(car)) {
        return { ...prev, assignedCars: current.filter((c) => c !== car) };
      } else {
        return { ...prev, assignedCars: [...current, car] };
      }
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center space-x-2 md:space-x-3 border-b pb-3 md:pb-4">
          <div className="bg-orange-100 p-1.5 md:p-2 rounded-lg">
            <ShieldCheck className="text-orange-500 w-5 h-5 md:w-6 h-6" />
          </div>
          <span>{isEditing ? "ແກ້ໄຂຜູ້ໃຊ້ງານ" : "ເພີ່ມຜູ້ໃຊ້ງານໃໝ່"}</span>
        </h3>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 items-end"
        >
          <div className="space-y-1 min-w-0">
            <label className="text-xs md:text-sm font-bold text-gray-700">
              ຊື່ແທ້
            </label>
            <input
              type="text"
              placeholder="ປ້ອນຊື່"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white transition font-medium text-sm md:text-base box-border"
              required
            />
          </div>
          <div className="space-y-1 min-w-0">
            <label className="text-xs md:text-sm font-bold text-gray-700">
              ຊື່ເຂົ້າລະບົບ
            </label>
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white transition font-medium text-sm md:text-base box-border"
              required
            />
          </div>
          <div className="space-y-1 min-w-0">
            <label className="text-xs md:text-sm font-bold text-gray-700">
              ລະຫັດຜ່ານ
            </label>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white transition font-medium text-sm md:text-base box-border"
              required
            />
          </div>
          <div className="space-y-1 min-w-0">
            <label className="text-xs md:text-sm font-bold text-gray-700">
              ສິດທິ
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg md:rounded-xl outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 transition font-bold text-sm md:text-base box-border"
            >
              <option value="user">User</option>
              <option value="driver">Driver</option>
              <option value="partner">Partner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-4 mt-2 p-4 md:p-5 bg-gray-50 rounded-xl border border-gray-200">
            <label className="text-xs md:text-sm font-bold text-gray-700 block mb-2 md:mb-3">
              ກຳນົດສິດເຫັນຂໍ້ມູນທະບຽນລົດ (ສຳລັບ User/Driver/Partner)
            </label>
            {formData.role === "admin" ? (
              <div className="flex items-center space-x-2 text-xs md:text-sm text-orange-600 bg-orange-100/50 p-2.5 md:p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-bold">
                  Admin ສາມາດເຫັນຂໍ້ມູນລົດທັງໝົດໄດ້ອັດຕະໂນມັດ
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 md:gap-3">
                {allCars.map((car) => (
                  <label
                    key={car}
                    className={`flex items-center space-x-1.5 md:space-x-2 cursor-pointer px-3 md:px-4 py-1.5 md:py-2 rounded-lg border transition ${formData.assignedCars.includes(car) ? "bg-orange-50 border-orange-500 shadow-sm" : "bg-white border-gray-300 hover:border-orange-400"}`}
                  >
                    <input
                      type="checkbox"
                      className="w-3 h-3 md:w-4 h-4 text-orange-500 focus:ring-orange-500 rounded"
                      checked={formData.assignedCars.includes(car)}
                      onChange={() => handleCarToggle(car)}
                    />
                    <span
                      className={`text-xs md:text-sm font-medium ${formData.assignedCars.includes(car) ? "text-orange-700 font-bold" : "text-gray-700"}`}
                    >
                      {car}
                    </span>
                  </label>
                ))}
                {allCars.length === 0 && (
                  <span className="text-xs md:text-sm text-gray-400">
                    ບໍ່ມີຂໍ້ມູນທະບຽນລົດໃນລະບົບ
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2 lg:col-span-4 flex justify-end space-x-2.5 md:space-x-3 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: "",
                    username: "",
                    password: "",
                    role: "user",
                    assignedCars: [],
                  });
                }}
                className="px-5 md:px-6 h-[40px] md:h-[48px] bg-gray-200 text-gray-700 rounded-lg md:rounded-xl font-bold hover:bg-gray-300 transition text-sm md:text-base"
              >
                ຍົກເລີກ
              </button>
            )}
            <button
              type="submit"
              className="px-6 md:px-8 h-[40px] md:h-[48px] bg-orange-500 text-white rounded-lg md:rounded-xl hover:bg-orange-600 transition font-bold shadow-md text-sm md:text-base"
            >
              {isEditing ? "ປັບປຸງຂໍ້ມູນ" : "ເພີ່ມຜູ້ໃຊ້"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-left text-xs md:text-sm whitespace-nowrap relative">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <tr>
                <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-gray-700 w-10 md:w-12 text-center bg-gray-50">
                  ລ/ດ
                </th>
                <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-gray-700 bg-gray-50">
                  ຊື່ຜູ້ໃຊ້ງານ
                </th>
                <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-gray-700 bg-gray-50">
                  Username
                </th>
                <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-gray-700 bg-gray-50">
                  ສິດທິ
                </th>
                <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-gray-700 bg-gray-50">
                  ທະບຽນລົດທີ່ເຫັນໄດ້
                </th>
                <th className="px-3 py-3 md:px-6 md:py-4 font-bold text-gray-700 text-center bg-gray-50">
                  ຈັດການ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length > 0 ? (
                users.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-3 md:px-6 md:py-4 text-center text-gray-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 font-bold text-gray-800">
                      {u.name}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-gray-500 font-medium">
                      {u.username}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4">
                      <span
                        className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide ${u.role === "admin" ? "bg-purple-100 text-purple-600" : u.role === "partner" ? "bg-teal-100 text-teal-600" : u.role === "driver" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-normal min-w-[150px] md:min-w-[200px]">
                      {u.role === "admin" ? (
                        <span className="text-[10px] md:text-xs text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                          ເຫັນທັງໝົດ
                        </span>
                      ) : u.assignedCars && u.assignedCars.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.assignedCars.map((car) => (
                            <span
                              key={car}
                              className="text-[9px] md:text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded"
                            >
                              {car}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] md:text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                          ບໍ່ມີສິດເຫັນຂໍ້ມູນ
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-center">
                      <div className="flex justify-center space-x-1.5 md:space-x-2">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1.5 md:p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded md:rounded-lg transition"
                        >
                          <Edit className="w-3 h-3 md:w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(u.id)}
                          className="p-1.5 md:p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded md:rounded-lg transition"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-8 md:py-12 text-gray-400 text-xs md:text-sm font-medium"
                  >
                    ບໍ່ມີຂໍ້ມູນຜູ້ໃຊ້
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
