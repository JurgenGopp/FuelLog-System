// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Car, List, Droplet, FileText, Activity } from "lucide-react";
import FuelChart from "../components/charts/FuelChart";
import {
  formatNumber,
  formatInteger,
  getLaosDateString,
} from "../utils/helpers";
import { callApi } from "../api/config";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ດຶງຂໍ້ມູນຈາກ API ເມື່ອເປີດໜ້ານີ້
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const res = await callApi({ action: "getData" });
      if (res.success) {
        // ກັ່ນຕອງຂໍ້ມູນຕາມສິດຂອງ User
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
    loadData();
  }, [user]);

  const totalLiters = logs.reduce(
    (sum, log) => sum + Number(log.liters || 0),
    0,
  );
  const totalCost = logs.reduce(
    (sum, log) => sum + Number(log.actualPaid || 0),
    0,
  );
  const totalCars = cars.length;

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
  }, [logs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

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
            <p className="text-lg md:text-2xl lg:text-3xl font-black text-gray-800 truncate">
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
            <p className="text-lg md:text-2xl lg:text-3xl font-black text-gray-800 truncate">
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
            <p className="text-lg md:text-2xl lg:text-3xl font-black text-gray-800 truncate">
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
            <p className="text-lg md:text-2xl lg:text-3xl font-black text-gray-800 truncate">
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
