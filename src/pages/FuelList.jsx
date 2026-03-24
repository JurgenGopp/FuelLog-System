// src/pages/FuelList.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { callApi } from "../api/config";
import { useAuth } from "../contexts/AuthContext";
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
  const [logs, setLogs] = useState([]);
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterDate, setFilterDate] = useState("");
  const [filterPlate, setFilterPlate] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const loadData = async () => {
    setIsLoading(true);
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
      alert("ບໍ່ສາມາດດຶງຂໍ້ມູນໄດ້: " + res.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm("ທ່ານຕ້ອງການລຶບຂໍ້ມູນການເຕີມນ້ຳມັນນີ້ແທ້ບໍ່?")) {
      setIsLoading(true);
      const res = await callApi({ action: "deleteLog", id });
      if (res.success !== false) {
        setLogs(logs.filter((l) => l.id !== id));
      } else {
        alert("ລຶບຂໍ້ມູນບໍ່ສຳເລັດ: " + res.message);
      }
      setIsLoading(false);
    }
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
        <ArrowUpDown className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-gray-400 opacity-50" />
      );
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-orange-500" />
    ) : (
      <ArrowDown className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-orange-500" />
    );
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-base md:text-lg font-bold text-gray-800 font-lao flex items-center space-x-2">
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
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1 md:space-x-2 transition shadow-md"
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
              className="block w-full min-w-full h-[40px] md:h-[48px] pl-8 md:pl-10 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-xs md:text-sm font-medium bg-gray-50 m-0"
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
            className="px-4 md:px-5 h-[40px] md:h-[48px] text-xs md:text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg font-bold transition w-full md:w-auto"
          >
            ລ້າງການຄົ້ນຫາ/ຈັດລຽງ
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-[65vh]">
        <table className="w-full text-left text-xs md:text-sm text-gray-600 whitespace-nowrap relative">
          <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] md:text-xs border-b border-gray-100 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr>
              <th className="px-3 py-3 md:px-4 md:py-4 text-center">ລ/ດ</th>
              <th
                className="px-3 py-3 md:px-6 md:py-4 cursor-pointer"
                onClick={() => requestSort("date")}
              >
                ວັນທີ {renderSortIcon("date")}
              </th>
              <th
                className="px-3 py-3 md:px-6 md:py-4 cursor-pointer"
                onClick={() => requestSort("licensePlate")}
              >
                ທະບຽນລົດ {renderSortIcon("licensePlate")}
              </th>
              <th
                className="px-3 py-3 md:px-6 md:py-4 cursor-pointer"
                onClick={() => requestSort("liters")}
              >
                ລິດ {renderSortIcon("liters")}
              </th>
              <th
                className="px-3 py-3 md:px-6 md:py-4 cursor-pointer"
                onClick={() => requestSort("actualPaid")}
              >
                ຈ່າຍຈິງ (ກີບ) {renderSortIcon("actualPaid")}
              </th>
              <th
                className="px-3 py-3 md:px-6 md:py-4 cursor-pointer"
                onClick={() => requestSort("odometer")}
              >
                ເລກຫຼັກລົດ (ກມ) {renderSortIcon("odometer")}
              </th>
              <th className="px-3 py-3 md:px-6 md:py-4 text-center">ຮູບພາບ</th>
              <th className="px-3 py-3 md:px-6 md:py-4 text-center">ຈັດການ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedLogs.length > 0 ? (
              sortedLogs.map((log, index) => (
                <tr key={log.id} className="hover:bg-orange-50/50 transition">
                  <td className="px-3 py-3 md:px-4 text-center text-gray-400 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-3 py-3 md:px-6 font-medium">
                    {formatDateDisplay(log.date)}
                  </td>
                  <td className="px-3 py-3 md:px-6 font-black text-gray-800">
                    {log.licensePlate}
                  </td>
                  <td className="px-3 py-3 md:px-6">
                    {formatNumber(log.liters)}
                  </td>
                  <td className="px-3 py-3 md:px-6 text-orange-600 font-black">
                    {formatInteger(log.actualPaid)}
                  </td>
                  <td className="px-3 py-3 md:px-6">
                    {formatInteger(log.odometer)}
                  </td>
                  <td className="px-3 py-3 md:px-6 text-center">
                    <div className="flex justify-center space-x-1.5 md:space-x-2">
                      {log.receiptUrl?.startsWith("http") ? (
                        <a
                          href={log.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-1.5 py-1 bg-orange-100 text-orange-600 font-bold rounded flex"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                      {log.odometerUrl?.startsWith("http") ? (
                        <a
                          href={log.odometerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-1.5 py-1 bg-blue-100 text-blue-600 font-bold rounded flex"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 md:px-6 text-center">
                    <div className="flex justify-center space-x-1.5">
                      <button
                        onClick={() => navigate(`/fuel/edit/${log.id}`)}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Edit className="w-3 h-3 md:w-4 h-4" />
                      </button>
                      {(user?.role === "admin" || user?.role === "user") && (
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded"
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
                <td colSpan="8" className="text-center py-12 text-gray-400">
                  ບໍ່ມີຂໍ້ມູນທີ່ກົງກັບການຄົ້ນຫາ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
