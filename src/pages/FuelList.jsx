// src/pages/FuelList.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Calendar,
  Droplet,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { callApi } from "../api/config";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import {
  formatDateDisplay,
  formatNumber,
  formatInteger,
  getLaosDateString,
} from "../utils/helpers";
import SearchableSelect from "../components/common/SearchableSelect";

export default function FuelList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const alertContext = useAlert();
  const showAlert = alertContext?.showAlert || ((msg) => alert(msg));
  const showConfirm =
    alertContext?.showConfirm ||
    ((msg, onConfirm) => {
      if (window.confirm(msg)) onConfirm();
    });

  const [logs, setLogs] = useState([]);
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- State ສຳລັບຈັດການປຸ່ມລອຍ (FAB) ---
  const [showFab, setShowFab] = useState(false);

  const [filterDate, setFilterDate] = useState("");
  const [filterPlate, setFilterPlate] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await callApi({ action: "getData" });
      if (res.success) {
        const visibleCars =
          user?.role === "admin"
            ? res.cars || []
            : (res.cars || []).filter((c) =>
                (user?.assignedCars || []).includes(c),
              );
        const visibleLogs =
          user?.role === "admin"
            ? res.logs || []
            : (res.logs || []).filter((log) =>
                (user?.assignedCars || []).includes(log.licensePlate),
              );
        setCars(visibleCars);
        setLogs(visibleLogs);
      } else {
        showAlert("ບໍ່ສາມາດດຶງຂໍ້ມູນໄດ້: " + res.message, "error");
      }
    } catch (error) {
      showAlert("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ", "error");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // --- ຟັງຊັນກວດຈັບການເລື່ອນ (ແບບ Advance ທີ່ຈັບໄດ້ທຸກ Container) ---
  useEffect(() => {
    const handleScroll = (e) => {
      // ດຶງຄ່າການເລື່ອນ (Scroll) ບໍ່ວ່າຈະເລື່ອນຈາກ window ຫຼັກ ຫຼື ຈາກກ່ອງ div ຍ່ອຍ
      const target = e.target;
      const scrollTop =
        target.scrollTop ||
        window.scrollY ||
        document.documentElement.scrollTop ||
        0;

      // ຖ້າເລື່ອນລົງມາຫຼາຍກວ່າ 50px ໃຫ້ສະແດງປຸ່ມ
      if (scrollTop > 50) {
        setShowFab(true);
      } else {
        setShowFab(false);
      }
    };

    // ໃສ່ , true ເພື່ອເປີດໃຊ້ງານ Capture phase ມັນຈະດັກຈັບ scroll ໄດ້ທັງໝົດ
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const handleDelete = (id) => {
    showConfirm("ທ່ານຕ້ອງການລຶບຂໍ້ມູນການເຕີມນ້ຳມັນນີ້ແທ້ບໍ່?", async () => {
      setIsLoading(true);
      try {
        const res = await callApi({ action: "deleteLog", id });
        if (res.success !== false) {
          setLogs((prevLogs) => prevLogs.filter((l) => l.id !== id));
          showAlert("ລຶບຂໍ້ມູນສຳເລັດ", "success");
        } else {
          showAlert("ລຶບຂໍ້ມູນບໍ່ສຳເລັດ: " + res.message, "error");
        }
      } catch (error) {
        showAlert("ເກີດຂໍ້ຜິດພາດໃນການລຶບຂໍ້ມູນ", "error");
      }
      setIsLoading(false);
    });
  };

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
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
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

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 font-lao relative min-h-screen md:min-h-0">
      {/* --- Header --- */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center space-x-2">
          <span>ປະຫວັດການໃສ່ນ້ຳມັນ</span>
          <button
            onClick={loadData}
            className="p-1.5 md:p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </h3>
        <button
          onClick={() => navigate("/fuel/add")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 md:space-x-2 transition shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> <span>ເພີ່ມໃໝ່</span>
        </button>
      </div>

      {/* --- Filter --- */}
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
              className="block w-full min-w-full h-[40px] md:h-[48px] pl-8 md:pl-10 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium bg-gray-50 hover:bg-white transition m-0"
            />
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 md:left-3.5 top-2.5 md:top-3.5 pointer-events-none" />
          </div>
        </div>
        <div className="flex flex-col z-20 relative min-w-0 w-full">
          <SearchableSelect
            label="ຄົ້ນຫາຕາມທະບຽນລົດ:"
            placeholder="-- ທັງໝົດ --"
            value={filterPlate}
            options={cars}
            onChange={setFilterPlate}
            showAllOption={true}
          />
        </div>
        <div className="flex items-end z-10 relative">
          <button
            onClick={() => {
              setFilterDate("");
              setFilterPlate("");
              setSortConfig({ key: "date", direction: "desc" });
            }}
            className="px-4 md:px-5 h-[40px] md:h-[48px] text-xs md:text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg font-bold transition w-full md:w-auto active:scale-95"
          >
            ລ້າງການຄົ້ນຫາ/ຈັດລຽງ
          </button>
        </div>
      </div>

      {/* --- Desktop Table View --- */}
      <div className="hidden md:block overflow-x-auto p-2 pb-24">
        <table className="w-full min-w-[950px] text-left text-sm text-gray-600 whitespace-nowrap relative">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 text-center font-bold">ລ/ດ</th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition font-bold"
                onClick={() => requestSort("date")}
              >
                ວັນທີ {renderSortIcon("date")}
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition font-bold"
                onClick={() => requestSort("licensePlate")}
              >
                ທະບຽນລົດ {renderSortIcon("licensePlate")}
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition font-bold"
                onClick={() => requestSort("liters")}
              >
                ລິດ {renderSortIcon("liters")}
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition font-bold text-right"
                onClick={() => requestSort("actualPaid")}
              >
                ຈ່າຍຈິງ (ກີບ) {renderSortIcon("actualPaid")}
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition font-bold text-right"
                onClick={() => requestSort("odometer")}
              >
                ເລກຫຼັກລົດ (ກມ) {renderSortIcon("odometer")}
              </th>
              <th className="px-6 py-4 text-center font-bold">ຮູບພາບ</th>
              <th className="px-6 py-4 text-center font-bold">ຈັດການ</th>
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
                  <td className="px-6 py-4 font-black text-gray-800 text-base">
                    {log.licensePlate}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {formatNumber(log.liters)}
                  </td>
                  <td className="px-6 py-4 text-orange-600 font-black text-right text-base">
                    {formatInteger(log.actualPaid)}
                  </td>
                  <td className="px-6 py-4 font-medium text-right">
                    {formatInteger(log.odometer)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      {log.receiptUrl?.startsWith("http") ? (
                        <a
                          href={log.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1.5 bg-orange-100 text-orange-600 font-bold rounded-lg flex items-center gap-1 hover:bg-orange-200 transition"
                        >
                          <ImageIcon size={14} /> ບິນ
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                      {log.odometerUrl?.startsWith("http") ? (
                        <a
                          href={log.odometerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1.5 bg-blue-100 text-blue-600 font-bold rounded-lg flex items-center gap-1 hover:bg-blue-200 transition"
                        >
                          <MapPin size={14} /> ກິໂລ
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => navigate(`/fuel/edit/${log.id}`)}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition shadow-sm"
                      >
                        <Edit size={16} />
                      </button>
                      {(user?.role === "admin" || user?.role === "user") && (
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition shadow-sm"
                        >
                          <Trash2 size={16} />
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
                  className="text-center py-16 text-gray-400 font-medium"
                >
                  ບໍ່ມີຂໍ້ມູນທີ່ກົງກັບການຄົ້ນຫາ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Mobile Card View --- */}
      <div className="md:hidden flex flex-col gap-3 p-3 bg-gray-50/50 pb-28">
        {sortedLogs.length > 0 ? (
          sortedLogs.map((log, index) => (
            <div
              key={log.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>

              <div className="flex justify-between items-start pl-2">
                <div>
                  <h4 className="font-black text-gray-800 text-lg tracking-wide">
                    {log.licensePlate}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                    <Calendar size={12} className="text-orange-500" />{" "}
                    {formatDateDisplay(log.date)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-orange-600 text-sm bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100 shadow-sm">
                    {formatInteger(log.actualPaid)} ₭
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pl-2 mt-1">
                <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold mb-0.5 flex items-center gap-1">
                    <Droplet size={10} /> ຈຳນວນນ້ຳມັນ
                  </p>
                  <p className="text-sm font-bold text-gray-700">
                    {formatNumber(log.liters)}{" "}
                    <span className="text-xs font-medium text-gray-500">
                      ລິດ
                    </span>
                  </p>
                </div>
                <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold mb-0.5 flex items-center gap-1">
                    <MapPin size={10} /> ເລກກິໂລ (ກມ.)
                  </p>
                  <p className="text-sm font-bold text-gray-700">
                    {formatInteger(log.odometer)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100 pl-2">
                <div className="flex gap-2">
                  {log.receiptUrl?.startsWith("http") ? (
                    <a
                      href={log.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center w-8 h-8 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition"
                      title="ເບິ່ງບິນ"
                    >
                      <ImageIcon size={16} />
                    </a>
                  ) : (
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center opacity-50">
                      <ImageIcon size={16} className="text-gray-300" />
                    </div>
                  )}

                  {log.odometerUrl?.startsWith("http") ? (
                    <a
                      href={log.odometerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                      title="ເບິ່ງເລກກິໂລ"
                    >
                      <MapPin size={16} />
                    </a>
                  ) : (
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center opacity-50">
                      <MapPin size={16} className="text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/fuel/edit/${log.id}`)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
                  >
                    <Edit size={14} />{" "}
                    <span className="hidden sm:inline">ແກ້ໄຂ</span>
                  </button>
                  {(user?.role === "admin" || user?.role === "user") && (
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition"
                    >
                      <Trash2 size={14} />{" "}
                      <span className="hidden sm:inline">ລຶບ</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm font-medium">
            ບໍ່ມີຂໍ້ມູນທີ່ກົງກັບການຄົ້ນຫາ
          </div>
        )}
      </div>

      {/* --- Floating Action Button (FAB) ເພີ່ມໃໝ່ --- */}
      {showFab && (
        <button
          onClick={() => navigate("/fuel/add")}
          className="fixed bottom-24 right-5 md:bottom-24 md:right-10 z-[100] bg-orange-500 hover:bg-orange-600 text-white p-3.5 md:p-4 rounded-full shadow-[0_10px_35px_rgba(249,115,22,0.4)] transition-all duration-500 ease-out active:scale-95 animate-in fade-in zoom-in-75 slide-in-from-bottom-8 flex items-center justify-center"
          title="ເພີ່ມໃໝ່"
        >
          <Plus className="w-6 h-6 md:w-7 md:h-7" strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
