// src/pages/FuelReport.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  List as ListIcon,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Car,
  Droplet,
  DollarSign,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { callApi } from "../api/config";
import { useAuth } from "../contexts/AuthContext";
import {
  getLaosDateString,
  formatNumber,
  formatInteger,
  formatDateDisplay,
} from "../utils/helpers";
import SearchableSelect from "../components/common/SearchableSelect";
import FuelChart from "../components/charts/FuelChart";

export default function FuelReport() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPlate, setSelectedPlate] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [expandedGroup, setExpandedGroup] = useState(null);

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
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filteredLogs = logs.filter((l) => {
    const logDateStr = getLaosDateString(l.date);
    const d = new Date(logDateStr);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && d < start) return false;
    if (end && d > end) return false;
    if (selectedPlate && l.licensePlate !== selectedPlate) return false;

    return true;
  });

  const chartData = useMemo(() => {
    let isDayGrouping = false;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) <= 31)
        isDayGrouping = true;
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

      if (!grouped[key].cars[plate])
        grouped[key].cars[plate] = { liters: 0, actualPaid: 0 };
      grouped[key].cars[plate].liters += l;
      grouped[key].cars[plate].actualPaid += p;
    });

    return Object.values(grouped)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((item) => ({
        ...item,
        carDetailsArray: Object.keys(item.cars)
          .map((plate) => ({ plate, ...item.cars[plate] }))
          .sort((a, b) => b.actualPaid - a.actualPaid),
        consumption:
          item.validLiters > 0
            ? Number((item.distance / item.validLiters).toFixed(2))
            : 0,
      }));
  }, [filteredLogs, startDate, endDate]);

  const reportData = useMemo(() => {
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
    }
    return rawData;
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
  const avgConsumpValue =
    validLitersForAvg > 0
      ? (validDistance / validLitersForAvg).toFixed(2)
      : "0.00";

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300 mb-4 font-lao">
      <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
        {/* --- Header --- */}
        <h3 className="text-base md:text-xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center space-x-2 border-b pb-3 md:pb-4">
          <div className="bg-orange-100 p-1.5 md:p-2 rounded-lg shrink-0">
            <Activity className="text-orange-500 w-4 h-4 md:w-6 h-6" />
          </div>
          <span>ລາຍງານການເຕີມນ້ຳມັນ</span>
          <button
            onClick={loadData}
            className="p-1.5 md:p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition ml-auto shrink-0"
          >
            <RefreshCw className="w-4 h-4 md:w-5 h-5" />
          </button>
        </h3>

        {/* --- Filters --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
          <div className="flex flex-col z-20">
            <label className="text-[10px] md:text-xs font-bold text-gray-500 mb-1">
              ຕັ້ງແຕ່ວັນທີ:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-[40px] md:h-[48px] px-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 text-sm font-medium"
            />
          </div>
          <div className="flex flex-col z-20">
            <label className="text-[10px] md:text-xs font-bold text-gray-500 mb-1">
              ເຖິງວັນທີ:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-[40px] md:h-[48px] px-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 text-sm font-medium"
            />
          </div>
          <div className="flex flex-col z-20">
            <SearchableSelect
              label="ທະບຽນລົດ:"
              placeholder="-- ທັງໝົດ --"
              value={selectedPlate}
              options={cars}
              onChange={setSelectedPlate}
              showAllOption={true}
            />
          </div>
          <div className="flex items-end z-10">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSelectedPlate("");
                setSortConfig({ key: "date", direction: "desc" });
                setExpandedGroup(null);
              }}
              className="h-[40px] md:h-[48px] w-full text-xs md:text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg font-bold transition active:scale-95"
            >
              ລ້າງການຄົ້ນຫາ/ຈັດລຽງ
            </button>
          </div>
        </div>

        {/* --- Summary Cards --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="bg-orange-50 p-4 md:p-5 rounded-xl border border-orange-100 shadow-inner flex flex-col justify-center">
            <span className="text-orange-800 font-bold text-[10px] md:text-sm mb-1 truncate">
              ລວມຈຳນວນລິດ:
            </span>
            <span className="text-lg md:text-2xl font-black text-orange-600 truncate">
              {formatNumber(grandTotalLiters)}{" "}
              <span className="text-[10px] md:text-xs">ລິດ</span>
            </span>
          </div>
          <div className="bg-green-50 p-4 md:p-5 rounded-xl border border-green-100 shadow-inner flex flex-col justify-center">
            <span className="text-green-800 font-bold text-[10px] md:text-sm mb-1 truncate">
              ລວມຄ່ານ້ຳມັນ:
            </span>
            <span className="text-lg md:text-2xl font-black text-green-600 truncate">
              {formatInteger(grandTotalCost)}{" "}
              <span className="text-[10px] md:text-xs">ກີບ</span>
            </span>
          </div>
          <div className="bg-blue-50 p-4 md:p-5 rounded-xl border border-blue-100 shadow-inner flex flex-col justify-center">
            <span className="text-blue-800 font-bold text-[10px] md:text-sm mb-1 truncate">
              ອັດຕາການສິ້ນເປືອງ:
            </span>
            <span className="text-lg md:text-2xl font-black text-blue-600 truncate">
              {formatNumber(avgConsumpValue)}{" "}
              <span className="text-[10px] md:text-xs">ກມ./ລິດ</span>
            </span>
          </div>
          <div className="bg-purple-50 p-4 md:p-5 rounded-xl border border-purple-100 shadow-inner flex flex-col justify-center">
            <span className="text-purple-800 font-bold text-[10px] md:text-sm mb-1 truncate">
              ຈຳນວນຄັ້ງທີ່ເຕີມ:
            </span>
            <span className="text-lg md:text-2xl font-black text-purple-600 truncate">
              {filteredLogs.length}{" "}
              <span className="text-[10px] md:text-xs">ຄັ້ງ</span>
            </span>
          </div>
        </div>

        {/* --- Chart --- */}
        {filteredLogs.length > 0 && (
          <div className="bg-gray-50/50 p-4 md:p-6 rounded-xl border border-gray-100 mb-6">
            <h4 className="text-xs md:text-base font-bold text-gray-800 mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-orange-500" />{" "}
              ກາຟສະແດງຄ່ານ້ຳມັນລວມ ແລະ ປະລິມານນ້ຳມັນ (ຕາມການຄົ້ນຫາ)
            </h4>
            <FuelChart
              data={chartData}
              barKey="actualPaid"
              barName="ຄ່ານ້ຳມັນລວມ"
              barUnit="ກີບ"
              lineKey="liters"
              lineName="ປະລິມານນ້ຳມັນ"
              lineUnit="ລິດ"
            />
          </div>
        )}

        {/* --- Desktop Table View --- */}
        <div className="hidden md:block overflow-x-auto border border-gray-100 rounded-xl">
          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap min-w-[900px]">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-4 text-center font-bold">ລ/ດ</th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition font-bold"
                    onClick={() => requestSort("date")}
                  >
                    ວັນທີ {renderSortIcon("date")}
                  </th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition font-bold"
                    onClick={() => requestSort("plate")}
                  >
                    ທະບຽນລົດ {renderSortIcon("plate")}
                  </th>
                  <th
                    className="px-6 py-4 text-center cursor-pointer hover:bg-gray-200 transition font-bold"
                    onClick={() => requestSort("count")}
                  >
                    ຈຳນວນຄັ້ງ {renderSortIcon("count")}
                  </th>
                  <th
                    className="px-6 py-4 text-right cursor-pointer hover:bg-gray-200 transition font-bold"
                    onClick={() => requestSort("liters")}
                  >
                    ລວມນ້ຳມັນ (ລິດ) {renderSortIcon("liters")}
                  </th>
                  <th
                    className="px-6 py-4 text-right cursor-pointer hover:bg-gray-200 transition font-bold"
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
                          <td className="px-4 py-4 text-center text-gray-400 font-medium flex justify-center space-x-1 items-center">
                            <span>{idx + 1}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-orange-500" : ""}`}
                            />
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {formatDateDisplay(row.date)}
                          </td>
                          <td className="px-6 py-4 font-black text-gray-800 text-base">
                            {row.plate}
                          </td>
                          <td className="px-6 py-4 text-center font-bold bg-gray-50/50">
                            {row.count}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-orange-600 text-base">
                            {formatNumber(row.liters)}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-green-600 text-base">
                            {formatInteger(row.actualPaid)}
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
                                  <ListIcon className="w-4 h-4 text-orange-500" />
                                  <span>
                                    ລາຍລະອຽດການເຕີມ (ວັນທີ:{" "}
                                    {formatDateDisplay(row.date)})
                                  </span>
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs text-gray-600 whitespace-nowrap bg-white rounded-lg shadow-sm border border-gray-200">
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
                                        <th className="px-4 py-3 font-bold text-right">
                                          ຈ່າຍຈິງ (ກີບ)
                                        </th>
                                        <th className="px-4 py-3 font-bold text-center">
                                          ຮູບພາບ
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {row.details.map((det, dIdx) => (
                                        <tr
                                          key={dIdx}
                                          className="hover:bg-gray-50"
                                        >
                                          <td className="px-4 py-3 text-center font-medium text-gray-400">
                                            {dIdx + 1}
                                          </td>
                                          <td className="px-4 py-3 font-bold text-orange-600">
                                            {formatNumber(det.liters)}
                                          </td>
                                          <td className="px-4 py-3">
                                            {formatInteger(det.pricePerLiter)}
                                          </td>
                                          <td className="px-4 py-3 font-bold text-green-600 text-right">
                                            {formatInteger(det.actualPaid)}
                                          </td>
                                          <td className="px-4 py-3 flex justify-center space-x-2">
                                            {det.receiptUrl?.startsWith(
                                              "http",
                                            ) ? (
                                              <a
                                                href={det.receiptUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-2 py-1 bg-orange-100 text-orange-600 rounded flex items-center gap-1 hover:bg-orange-200"
                                              >
                                                <ImageIcon size={12} /> ບິນ
                                              </a>
                                            ) : (
                                              <span className="text-gray-300">
                                                -
                                              </span>
                                            )}
                                            {det.odometerUrl?.startsWith(
                                              "http",
                                            ) ? (
                                              <a
                                                href={det.odometerUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-2 py-1 bg-blue-100 text-blue-600 rounded flex items-center gap-1 hover:bg-blue-200"
                                              >
                                                <MapPin size={12} /> ກິໂລ
                                              </a>
                                            ) : (
                                              <span className="text-gray-300">
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
                      className="text-center py-16 text-gray-400 font-medium"
                    >
                      ບໍ່ມີຂໍ້ມູນລາຍງານໃນຊ່ວງເວລານີ້
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Mobile Card View --- */}
        <div className="md:hidden flex flex-col gap-3 p-3 bg-gray-50/50 rounded-xl mt-4">
          {reportData.length > 0 ? (
            reportData.map((row, idx) => {
              const groupKey = row.date + "_" + row.plate;
              const isExpanded = expandedGroup === groupKey;
              return (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>

                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h4 className="font-black text-gray-800 text-lg tracking-wide">
                        {row.plate}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                        <Calendar size={12} className="text-orange-500" />{" "}
                        {formatDateDisplay(row.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-green-600 text-sm bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100 shadow-sm">
                        {formatInteger(row.actualPaid)} ₭
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pl-2 mt-3">
                    <div className="bg-gray-50/80 p-2 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold mb-0.5 flex items-center gap-1">
                        <Droplet size={10} /> ລວມນ້ຳມັນ
                      </p>
                      <p className="text-sm font-bold text-orange-600">
                        {formatNumber(row.liters)}{" "}
                        <span className="text-[10px] font-medium text-gray-500">
                          ລິດ
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50/80 p-2 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold mb-0.5 flex items-center gap-1">
                        <RefreshCw size={10} /> ຈຳນວນຄັ້ງທີ່ເຕີມ
                      </p>
                      <p className="text-sm font-bold text-gray-700">
                        {row.count}{" "}
                        <span className="text-[10px] font-medium text-gray-500">
                          ຄັ້ງ
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className="mt-3 mx-2 py-2 flex items-center justify-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    {isExpanded ? "ເຊື່ອງລາຍລະອຽດ" : "ເບິ່ງລາຍລະອຽດແຕ່ລະບິນ"}
                    {isExpanded ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  {/* Expanded Mobile View */}
                  {isExpanded && (
                    <div className="mt-3 pl-2 flex flex-col gap-2 border-t border-dashed border-gray-200 pt-3 animate-in fade-in slide-in-from-top-2">
                      {row.details.map((det, dIdx) => (
                        <div
                          key={dIdx}
                          className="bg-orange-50/30 border border-orange-100 p-3 rounded-xl flex flex-col gap-2"
                        >
                          <div className="flex justify-between items-center border-b border-orange-100/50 pb-1.5">
                            <span className="text-[10px] font-bold text-orange-400 bg-orange-100 px-2 py-0.5 rounded-md">
                              ຄັ້ງທີ {dIdx + 1}
                            </span>
                            <span className="text-xs font-black text-green-600">
                              {formatInteger(det.actualPaid)} ₭
                            </span>
                          </div>

                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-medium">
                              ຈຳນວນ:{" "}
                              <span className="font-bold text-orange-600">
                                {formatNumber(det.liters)} L
                              </span>
                            </span>
                            <span className="text-gray-500 font-medium">
                              ລາຄາ:{" "}
                              <span className="font-bold text-gray-700">
                                {formatInteger(det.pricePerLiter)} ₭/L
                              </span>
                            </span>
                          </div>

                          <div className="flex gap-2 mt-1">
                            {det.receiptUrl?.startsWith("http") ? (
                              <a
                                href={det.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-lg hover:bg-orange-200"
                              >
                                <ImageIcon size={12} /> ເບິ່ງບິນ
                              </a>
                            ) : (
                              <div className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-lg">
                                <ImageIcon size={12} /> ບໍ່ມີບິນ
                              </div>
                            )}

                            {det.odometerUrl?.startsWith("http") ? (
                              <a
                                href={det.odometerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-200"
                              >
                                <MapPin size={12} /> ເລກກິໂລ
                              </a>
                            ) : (
                              <div className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-lg">
                                <MapPin size={12} /> ບໍ່ມີກິໂລ
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm font-medium">
              ບໍ່ມີຂໍ້ມູນລາຍງານໃນຊ່ວງເວລານີ້
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
