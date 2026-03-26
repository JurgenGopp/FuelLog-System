// src/pages/FuelFormPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
// --- ປ່ຽນຈາກ Droplet ເປັນ Fuel ຢູ່ບ່ອນນີ້ ---
import { Fuel, Edit, ImageIcon, AlertCircle } from "lucide-react";
import { callApi } from "../api/config";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import {
  getLaosDateString,
  formatInteger,
  formatNumber,
  generateLogId,
  generateImageFilename,
} from "../utils/helpers";
import SearchableSelect from "../components/common/SearchableSelect";

const getPreviewUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("data:image") || url.startsWith("blob:")) return url;
  const driveMatch = url.match(/[-\w]{25,}/);
  if (driveMatch && url.includes("google")) {
    const fileId = driveMatch[0];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800-h800&t=${new Date().getTime()}`;
  }
  return url;
};

export default function FuelFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const alertContext = useAlert();
  const showAlert = alertContext?.showAlert || ((msg) => alert(msg));

  const [cars, setCars] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [receiptError, setReceiptError] = useState(false);
  const [odometerError, setOdometerError] = useState(false);

  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await callApi({ action: "getData" });
        if (res.success) {
          const visibleCars =
            user?.role === "admin"
              ? res.cars
              : res.cars.filter((c) => user?.assignedCars?.includes(c));
          const visibleLogs =
            user?.role === "admin"
              ? res.logs
              : res.logs.filter((l) =>
                  user?.assignedCars?.includes(l.licensePlate),
                );
          setCars(visibleCars || []);
          setAllLogs(visibleLogs || []);

          if (id) {
            const logToEdit = visibleLogs.find(
              (l) => String(l.id) === String(id),
            );
            if (logToEdit) {
              setFormData({
                ...logToEdit,
                date: getLaosDateString(logToEdit.date),
              });
              setReceiptError(false);
              setOdometerError(false);
            } else {
              showAlert("ບໍ່ພົບຂໍ້ມູນທີ່ຕ້ອງການແກ້ໄຂ!", "error");
              navigate("/fuel/history");
            }
          }
        } else {
          showAlert("ບໍ່ສາມາດດຶງຂໍ້ມູນໄດ້: " + res.message, "error");
        }
      } catch (error) {
        showAlert("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ", "error");
      }
      setIsLoading(false);
    };
    loadData();
  }, [id, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newData = { ...formData, [name]: value };

    const liters = parseFloat(newData.liters) || 0;
    const price = parseFloat(newData.pricePerLiter) || 0;
    const paid = parseFloat(newData.actualPaid) || 0;

    newData.totalPrice = (liters * price).toFixed(2);
    newData.difference = (liters * price - paid).toFixed(2);

    if (["licensePlate", "odometer", "liters"].includes(name)) {
      const currentOdo = parseFloat(newData.odometer) || 0;
      const pastLogs = allLogs.filter(
        (l) =>
          l.licensePlate === newData.licensePlate &&
          String(l.id) !== String(id),
      );
      let prevOdo =
        pastLogs.length > 0
          ? Math.max(...pastLogs.map((l) => parseFloat(l.odometer) || 0))
          : 0;

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
        if (fieldPrefix === "receipt") setReceiptError(false);
        if (fieldPrefix === "odometer") setOdometerError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const isEdit = !!id;
    const finalId = isEdit ? id : generateLogId(formData.date, allLogs);

    const payloadData = {
      ...formData,
      id: finalId,
      receiptFileName: generateImageFilename(
        "Receipt",
        formData.licensePlate,
        formData.date,
        allLogs,
        id,
      ),
      odoFileName: generateImageFilename(
        "ODO",
        formData.licensePlate,
        formData.date,
        allLogs,
        id,
      ),
      createdAt: isEdit
        ? formData.createdAt
        : new Date().toLocaleString("lo-LA", { timeZone: "Asia/Vientiane" }),
      createdBy: isEdit ? formData.createdBy : user.name,
    };

    try {
      const res = await callApi({
        action: isEdit ? "editLog" : "addLog",
        data: payloadData,
      });
      if (res.success !== false) {
        showAlert(
          isEdit ? "ແກ້ໄຂຂໍ້ມູນສຳເລັດ" : "ບັນທຶກຂໍ້ມູນສຳເລັດ",
          "success",
        );
        navigate("/fuel/history");
      } else {
        showAlert("ບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ: " + res.message, "error");
      }
    } catch (error) {
      showAlert("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນ", "error");
    }
    setIsSaving(false);
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 font-lao animate-in slide-in-from-bottom-4 duration-300 mb-4 relative">
      {/* --- ໜ້າຈໍ Loading ສະເພາະຕອນກຳລັງບັນທຶກ --- */}
      {isSaving && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-700 text-sm md:text-base">
              ກຳລັງບັນທຶກຂໍ້ມູນ...
            </p>
          </div>
        </div>
      )}

      <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4 md:mb-8 border-b pb-3 md:pb-4 flex items-center space-x-2 md:space-x-3">
        <div className="bg-orange-100 p-1.5 md:p-2 rounded-lg">
          {/* --- ປ່ຽນຈາກຮູບຢົດນ້ຳມາເປັນຮູບຕູ້ນ້ຳມັນ (Fuel) --- */}
          <Fuel className="text-orange-500 w-5 h-5 md:w-6 md:h-6" />
        </div>
        <span>{id ? "ແກ້ໄຂຂໍ້ມູນ" : "ບັນທຶກການໃສ່ນ້ຳມັນ"}</span>
      </h2>
      <form onSubmit={handleSave} className="space-y-6 md:space-y-8">
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
                className="block w-full min-w-full h-[40px] md:h-[48px] px-3 md:px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 text-sm md:text-base box-border appearance-none m-0"
              />
            </div>

            <div className="z-20 relative min-w-0 w-full">
              <SearchableSelect
                label="ທະບຽນລົດ"
                placeholder="-- ເລືອກ ຫຼື ພິມຄົ້ນຫາ --"
                value={formData.licensePlate}
                options={cars}
                onChange={(val) =>
                  handleChange({ target: { name: "licensePlate", value: val } })
                }
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
                  className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 box-border"
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
                  className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 box-border"
                />
              </div>
            </div>

            <div className="bg-orange-50 p-4 md:p-6 rounded-xl border border-orange-100 shadow-inner space-y-3 min-w-0">
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-gray-600 font-medium">
                  ລາຄາລວມ (Auto):
                </span>
                <span className="text-base md:text-lg font-black text-gray-800">
                  {formatInteger(formData.totalPrice)} ກີບ
                </span>
              </div>
              <div className="min-w-0">
                <label className="block text-xs md:text-sm font-black text-gray-800 mb-1">
                  ລາຄາຈ່າຍຈິງ (ກີບ)
                </label>
                <input
                  type="number"
                  name="actualPaid"
                  required
                  value={formData.actualPaid}
                  onChange={handleChange}
                  className="w-full h-[48px] md:h-[56px] px-3 md:px-4 border-2 border-orange-300 rounded-lg focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-bold text-lg md:text-xl text-orange-600 box-border"
                />
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm pt-2 border-t border-orange-200">
                <span className="text-gray-600 font-medium">
                  ສ່ວນຕ່າງ (Auto):
                </span>
                <span
                  className={`text-base font-black ${Number(formData.difference) < 0 ? "text-red-500" : "text-green-600"}`}
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
                className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 box-border"
              />
            </div>

            <div className="bg-blue-50 p-4 md:p-6 rounded-xl border border-blue-100 space-y-2 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium text-xs md:text-sm">
                  ໄລຍະທາງຫຼັງເຕີມລ່າສຸດ:
                </span>
                <span className="text-lg md:text-xl font-black text-blue-600">
                  {formatNumber(formData.distance)}{" "}
                  <span className="text-xs font-normal">ກມ.</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium text-xs md:text-sm">
                  ອັດຕາສິ້ນເປືອງ:
                </span>
                <span className="text-lg md:text-xl font-black text-blue-600">
                  {formatNumber(formData.consumption)}{" "}
                  <span className="text-xs font-normal">ກມ./ລິດ</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-5 pt-2">
              <div className="border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition relative overflow-hidden group h-28 md:h-40 flex flex-col justify-center items-center cursor-pointer bg-gray-50">
                {formData.receiptUrl ? (
                  <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center bg-gray-100">
                    {!receiptError ? (
                      <img
                        src={getPreviewUrl(formData.receiptUrl)}
                        className="w-full h-full object-cover"
                        alt="Receipt"
                        onError={() => setReceiptError(true)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                        <span className="text-[10px] md:text-xs text-gray-500">
                          ຮູບບໍ່ພ້ອມໃຊ້ງານ
                          <br />
                          ຫຼື ຖືກບຼັອກ
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white font-bold px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-black bg-opacity-60 rounded-lg backdrop-blur-sm flex items-center space-x-1.5">
                        <Edit className="w-3 h-3 md:w-4 h-4" />{" "}
                        <span>ປ່ຽນຮູບ</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-3 text-center z-0">
                    <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-orange-400 mb-2" />
                    <span className="text-xs md:text-sm font-bold text-gray-700">
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

              <div className="border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition relative overflow-hidden group h-28 md:h-40 flex flex-col justify-center items-center cursor-pointer bg-gray-50">
                {formData.odometerUrl ? (
                  <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center bg-gray-100">
                    {!odometerError ? (
                      <img
                        src={getPreviewUrl(formData.odometerUrl)}
                        className="w-full h-full object-cover"
                        alt="Odometer"
                        onError={() => setOdometerError(true)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                        <span className="text-[10px] md:text-xs text-gray-500">
                          ຮູບບໍ່ພ້ອມໃຊ້ງານ
                          <br />
                          ຫຼື ຖືກບຼັອກ
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white font-bold px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-black bg-opacity-60 rounded-lg backdrop-blur-sm flex items-center space-x-1.5">
                        <Edit className="w-3 h-3 md:w-4 h-4" />{" "}
                        <span>ປ່ຽນຮູບ</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-3 text-center z-0">
                    <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-orange-400 mb-2" />
                    <span className="text-xs md:text-sm font-bold text-gray-700">
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
            onClick={() => navigate("/fuel/history")}
            className="px-6 py-2.5 text-sm md:text-base text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg transition"
          >
            ຍົກເລີກ
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 text-sm md:text-base text-white bg-orange-500 hover:bg-orange-600 font-bold rounded-lg transition shadow-md flex items-center"
          >
            {isSaving ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກຂໍ້ມູນ"}
          </button>
        </div>
      </form>
    </div>
  );
}
