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
  BarChart3,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Car,
} from "lucide-react";

// ເຊື່ອມຕໍ່ກັບ GAS API URL ຂອງທ່ານ
const API_URL =
  "https://script.google.com/macros/s/AKfycbxUEqs7nHH2Mz6zp3CzwDNVwLqXwA1S8w4SGobcflKJ56-EaYNm3RXvK8nAiCGENg/exec";

// --- ກຳນົດສິດການເຂົ້າເຖິງເມນູຂອງແຕ່ລະ Role ---
const roleMenuAccess = {
  admin: ["dashboard", "form", "list", "report", "users"],
  user: ["dashboard", "form", "list", "report"],
  driver: ["form", "list"],
};

// --- Helper Functions: ສ້າງ ID ແລະ ຊື່ໄຟລ໌ຮູບແບບໃໝ່ ---
const generateLogId = (dateStr, allLogs) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Date.now().toString();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
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
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
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
  const d = new Date(dateStr);
  const prefixDate = !isNaN(d.getTime())
    ? `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
    : "YYYYMMDD";

  const sameDayCarLogs = allLogs.filter(
    (l) =>
      l.date === dateStr &&
      l.licensePlate === plate &&
      String(l.id) !== String(currentId),
  );
  const seq = sameDayCarLogs.length + 1;
  return `${type}_${plate}_${prefixDate}${String(seq).padStart(2, "0")}`;
};

// --- Helper Function: ແປງວັນທີເປັນ YYYY-MM-DD ຕາມ Timezone ທ້ອງຖິ່ນ (ແກ້ບັນຫາວັນທີຊ້າໄປ 1 ມື້) ---
const getLocalYYYYMMDD = (dateInput) => {
  if (!dateInput) return "";
  let d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    if (typeof dateInput === "string") return dateInput.split("T")[0];
    return "";
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// --- Helper Function: ແປງຮູບແບບວັນທີເປັນ DD/MM/YYYY ---
const formatDateDisplay = (dateInput) => {
  const ymd = getLocalYYYYMMDD(dateInput);
  if (ymd && ymd.includes("-")) {
    const parts = ymd.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateInput;
};

// --- Helper Function: ແປງຕົວເລກເປັນຮູບແບບ XXX,XXX.XX ---
const formatNumber = (val) => {
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
        : new Date().toLocaleString("lo-LA"),
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
          className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 transform transition-all duration-300 animate-in slide-in-from-top-10 fade-in ${toast.type === "success" ? "bg-white border-l-4 border-green-500" : "bg-white border-l-4 border-red-500"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-500" />
          )}
          <div>
            <p className="font-bold text-gray-800">
              {toast.type === "success" ? "ສຳເລັດ!" : "ຜິດພາດ!"}
            </p>
            <p className="text-sm text-gray-600">{toast.message}</p>
          </div>
        </div>
      )}

      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[9999] flex items-center justify-center backdrop-blur-sm px-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmDialog.type === "logout" ? "bg-orange-100 text-orange-500" : "bg-red-100 text-red-500"}`}
              >
                {confirmDialog.type === "logout" ? (
                  <LogOut className="w-8 h-8" />
                ) : (
                  <AlertTriangle className="w-8 h-8" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {confirmDialog.type === "logout"
                  ? "ອອກຈາກລະບົບ?"
                  : "ຢືນຢັນການລຶບ?"}
              </h3>
              <p className="text-gray-600 text-sm">{confirmDialog.message}</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={closeConfirm}
                className="flex-1 px-4 py-4 text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  closeConfirm();
                }}
                className={`flex-1 px-4 py-4 font-bold transition ${confirmDialog.type === "logout" ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
              >
                {confirmDialog.type === "logout" ? "ຕົກລົງ" : "ຕົກລົງ, ລຶບເລີຍ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[9998] flex items-center justify-center backdrop-blur-sm transition-all">
          <div className="bg-white p-5 rounded-2xl shadow-2xl flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="font-bold text-gray-700">ກຳລັງປະມວນຜົນ...</span>
          </div>
        </div>
      )}

      {!user ? (
        <div className="h-screen w-full bg-orange-50 flex flex-col items-center justify-between">
          <div className="flex-1 flex items-center justify-center p-4 w-full">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-orange-500">
              <div className="flex justify-center mb-6">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Droplet className="w-10 h-10 text-orange-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-8 font-lao">
                ເຂົ້າສູ່ລະບົບ - ບັນທຶກນ້ຳມັນ
              </h2>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ຊື່ຜູ້ໃຊ້
                  </label>
                  <input
                    name="username"
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ລະຫັດຜ່ານ
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-lg transition shadow-md"
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
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:inset-0 flex flex-col`}
          >
            <div className="h-full flex flex-col font-lao">
              <div className="flex items-center justify-between h-16 px-6 bg-orange-500 text-white flex-shrink-0">
                <div className="flex items-center space-x-2 font-bold text-xl">
                  <Droplet className="w-6 h-6" />
                  <span>FuelLog System</span>
                </div>
                <button
                  className="md:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {hasAccess("dashboard") && (
                  <button
                    onClick={() => {
                      setView("dashboard");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${view === "dashboard" ? "bg-orange-100 text-orange-600 font-semibold" : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"}`}
                  >
                    <Home className="w-5 h-5" /> <span>ໜ້າຫຼັກ</span>
                  </button>
                )}
                {hasAccess("form") && (
                  <button
                    onClick={() => {
                      setView("form");
                      setEditingId(null);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${view === "form" ? "bg-orange-100 text-orange-600 font-semibold" : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"}`}
                  >
                    <Plus className="w-5 h-5" /> <span>ບັນທຶກໃສ່ນ້ຳມັນ</span>
                  </button>
                )}
                {hasAccess("list") && (
                  <button
                    onClick={() => {
                      setView("list");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${view === "list" ? "bg-orange-100 text-orange-600 font-semibold" : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"}`}
                  >
                    <List className="w-5 h-5" /> <span>ປະຫວັດການເຕີມ</span>
                  </button>
                )}
                {hasAccess("report") && (
                  <button
                    onClick={() => {
                      setView("report");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${view === "report" ? "bg-orange-100 text-orange-600 font-semibold" : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"}`}
                  >
                    <BarChart3 className="w-5 h-5" />{" "}
                    <span>ລາຍງານການເຕີມນ້ຳມັນ</span>
                  </button>
                )}

                {hasAccess("users") && (
                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      ສໍາລັບຜູ້ດູແລ
                    </p>
                    <button
                      onClick={() => {
                        setView("users");
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${view === "users" ? "bg-orange-100 text-orange-600 font-semibold" : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"}`}
                    >
                      <Users className="w-5 h-5" /> <span>ຈັດການຜູ້ໃຊ້ງານ</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-600 bg-gray-50 rounded-xl mb-2 border border-gray-100">
                  <div className="bg-orange-100 p-2 rounded-full flex-shrink-0">
                    <User className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-800 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-orange-600 font-semibold uppercase">
                      {user.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl transition shadow-sm"
                >
                  <LogOut className="w-5 h-5" /> <span>ອອກຈາກລະບົບ</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden font-lao bg-gray-50/50">
            <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8 border-b border-gray-100 flex-shrink-0 z-10">
              <button
                className="md:hidden p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden md:block text-xl font-black text-gray-800">
                {view === "dashboard" && "ພາບລວມລະບົບ"}
                {view === "form" &&
                  (editingId
                    ? "ແກ້ໄຂຂໍ້ມູນໃສ່ນ້ຳມັນ"
                    : "ບັນທຶກການໃສ່ນ້ຳມັນໃໝ່")}
                {view === "list" && "ປະຫວັດການໃສ່ນ້ຳມັນ"}
                {view === "report" && "ລາຍງານການເຕີມນ້ຳມັນ"}
                {view === "users" && "ການຈັດການຜູ້ໃຊ້ງານ"}
              </div>
              <div className="flex items-center space-x-4 text-sm font-bold text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                <span>ວັນທີ: {formatDateDisplay(new Date())}</span>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
              <div className="max-w-6xl mx-auto w-full pb-8">
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
                  />
                )}
                {view === "report" && hasAccess("report") && (
                  <FuelReport logs={visibleLogs} cars={visibleCars} />
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
              </div>
            </main>
            <Footer />
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
    <footer className="w-full bg-white border-t border-gray-200 py-4 flex-shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 font-lao">
        <div className="flex items-center space-x-2 mb-1 md:mb-0">
          <Droplet className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-gray-700">FuelLog System</span>
          <span>© {currentYear}</span>
        </div>
        <div className="text-center md:text-right">
          <p>
            ພັດທະນາໂດຍ:{" "}
            <span className="font-semibold text-orange-600">ທີມງານພັດທະນາ</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

// --- Component ສຳລັບສ້າງກາຟ ---
function MonthlyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
        ບໍ່ມີຂໍ້ມູນການເຕີມນ້ຳມັນສຳລັບສ້າງກາຟ
      </div>
    );
  }

  const maxLiters = Math.max(...data.map((d) => d.liters), 10) * 1.15;
  const maxCons = Math.max(...data.map((d) => d.consumption), 5) * 1.15;

  const viewBoxWidth = 800;
  const viewBoxHeight = 350;
  const padding = { top: 40, right: 80, bottom: 40, left: 80 };
  const width = viewBoxWidth - padding.left - padding.right;
  const height = viewBoxHeight - padding.top - padding.bottom;

  const barWidth = Math.min(48, (width / data.length) * 0.5);

  const points = data.map((d, i) => {
    const x = padding.left + (i + 0.5) * (width / data.length);
    const yBar = padding.top + height - (d.liters / maxLiters) * height;
    const yLine = padding.top + height - (d.consumption / maxCons) * height;

    // ຄຳນວນເພື່ອບໍ່ໃຫ້ຕົວເລກທັບກັນ
    let litY = yBar - 10;
    let consY = yLine - 15;

    if (Math.abs(litY - consY) < 25) {
      if (yLine < yBar) {
        consY = yLine - 20;
        litY = yBar + 15; // ຍ້າຍຕົວເລກລິດລົງມາໃນແທ່ງກາຟ
      } else {
        litY = yBar - 20;
        consY = yLine + 20; // ຍ້າຍຕົວເລກສິ້ນເປືອງລົງກ້ອງຈຸດ
      }
    }

    return { ...d, x, yBar, yLine, litY, consY };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.yLine}`).join(" ");

  return (
    <div className="w-full">
      <div className="w-full bg-white">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-auto font-lao"
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
                  stroke="#f3f4f6"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 15}
                  y={y + 4}
                  textAnchor="end"
                  fill="#9ca3af"
                  className="text-[11px] font-bold"
                >
                  {formatNumber(maxLiters * ratio)}
                </text>
                <text
                  x={viewBoxWidth - padding.right + 15}
                  y={y + 4}
                  textAnchor="start"
                  fill="#9ca3af"
                  className="text-[11px] font-bold"
                >
                  {formatNumber(maxCons * ratio)}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left - 15}
            y={padding.top - 15}
            textAnchor="end"
            fill="#ea580c"
            className="text-[10px] font-black"
          >
            ລິດ (L)
          </text>
          <text
            x={viewBoxWidth - padding.right + 15}
            y={padding.top - 15}
            textAnchor="start"
            fill="#2563eb"
            className="text-[10px] font-black"
          >
            ກມ/ລິດ
          </text>

          {/* Bars (Liters) */}
          {points.map((p, i) => {
            const barHeight = padding.top + height - p.yBar;
            return (
              <g key={`bar-${i}`}>
                <rect
                  x={p.x - barWidth / 2}
                  y={p.yBar}
                  width={barWidth}
                  height={Math.max(0, barHeight)}
                  fill="#fed7aa"
                  rx="4"
                  className="hover:fill-orange-400 transition-colors cursor-pointer"
                />
                <text
                  x={p.x}
                  y={viewBoxHeight - padding.bottom + 25}
                  textAnchor="middle"
                  fill="#4b5563"
                  className="text-xs font-bold"
                >
                  {p.label}
                </text>
                {p.liters > 0 && (
                  <>
                    {/* ເພີ່ມຂອບສີຂາວໃຫ້ຕົວອັກສອນອ່ານງ່າຍຂຶ້ນ */}
                    <text
                      x={p.x}
                      y={p.litY}
                      textAnchor="middle"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinejoin="round"
                      className="text-[11px] font-black"
                    >
                      {formatNumber(p.liters)}
                    </text>
                    <text
                      x={p.x}
                      y={p.litY}
                      textAnchor="middle"
                      fill="#ea580c"
                      className="text-[11px] font-black"
                    >
                      {formatNumber(p.liters)}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Line (Consumption) */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
          />

          {/* Points (Consumption) */}
          {points.map((p, i) => (
            <g key={`point-${i}`}>
              <circle
                cx={p.x}
                cy={p.yLine}
                r="6"
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth="2"
                className="cursor-pointer hover:r-[8px] transition-all"
              />
              {p.consumption > 0 && (
                <>
                  <text
                    x={p.x}
                    y={p.consY}
                    textAnchor="middle"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    className="text-[11px] font-black"
                  >
                    {formatNumber(p.consumption)}
                  </text>
                  <text
                    x={p.x}
                    y={p.consY}
                    textAnchor="middle"
                    fill="#2563eb"
                    className="text-[11px] font-black"
                  >
                    {formatNumber(p.consumption)}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex justify-center space-x-8 mt-6 text-sm text-gray-600 font-bold font-lao">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-200 rounded"></div>
            <span>ປະລິມານນ້ຳມັນ (ລິດ)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-blue-500 rounded"></div>
            <div className="w-3 h-3 bg-white border-2 border-blue-500 rounded-full -ml-3"></div>
            <span>ອັດຕາສິ້ນເປືອງສະເລ່ຍ (ກມ/ລິດ)</span>
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

  // ປະມວນຜົນຂໍ້ມູນສຳລັບກາຟ (ແຍກຕາມເດືອນ)
  const monthlyData = useMemo(() => {
    const grouped = {};
    logs.forEach((log) => {
      const localDateStr = getLocalYYYYMMDD(log.date);
      if (!localDateStr) return;
      const monthKey = localDateStr.substring(0, 7); // "YYYY-MM"
      if (!grouped[monthKey]) {
        const [y, m] = monthKey.split("-");
        grouped[monthKey] = {
          monthKey,
          label: `${m}/${y}`,
          liters: 0,
          distance: 0,
          validLiters: 0,
        };
      }
      const l = Number(log.liters || 0);
      const d = Number(log.distance || 0);
      grouped[monthKey].liters += l;
      if (d > 0) {
        grouped[monthKey].distance += d;
        grouped[monthKey].validLiters += l;
      }
    });

    const sorted = Object.values(grouped)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6); // ເອົາສະເພາະ 6 ເດືອນຫຼ້າສຸດ

    return sorted.map((item) => ({
      ...item,
      consumption:
        item.validLiters > 0
          ? Number((item.distance / item.validLiters).toFixed(2))
          : 0,
    }));
  }, [logs]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      {/* ປ່ຽນໃຫ້ສະແດງ 2 ແຖວ ແຖວລະ 2 ບັອກ (grid-cols-1 ສຳລັບມືຖື, sm:grid-cols-2 ສຳລັບໜ້າຈໍທົ່ວໄປ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition overflow-hidden">
          <div className="bg-purple-100 p-4 rounded-full text-purple-500 shrink-0">
            <Car className="w-8 h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-sm font-bold truncate">
              ຈຳນວນລົດ (ຄັນ)
            </p>
            <p
              className="text-2xl lg:text-3xl font-black text-gray-800 truncate"
              title={totalCars}
            >
              {totalCars}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition overflow-hidden">
          <div className="bg-orange-100 p-4 rounded-full text-orange-500 shrink-0">
            <Droplet className="w-8 h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-sm font-bold truncate">
              ນ້ຳມັນລວມ (ລິດ)
            </p>
            <p
              className="text-2xl lg:text-3xl font-black text-gray-800 truncate"
              title={formatNumber(totalLiters)}
            >
              {formatNumber(totalLiters)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition overflow-hidden">
          <div className="bg-green-100 p-4 rounded-full text-green-500 shrink-0">
            <FileText className="w-8 h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-sm font-bold truncate">
              ຄ່າໃຊ້ຈ່າຍລວມ (ກີບ)
            </p>
            <p
              className="text-2xl lg:text-3xl font-black text-gray-800 truncate"
              title={formatNumber(totalCost)}
            >
              {formatNumber(totalCost)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition overflow-hidden">
          <div className="bg-blue-100 p-4 rounded-full text-blue-500 shrink-0">
            <List className="w-8 h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-sm font-bold truncate">
              ຈຳນວນຄັ້ງທີ່ເຕີມ
            </p>
            <p
              className="text-2xl lg:text-3xl font-black text-gray-800 truncate"
              title={logs.length}
            >
              {logs.length}
            </p>
          </div>
        </div>
      </div>

      {/* ສ່ວນສະແດງກາຟ */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 font-lao flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />{" "}
          ກາຟປະລິມານນ້ຳມັນ ແລະ ອັດຕາການສິ້ນເປືອງ (6 ເດືອນຫຼ້າສຸດ)
        </h3>
        <MonthlyChart data={monthlyData} />
      </div>
    </div>
  );
}

function LogList({ logs, onEdit, onDelete, setView, role, cars }) {
  const [filterDate, setFilterDate] = useState("");
  const [filterPlate, setFilterPlate] = useState("");

  // ຕັ້ງຄ່າ Default Sort ເປັນ ວັນທີ ໃໝ່ສຸດຂຶ້ນກ່ອນ (Descending)
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const filteredLogs = logs.filter((log) => {
    const logDateLocal = getLocalYYYYMMDD(log.date);
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
        <ArrowUpDown className="w-3 h-3 ml-1 inline-block text-gray-400 opacity-50" />
      );
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 inline-block text-orange-500" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 inline-block text-orange-500" />
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-800 font-lao">
          ປະຫວັດການໃສ່ນ້ຳມັນ
        </h3>
        <button
          onClick={() => setView("form")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center space-x-2 transition shadow-lg shadow-orange-200"
        >
          <Plus className="w-4 h-4" /> <span>ເພີ່ມໃໝ່</span>
        </button>
      </div>

      <div className="p-5 border-b border-gray-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-500 mb-2">
            ຄົ້ນຫາຕາມວັນທີ:
          </label>
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm font-medium bg-gray-50 focus:bg-white"
            />
            <Filter className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-500 mb-2">
            ຄົ້ນຫາຕາມທະບຽນລົດ:
          </label>
          <div className="relative">
            <select
              value={filterPlate}
              onChange={(e) => setFilterPlate(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm appearance-none font-medium bg-gray-50 focus:bg-white"
            >
              <option value="">-- ທັງໝົດ --</option>
              {cars &&
                cars.map((plate) => (
                  <option key={plate} value={plate}>
                    {plate}
                  </option>
                ))}
            </select>
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterDate("");
              setFilterPlate("");
              setSortConfig({ key: "date", direction: "desc" });
            }}
            className="px-5 py-2.5 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl font-bold transition w-full md:w-auto"
          >
            ລ້າງການຄົ້ນຫາ/ຈັດລຽງ
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-[65vh]">
        <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap relative">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs border-b border-gray-100 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr>
              <th className="px-4 py-4 w-12 text-center text-gray-500 font-bold bg-gray-50">
                ລ/ດ
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                onClick={() => requestSort("date")}
              >
                ວັນທີ {renderSortIcon("date")}
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                onClick={() => requestSort("licensePlate")}
              >
                ທະບຽນລົດ {renderSortIcon("licensePlate")}
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                onClick={() => requestSort("liters")}
              >
                ລິດ {renderSortIcon("liters")}
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                onClick={() => requestSort("actualPaid")}
              >
                ຈ່າຍຈິງ (ກີບ) {renderSortIcon("actualPaid")}
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                onClick={() => requestSort("odometer")}
              >
                ເລກຫຼັກລົດ (ກມ) {renderSortIcon("odometer")}
              </th>
              <th className="px-6 py-4 text-center font-bold bg-gray-50">
                ຮູບພາບ
              </th>
              <th className="px-6 py-4 text-center font-bold bg-gray-50">
                ຈັດການ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedLogs.length > 0 ? (
              sortedLogs.map((log, index) => (
                <tr key={log.id} className="hover:bg-orange-50/50 transition">
                  <td className="px-4 py-4 text-center text-gray-400 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {formatDateDisplay(log.date)}
                  </td>
                  <td className="px-6 py-4 font-black text-gray-800">
                    {log.licensePlate}
                  </td>
                  <td className="px-6 py-4">{formatNumber(log.liters)}</td>
                  <td className="px-6 py-4 text-orange-600 font-black">
                    {formatNumber(log.actualPaid)}
                  </td>
                  <td className="px-6 py-4">{formatNumber(log.odometer)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      {log.receiptUrl && log.receiptUrl.startsWith("http") ? (
                        <a
                          href={log.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-orange-100 text-orange-600 font-bold rounded-lg hover:bg-orange-200 transition flex items-center space-x-1"
                          title="ເບິ່ງຮູບບິນ"
                        >
                          <ExternalLink className="w-3 h-3" /> <span>ບິນ</span>
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs px-2 py-1">
                          -
                        </span>
                      )}
                      {log.odometerUrl && log.odometerUrl.startsWith("http") ? (
                        <a
                          href={log.odometerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-blue-100 text-blue-600 font-bold rounded-lg hover:bg-blue-200 transition flex items-center space-x-1"
                          title="ເບິ່ງຮູບເລກກິໂລ"
                        >
                          <ExternalLink className="w-3 h-3" /> <span>ກິໂລ</span>
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs px-2 py-1">
                          -
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => onEdit(log.id)}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {(role === "admin" || role === "user") && (
                        <button
                          onClick={() => onDelete(log.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-16 text-gray-400">
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
      let editDate = getLocalYYYYMMDD(initialData.date) || "";
      return { ...initialData, date: editDate };
    }
    return {
      date: new Date().toISOString().split("T")[0],
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 font-lao animate-in slide-in-from-bottom-4 duration-300 mb-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-4 flex items-center space-x-3">
        <div className="bg-orange-100 p-2 rounded-lg">
          <Droplet className="text-orange-500 w-6 h-6" />
        </div>
        <span>{initialData ? "ແກ້ໄຂຂໍ້ມູນ" : "ບັນທຶກການໃສ່ນ້ຳມັນ"}</span>
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
        }}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                ວັນທີ
              </label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-gray-50 hover:bg-white font-medium"
              />
            </div>

            <SearchableSelect
              label="ທະບຽນລົດ (ສະເພາະລົດທີ່ໄດ້ຮັບສິດ)"
              placeholder="-- ເລືອກ ຫຼື ພິມຄົ້ນຫາທະບຽນລົດ --"
              value={formData.licensePlate}
              options={cars}
              onChange={(val) =>
                handleChange({ target: { name: "licensePlate", value: val } })
              }
            />

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  ຈຳນວນ (ລິດ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="liters"
                  required
                  value={formData.liters}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-gray-50 hover:bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  ລາຄາ/ລິດ (ກີບ)
                </label>
                <input
                  type="number"
                  name="pricePerLiter"
                  required
                  value={formData.pricePerLiter}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-gray-50 hover:bg-white font-medium"
                />
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-2xl space-y-4 border border-orange-100 shadow-inner">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">
                  ລາຄາລວມ (Auto):
                </span>
                <span className="text-lg font-black text-gray-800">
                  {formatNumber(formData.totalPrice)} ກີບ
                </span>
              </div>
              <div>
                <label className="block text-sm font-black text-gray-800 mb-2">
                  ລາຄາຈ່າຍຈິງ (ກີບ)
                </label>
                <input
                  type="number"
                  name="actualPaid"
                  required
                  value={formData.actualPaid}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition font-bold text-xl text-orange-600"
                />
              </div>
              <div className="flex justify-between items-center text-sm pt-3 border-t border-orange-200">
                <span className="text-gray-600 font-medium">
                  ສ່ວນຕ່າງ (Auto):
                </span>
                <span
                  className={`text-lg font-black ${Number(formData.difference) < 0 ? "text-red-500" : "text-green-600"}`}
                >
                  {Number(formData.difference) > 0 ? "+" : ""}
                  {formatNumber(formData.difference)} ກີບ
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                ເລກຫຼັກລົດ (ກມ.)
              </label>
              <input
                type="number"
                name="odometer"
                required
                value={formData.odometer}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-gray-50 hover:bg-white font-medium"
              />
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl space-y-3 border border-blue-100 text-sm shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  ໄລຍະທາງຫຼັງເຕີມລ່າສຸດ:
                </span>
                <span className="text-xl font-black text-blue-600">
                  {formatNumber(formData.distance)}{" "}
                  <span className="text-sm font-normal">ກມ.</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  ອັດຕາສິ້ນເປືອງ:
                </span>
                <span className="text-xl font-black text-blue-600">
                  {formatNumber(formData.consumption)}{" "}
                  <span className="text-sm font-normal">ກມ./ລິດ</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 pt-3">
              {/* ຊ່ອງອັບໂຫຼດ ຮູບບິນ */}
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-0 hover:border-orange-400 hover:bg-orange-50 transition relative overflow-hidden group h-40 flex flex-col justify-center items-center cursor-pointer bg-gray-50">
                {formData.receiptUrl ? (
                  <div className="absolute inset-0 w-full h-full z-10">
                    <img
                      src={formData.receiptUrl}
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                    {/* ແຖບປ່ຽນຮູບເວລາເອົາເມົາສ໌ໄປຊີ້ (Hover) */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white font-bold px-4 py-2 bg-black bg-opacity-60 rounded-xl backdrop-blur-sm flex items-center space-x-2">
                        <Edit className="w-4 h-4" /> <span>ປ່ຽນຮູບ</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-0 flex flex-col items-center p-4">
                    <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition">
                      <ImageIcon className="w-6 h-6 text-orange-400" />
                    </div>
                    <span className="text-sm text-gray-700 font-bold">
                      ອັບໂຫຼດ ຮູບບິນ
                    </span>
                  </div>
                )}
                {/* ປ່ຽນ fieldPrefix ເປັນ 'receipt' */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "receipt")}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
              </div>

              {/* ຊ່ອງອັບໂຫຼດ ຮູບເລກກິໂລ */}
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-0 hover:border-orange-400 hover:bg-orange-50 transition relative overflow-hidden group h-40 flex flex-col justify-center items-center cursor-pointer bg-gray-50">
                {formData.odometerUrl ? (
                  <div className="absolute inset-0 w-full h-full z-10">
                    <img
                      src={formData.odometerUrl}
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white font-bold px-4 py-2 bg-black bg-opacity-60 rounded-xl backdrop-blur-sm flex items-center space-x-2">
                        <Edit className="w-4 h-4" /> <span>ປ່ຽນຮູບ</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-0 flex flex-col items-center p-4">
                    <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition">
                      <ImageIcon className="w-6 h-6 text-orange-400" />
                    </div>
                    <span className="text-sm text-gray-700 font-bold">
                      ອັບໂຫຼດ ຮູບເລກກິໂລ
                    </span>
                  </div>
                )}
                {/* ປ່ຽນ fieldPrefix ເປັນ 'odometer' */}
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
        <div className="flex justify-end space-x-4 pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3.5 text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition"
          >
            ຍົກເລີກ
          </button>
          <button
            type="submit"
            className="px-8 py-3.5 text-white bg-orange-500 hover:bg-orange-600 font-bold rounded-xl transition shadow-lg shadow-orange-200 transform hover:-translate-y-0.5"
          >
            ບັນທຶກຂໍ້ມູນ
          </button>
        </div>
      </form>
    </div>
  );
}

function SearchableSelect({ label, value, onChange, options, placeholder }) {
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
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-bold text-gray-700 mb-1">
        {label}
      </label>
      <div
        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 hover:bg-white flex justify-between items-center cursor-pointer focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={
            value ? "text-gray-800 font-bold" : "text-gray-400 font-medium"
          }
        >
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 border-b border-gray-100 flex items-center space-x-3 bg-gray-50">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              autoFocus
              className="w-full text-sm outline-none py-1 bg-transparent font-bold"
              placeholder="ພິມເພື່ອຄົ້ນຫາ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  className={`px-5 py-3 text-sm cursor-pointer transition border-b border-gray-50 last:border-0 ${value === opt ? "bg-orange-50 text-orange-600 font-bold" : "text-gray-700 hover:bg-gray-50 hover:text-orange-500 font-bold"}`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-5 py-6 text-center text-gray-400 text-sm font-medium">
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
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-3 border-b pb-4">
          <div className="bg-orange-100 p-2 rounded-lg">
            <ShieldCheck className="text-orange-500 w-6 h-6" />
          </div>
          <span>{isEditing ? "ແກ້ໄຂຜູ້ໃຊ້ງານ" : "ເພີ່ມຜູ້ໃຊ້ງານໃໝ່"}</span>
        </h3>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end"
        >
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">ຊື່ແທ້</label>
            <input
              type="text"
              placeholder="ປ້ອນຊື່"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white transition font-medium"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">
              ຊື່ເຂົ້າລະບົບ
            </label>
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white transition font-medium"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">ລະຫັດຜ່ານ</label>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white transition font-medium"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">ສິດທິ</label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 transition font-bold"
            >
              <option value="user">User</option>
              <option value="driver">Driver</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-4 mt-2 p-5 bg-gray-50 rounded-xl border border-gray-200">
            <label className="text-sm font-bold text-gray-700 block mb-3">
              ກຳນົດສິດເຫັນຂໍ້ມູນທະບຽນລົດ (ສຳລັບ User/Driver)
            </label>
            {formData.role === "admin" ? (
              <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-100/50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="font-bold">
                  Admin ສາມາດເຫັນຂໍ້ມູນລົດທັງໝົດໄດ້ອັດຕະໂນມັດ
                  ບໍ່ຈຳເປັນຕ້ອງເລືອກລຸ່ມນີ້
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {allCars.map((car) => (
                  <label
                    key={car}
                    className={`flex items-center space-x-2 cursor-pointer px-4 py-2 rounded-lg border transition ${formData.assignedCars.includes(car) ? "bg-orange-50 border-orange-500 shadow-sm" : "bg-white border-gray-300 hover:border-orange-400"}`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500 rounded"
                      checked={formData.assignedCars.includes(car)}
                      onChange={() => handleCarToggle(car)}
                    />
                    <span
                      className={`text-sm font-medium ${formData.assignedCars.includes(car) ? "text-orange-700 font-bold" : "text-gray-700"}`}
                    >
                      {car}
                    </span>
                  </label>
                ))}
                {allCars.length === 0 && (
                  <span className="text-sm text-gray-400">
                    ບໍ່ມີຂໍ້ມູນທະບຽນລົດໃນລະບົບ
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2 lg:col-span-4 flex justify-end space-x-3 pt-2">
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
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                ຍົກເລີກ
              </button>
            )}
            <button
              type="submit"
              className="px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-bold shadow-md"
            >
              {isEditing ? "ປັບປຸງຂໍ້ມູນ" : "ເພີ່ມຜູ້ໃຊ້"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-left text-sm whitespace-nowrap relative">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700 w-12 text-center bg-gray-50">
                  ລ/ດ
                </th>
                <th className="px-6 py-4 font-bold text-gray-700 bg-gray-50">
                  ຊື່ຜູ້ໃຊ້ງານ
                </th>
                <th className="px-6 py-4 font-bold text-gray-700 bg-gray-50">
                  Username
                </th>
                <th className="px-6 py-4 font-bold text-gray-700 bg-gray-50">
                  ສິດທິ
                </th>
                <th className="px-6 py-4 font-bold text-gray-700 bg-gray-50">
                  ທະບຽນລົດທີ່ເຫັນໄດ້
                </th>
                <th className="px-6 py-4 font-bold text-gray-700 text-center bg-gray-50">
                  ຈັດການ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length > 0 ? (
                users.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-center text-gray-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {u.username}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${u.role === "admin" ? "bg-purple-100 text-purple-600" : u.role === "driver" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-normal min-w-[200px]">
                      {u.role === "admin" ? (
                        <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded">
                          ເຫັນທັງໝົດ
                        </span>
                      ) : u.assignedCars && u.assignedCars.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.assignedCars.map((car) => (
                            <span
                              key={car}
                              className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded"
                            >
                              {car}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">
                          ບໍ່ມີສິດເຫັນຂໍ້ມູນ
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(u.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-12 text-gray-400 font-medium"
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

function FuelReport({ logs, cars }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPlate, setSelectedPlate] = useState("");

  // ຕັ້ງຄ່າ Default Sort ເປັນ ວັນທີ ໃໝ່ສຸດຂຶ້ນກ່ອນ (Descending)
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [expandedGroup, setExpandedGroup] = useState(null);

  const filteredLogs = logs.filter((l) => {
    const logDateStr = getLocalYYYYMMDD(l.date);
    const d = new Date(logDateStr);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    let matchDate = true;
    if (start && d < start) matchDate = false;
    if (end && d > end) matchDate = false;

    const matchPlate = selectedPlate ? l.licensePlate === selectedPlate : true;

    return matchDate && matchPlate;
  });

  const summary = {};
  filteredLogs.forEach((log) => {
    let rawDate = getLocalYYYYMMDD(log.date);
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
        <ArrowUpDown className="w-3 h-3 ml-1 inline-block text-gray-400 opacity-50" />
      );
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 inline-block text-orange-500" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 inline-block text-orange-500" />
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

  // ຄິດໄລ່ອັດຕາສິ້ນເປືອງສະເລ່ຍ ແລະ ຈຳນວນຄັ້ງ
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
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 mb-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-3 border-b pb-4">
          <div className="bg-orange-100 p-2 rounded-lg">
            <BarChart3 className="text-orange-500 w-6 h-6" />
          </div>
          <span>ລາຍງານການເຕີມນ້ຳມັນ</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-2">
              ຕັ້ງແຕ່ວັນທີ:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium bg-gray-50 focus:bg-white transition"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-2">
              ເຖິງວັນທີ:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium bg-gray-50 focus:bg-white transition"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-2">
              ທະບຽນລົດ:
            </label>
            <select
              value={selectedPlate}
              onChange={(e) => setSelectedPlate(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium bg-gray-50 focus:bg-white transition"
            >
              <option value="">-- ທັງໝົດ --</option>
              {cars &&
                cars.map((plate) => (
                  <option key={plate} value={plate}>
                    {plate}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSelectedPlate("");
                setSortConfig({ key: "date", direction: "desc" });
                setExpandedGroup(null);
              }}
              className="px-5 py-2.5 w-full text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl font-bold transition"
            >
              ລ້າງການຄົ້ນຫາ/ຈັດລຽງ
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 flex flex-col justify-center shadow-inner min-w-0">
            <span className="text-orange-800 font-bold text-sm mb-1 truncate">
              ລວມຈຳນວນລິດ (ທີ່ກັ່ນຕອງ):
            </span>
            <span
              className="text-xl md:text-2xl font-black text-orange-600 truncate"
              title={`${formatNumber(grandTotalLiters)} ລິດ`}
            >
              {formatNumber(grandTotalLiters)}{" "}
              <span className="text-sm font-bold">ລິດ</span>
            </span>
          </div>
          <div className="bg-green-50 p-5 rounded-2xl border border-green-100 flex flex-col justify-center shadow-inner min-w-0">
            <span className="text-green-800 font-bold text-sm mb-1 truncate">
              ລວມຄ່າໃຊ້ຈ່າຍ (ທີ່ກັ່ນຕອງ):
            </span>
            <span
              className="text-xl md:text-2xl font-black text-green-600 truncate"
              title={`${formatNumber(grandTotalCost)} ກີບ`}
            >
              {formatNumber(grandTotalCost)}{" "}
              <span className="text-sm font-bold">ກີບ</span>
            </span>
          </div>
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex flex-col justify-center shadow-inner min-w-0">
            <span className="text-blue-800 font-bold text-sm mb-1 truncate">
              ອັດຕາການສິ້ນເປືອງສະເລ່ຍ:
            </span>
            <span
              className="text-xl md:text-2xl font-black text-blue-600 truncate"
              title={`${formatNumber(averageConsumption)} ກມ./ລິດ`}
            >
              {formatNumber(averageConsumption)}{" "}
              <span className="text-sm font-bold">ກມ./ລິດ</span>
            </span>
          </div>
          <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 flex flex-col justify-center shadow-inner min-w-0">
            <span className="text-purple-800 font-bold text-sm mb-1 truncate">
              ຈຳນວນຄັ້ງທີ່ເຕີມ (ທີ່ກັ່ນຕອງ):
            </span>
            <span
              className="text-xl md:text-2xl font-black text-purple-600 truncate"
              title={`${grandTotalCount} ຄັ້ງ`}
            >
              {grandTotalCount} <span className="text-sm font-bold">ຄັ້ງ</span>
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap relative">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs border-b border-gray-100 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <tr>
                  <th className="px-4 py-4 w-12 text-center text-gray-500 font-bold bg-gray-50">
                    ລ/ດ
                  </th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                    onClick={() => requestSort("date")}
                  >
                    ວັນທີ {renderSortIcon("date")}
                  </th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                    onClick={() => requestSort("plate")}
                  >
                    ທະບຽນລົດ {renderSortIcon("plate")}
                  </th>
                  <th
                    className="px-6 py-4 text-center cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                    onClick={() => requestSort("count")}
                  >
                    ຈຳນວນຄັ້ງທີ່ເຕີມ {renderSortIcon("count")}
                  </th>
                  <th
                    className="px-6 py-4 text-right cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                    onClick={() => requestSort("liters")}
                  >
                    ລວມນ້ຳມັນ (ລິດ) {renderSortIcon("liters")}
                  </th>
                  <th
                    className="px-6 py-4 text-right cursor-pointer hover:bg-gray-200 transition select-none font-bold bg-gray-50"
                    onClick={() => requestSort("actualPaid")}
                  >
                    ລວມຄ່າໃຊ້ຈ່າຍ (ກີບ) {renderSortIcon("actualPaid")}
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
                          <td className="px-4 py-4 text-center text-gray-400 font-medium flex items-center justify-center space-x-1">
                            <span>{idx + 1}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-orange-500" : ""}`}
                            />
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {formatDateDisplay(row.date)}
                          </td>
                          <td className="px-6 py-4 font-black text-gray-800">
                            {row.plate}
                          </td>
                          <td className="px-6 py-4 text-center bg-gray-50/50 font-bold text-gray-700">
                            {row.count}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-orange-600">
                            {formatNumber(row.liters)}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-green-600">
                            {formatNumber(row.actualPaid)}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td
                              colSpan="6"
                              className="p-0 bg-gray-50 border-b border-gray-200"
                            >
                              <div className="p-4 pl-12 shadow-inner bg-orange-50/30">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
                                  <List className="w-4 h-4 text-orange-500" />
                                  <span>
                                    ລາຍລະອຽດການເຕີມ (ວັນທີ:{" "}
                                    {formatDateDisplay(row.date)})
                                  </span>
                                </h4>
                                <table className="w-full text-left text-xs text-gray-600 whitespace-nowrap bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                  <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                                    <tr>
                                      <th className="px-4 py-3 font-bold text-center">
                                        ຄັ້ງທີ
                                      </th>
                                      <th className="px-4 py-3 font-bold">
                                        ຈຳນວນ (ລິດ)
                                      </th>
                                      <th className="px-4 py-3 font-bold">
                                        ລາຄາ/ລິດ (ກີບ)
                                      </th>
                                      <th className="px-4 py-3 font-bold">
                                        ຈ່າຍຈິງ (ກີບ)
                                      </th>
                                      <th className="px-4 py-3 font-bold">
                                        ໄລຍະທາງ (ກມ)
                                      </th>
                                      <th className="px-4 py-3 font-bold">
                                        ສິ້ນເປືອງ (ກມ/ລິດ)
                                      </th>
                                      <th className="px-4 py-3 font-bold text-center">
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
                                        <td className="px-4 py-2.5 text-center font-medium text-gray-500">
                                          {dIdx + 1}
                                        </td>
                                        <td className="px-4 py-2.5 font-bold">
                                          {formatNumber(det.liters)}
                                        </td>
                                        <td className="px-4 py-2.5">
                                          {formatNumber(det.pricePerLiter)}
                                        </td>
                                        <td className="px-4 py-2.5 font-bold text-green-600">
                                          {formatNumber(det.actualPaid)}
                                        </td>
                                        <td className="px-4 py-2.5">
                                          {formatNumber(det.distance)}
                                        </td>
                                        <td className="px-4 py-2.5 text-blue-600 font-medium">
                                          {formatNumber(det.consumption)}
                                        </td>
                                        <td className="px-4 py-2.5 flex justify-center space-x-2">
                                          {det.receiptUrl &&
                                          det.receiptUrl.startsWith("http") ? (
                                            <a
                                              href={det.receiptUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-3 py-1 bg-orange-100 text-orange-600 font-bold rounded-lg hover:bg-orange-200 transition flex items-center space-x-1"
                                              title="ເບິ່ງຮູບບິນ"
                                            >
                                              <ExternalLink className="w-3 h-3" />{" "}
                                              <span>ບິນ</span>
                                            </a>
                                          ) : (
                                            <span className="text-gray-300 text-xs px-2 py-1">
                                              -
                                            </span>
                                          )}
                                          {det.odometerUrl &&
                                          det.odometerUrl.startsWith("http") ? (
                                            <a
                                              href={det.odometerUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-3 py-1 bg-blue-100 text-blue-600 font-bold rounded-lg hover:bg-blue-200 transition flex items-center space-x-1"
                                              title="ເບິ່ງຮູບເລກກິໂລ"
                                            >
                                              <ExternalLink className="w-3 h-3" />{" "}
                                              <span>ກິໂລ</span>
                                            </a>
                                          ) : (
                                            <span className="text-gray-300 text-xs px-2 py-1">
                                              -
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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
                      className="text-center py-16 text-gray-400 font-medium"
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
