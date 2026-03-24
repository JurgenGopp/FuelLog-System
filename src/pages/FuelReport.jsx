// src/pages/FuelReport.jsx
import React, { useState, useEffect, useMemo, Fragment } from "react";
import {
  Activity,
  RefreshCw,
  ChevronDown,
  List as ListIcon,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
        <ArrowUpDown className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-gray-400 opacity-50" />
      );
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-orange-500" />
    ) : (
      <ArrowDown className="w-2 h-2 md:w-3 h-3 ml-1 inline-block text-orange-500" />
    );
  };

  const grandTotalLiters = reportData.reduce((sum, row) => sum + row.liters, 0);
  const grandTotalCost = reportData.reduce(
    (sum, row) => sum + row.actualPaid,
    0,
  );
  const averageConsumption = filteredLogs.reduce(
    (acc, log) => {
      if (Number(log.distance) > 0) {
        acc.dist += Number(log.distance);
        acc.lit += Number(log.liters);
      }
      return acc;
    },
    { dist: 0, lit: 0 },
  );
  const avgConsumpValue =
    averageConsumption.lit > 0
      ? (averageConsumption.dist / averageConsumption.lit).toFixed(2)
      : "0.00";

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-300 mb-4">
      <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-base md:text-xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center space-x-2 border-b pb-3 md:pb-4">
          <div className="bg-orange-100 p-1.5 md:p-2 rounded-lg shrink-0">
            <Activity className="text-orange-500 w-4 h-4 md:w-6 h-6" />
          </div>
          <span>ລາຍງານການເຕີມນ້ຳມັນ</span>
          <button
            onClick={loadData}
            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition ml-auto shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
          <div className="flex flex-col z-20">
            <label className="text-[10px] md:text-xs font-bold text-gray-500 mb-1">
              ຕັ້ງແຕ່ວັນທີ:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-[40px] md:h-[48px] px-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
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
              className="w-full h-[40px] md:h-[48px] px-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
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
              className="h-[40px] md:h-[48px] w-full text-xs md:text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg font-bold transition"
            >
              ລ້າງການຄົ້ນຫາ/ຈັດລຽງ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 shadow-inner flex flex-col justify-center">
            <span className="text-orange-800 font-bold text-[10px] md:text-sm mb-1 truncate">
              ລວມຈຳນວນລິດ:
            </span>
            <span className="text-lg md:text-2xl font-black text-orange-600 truncate">
              {formatNumber(grandTotalLiters)}{" "}
              <span className="text-xs">ລິດ</span>
            </span>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-inner flex flex-col justify-center">
            <span className="text-green-800 font-bold text-[10px] md:text-sm mb-1 truncate">
              ລວມຄ່ານ້ຳມັນ:
            </span>
            <span className="text-lg md:text-2xl font-black text-green-600 truncate">
              {formatInteger(grandTotalCost)}{" "}
              <span className="text-xs">ກີບ</span>
            </span>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-inner flex flex-col justify-center">
            <span className="text-blue-800 font-bold text-[10px] md:text-sm mb-1 truncate">
              ອັດຕາການສິ້ນເປືອງ:
            </span>
            <span className="text-lg md:text-2xl font-black text-blue-600 truncate">
              {formatNumber(avgConsumpValue)}{" "}
              <span className="text-xs">ກມ./ລິດ</span>
            </span>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-inner flex flex-col justify-center">
            <span className="text-purple-800 font-bold text-[10px] md:text-sm mb-1 truncate">
              ຈຳນວນຄັ້ງທີ່ເຕີມ:
            </span>
            <span className="text-lg md:text-2xl font-black text-purple-600 truncate">
              {filteredLogs.length} <span className="text-xs">ຄັ້ງ</span>
            </span>
          </div>
        </div>

        {filteredLogs.length > 0 && (
          <div className="bg-gray-50/50 p-4 md:p-6 rounded-xl border border-gray-100 mb-6">
            <h4 className="text-sm md:text-base font-bold text-gray-800 mb-4 font-lao flex items-center">
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

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full text-left text-xs md:text-sm text-gray-600 whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] md:text-xs border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-3 py-3 md:px-4 text-center">ລ/ດ</th>
                  <th
                    className="px-3 py-3 md:px-6 cursor-pointer"
                    onClick={() => requestSort("date")}
                  >
                    ວັນທີ {renderSortIcon("date")}
                  </th>
                  <th
                    className="px-3 py-3 md:px-6 cursor-pointer"
                    onClick={() => requestSort("plate")}
                  >
                    ທະບຽນລົດ {renderSortIcon("plate")}
                  </th>
                  <th
                    className="px-3 py-3 md:px-6 text-center cursor-pointer"
                    onClick={() => requestSort("count")}
                  >
                    ຈຳນວນຄັ້ງ {renderSortIcon("count")}
                  </th>
                  <th
                    className="px-3 py-3 md:px-6 text-right cursor-pointer"
                    onClick={() => requestSort("liters")}
                  >
                    ລວມນ້ຳມັນ (ລິດ) {renderSortIcon("liters")}
                  </th>
                  <th
                    className="px-3 py-3 md:px-6 text-right cursor-pointer"
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
                      <Fragment key={idx}>
                        <tr
                          className="hover:bg-orange-50/50 transition cursor-pointer"
                          onClick={() =>
                            setExpandedGroup(isExpanded ? null : groupKey)
                          }
                        >
                          <td className="px-3 py-3 md:px-4 text-center text-gray-400 font-medium flex justify-center space-x-1">
                            <span>{idx + 1}</span>
                            <ChevronDown
                              className={`w-3 h-3 md:w-4 h-4 transition-transform ${isExpanded ? "rotate-180 text-orange-500" : ""}`}
                            />
                          </td>
                          <td className="px-3 py-3 md:px-6 font-medium">
                            {formatDateDisplay(row.date)}
                          </td>
                          <td className="px-3 py-3 md:px-6 font-black text-gray-800">
                            {row.plate}
                          </td>
                          <td className="px-3 py-3 md:px-6 text-center font-bold bg-gray-50/50">
                            {row.count}
                          </td>
                          <td className="px-3 py-3 md:px-6 text-right font-black text-orange-600">
                            {formatNumber(row.liters)}
                          </td>
                          <td className="px-3 py-3 md:px-6 text-right font-black text-green-600">
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
                                <h4 className="text-xs md:text-sm font-bold text-gray-700 mb-2 flex items-center space-x-1.5">
                                  <ListIcon className="w-3 h-3 text-orange-500" />
                                  <span>
                                    ລາຍລະອຽດການເຕີມ (ວັນທີ:{" "}
                                    {formatDateDisplay(row.date)})
                                  </span>
                                </h4>
                                <table className="w-full text-left text-[10px] md:text-xs text-gray-600 whitespace-nowrap bg-white rounded-lg shadow-sm border border-gray-200">
                                  <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                                    <tr>
                                      <th className="px-2 py-2 font-bold text-center">
                                        ຄັ້ງທີ
                                      </th>
                                      <th className="px-2 py-2 font-bold">
                                        ຈຳນວນ (ລິດ)
                                      </th>
                                      <th className="px-2 py-2 font-bold">
                                        ລາຄາ/ລິດ (ກີບ)
                                      </th>
                                      <th className="px-2 py-2 font-bold">
                                        ຈ່າຍຈິງ (ກີບ)
                                      </th>
                                      <th className="px-2 py-2 font-bold text-center">
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
                                        <td className="px-2 py-2 text-center font-medium">
                                          {dIdx + 1}
                                        </td>
                                        <td className="px-2 py-2 font-bold">
                                          {formatNumber(det.liters)}
                                        </td>
                                        <td className="px-2 py-2">
                                          {formatInteger(det.pricePerLiter)}
                                        </td>
                                        <td className="px-2 py-2 font-bold text-green-600">
                                          {formatInteger(det.actualPaid)}
                                        </td>
                                        <td className="px-2 py-2 flex justify-center space-x-1.5">
                                          {det.receiptUrl?.startsWith(
                                            "http",
                                          ) ? (
                                            <a
                                              href={det.receiptUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-1.5 py-1 bg-orange-100 text-orange-600 rounded"
                                            >
                                              ບິນ
                                            </a>
                                          ) : (
                                            "-"
                                          )}
                                          {det.odometerUrl?.startsWith(
                                            "http",
                                          ) ? (
                                            <a
                                              href={det.odometerUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-1.5 py-1 bg-blue-100 text-blue-600 rounded"
                                            >
                                              ກິໂລ
                                            </a>
                                          ) : (
                                            "-"
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
                      </Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400">
                      ບໍ່ມີຂໍ້ມູນລາຍງານໃນຊ່ວງເວລານີ້
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
