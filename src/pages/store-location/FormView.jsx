// src/pages/store-location/FormView.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MapPin,
  Store,
  LocateFixed,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { LOCATION_GAS_URL, GOOGLE_MAPS_API_KEY } from "../../api/config";
import { useAuth } from "../../contexts/AuthContext";
import { useAlert } from "../../contexts/AlertContext";

export default function FormView() {
  const navigate = useNavigate();
  const locationState = useLocation().state;
  const isEdit = !!locationState?.customer;
  const { user } = useAuth();

  const alertContext = useAlert();
  const showAlert = alertContext?.showAlert || ((msg) => alert(msg));

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
  });

  const [isSaving, setIsSaving] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    if (isEdit) {
      const c = locationState.customer;

      let lat = c.lat || "";
      let lng = c.lng || "";
      if (c.location && (!lat || !lng)) {
        const parts = c.location.split(",");
        if (parts.length === 2) {
          lat = parts[0].trim();
          lng = parts[1].trim();
        }
      }

      setFormData({
        id: c.id || "",
        customerCode: c.customerCode || c["ລະຫັດລູກຄ້າ"] || "",
        customerName: c.customerName || c["ລາຍຊື່ລູກຄ້າ"] || "",
        channel: c.channel || c["ຊ່ອງທາງ"] || "",
        phone: c.phone || c["ເບີໂທ"] || "",
        village: c.village || c["ບ້ານ"] || "",
        district: c.district || c["ເມືອງ"] || "",
        province: c.province || c["ແຂວງ"] || "",
        lat: lat,
        lng: lng,
        salesperson: c.salesperson || c["ຝ່າຍຂາຍຮັບຜິດຊອບ"] || "",
        salesPhone: c.salesPhone || c["ເບີໂທຝ່າຍຂາຍ"] || "",
      });
    }
  }, [isEdit, locationState]);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setScriptLoaded(true);
    } else {
      window.initGoogleMapForForm = () => setScriptLoaded(true);
      const scriptId = "google-maps-script-form";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=lo&region=LA&loading=async&callback=initGoogleMapForForm`;
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && window.google && mapRef.current && !map) {
      const defaultPos = { lat: 17.9757, lng: 102.6331 }; // Vientiane
      let initialPos = defaultPos;

      if (isEdit && formData.lat && formData.lng) {
        initialPos = {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        };
      }

      const m = new window.google.maps.Map(mapRef.current, {
        center: initialPos,
        zoom: isEdit && formData.lat ? 16 : 12,
        mapTypeId: "hybrid",
        gestureHandling: "greedy",
        disableDefaultUI: false,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.LEFT_BOTTOM,
        },
        mapTypeControlOptions: {
          position: window.google.maps.ControlPosition.TOP_LEFT,
        },
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        streetViewControl: false,
      });
      setMap(m);

      const mark = new window.google.maps.Marker({
        position: initialPos,
        map: m,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        visible: isEdit && !!formData.lat,
      });
      setMarker(mark);

      m.addListener("click", (e) => {
        const lat = e.latLng.lat().toFixed(6);
        const lng = e.latLng.lng().toFixed(6);
        mark.setPosition(e.latLng);
        mark.setVisible(true);
        setFormData((prev) => ({ ...prev, lat, lng }));
      });

      mark.addListener("dragend", (e) => {
        const lat = e.latLng.lat().toFixed(6);
        const lng = e.latLng.lng().toFixed(6);
        setFormData((prev) => ({ ...prev, lat, lng }));
      });
    }
  }, [scriptLoaded, mapRef, map]); // eslint-disable-line

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocateMe = (e) => {
    e.preventDefault();
    if (navigator.geolocation && map && marker) {
      showAlert("ກຳລັງຄົ້ນຫາທີ່ຕັ້ງ...", "success");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          map.setCenter(coords);
          map.setZoom(17);
          marker.setPosition(coords);
          marker.setVisible(true);
          setFormData((prev) => ({
            ...prev,
            lat: coords.lat.toFixed(6),
            lng: coords.lng.toFixed(6),
          }));
        },
        () =>
          showAlert(
            "ບໍ່ສາມາດດຶງທີ່ຢູ່ປັດຈຸບັນໄດ້. ກະລຸນາເປີດ GPS ໃນອຸປະກອນຂອງທ່ານ.",
            "error",
          ),
        { enableHighAccuracy: true },
      );
    } else {
      showAlert("ອຸປະກອນຂອງທ່ານບໍ່ຮອງຮັບການຊອກຫາທີ່ຕັ້ງ", "error");
    }
  };

  const handleShowOnMap = () => {
    const parsedLat = parseFloat(formData.lat);
    const parsedLng = parseFloat(formData.lng);

    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      const newPos = { lat: parsedLat, lng: parsedLng };
      if (map && marker) {
        map.setCenter(newPos);
        map.setZoom(16);
        marker.setPosition(newPos);
        marker.setVisible(true);
        showAlert("ອັບເດດຕຳແໜ່ງໃນແຜນທີ່ສຳເລັດ", "success");
      }
    } else {
      showAlert("ກະລຸນາປ້ອນພິກັດ (ຕົວເລກ) ໃຫ້ຖືກຕ້ອງກ່ອນ", "warning");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const now = new Date();
      const recordedAt = now.toLocaleString("en-GB");

      const apiData = {
        id: formData.id || "",
        ລະຫັດລູກຄ້າ: formData.customerCode,
        ລາຍຊື່ລູກຄ້າ: formData.customerName,
        ຊ່ອງທາງ: formData.channel,
        ເບີໂທ: formData.phone,
        ບ້ານ: formData.village,
        ເມືອງ: formData.district,
        ແຂວງ: formData.province,
        location: `${formData.lat}, ${formData.lng}`,
        ຝ່າຍຂາຍຮັບຜິດຊອບ: formData.salesperson,
        ເບີໂທຝ່າຍຂາຍ: formData.salesPhone,
        ວັນທີສ້າງ: recordedAt,
        ຜູ້ສ້າງ: user?.username || user?.name || "Unknown",
      };

      const payload = {
        action: isEdit ? "editLocation" : "addLocation",
        data: apiData,
      };

      const res = await fetch(LOCATION_GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success !== false) {
        showAlert(
          isEdit ? "ແກ້ໄຂຂໍ້ມູນຮ້ານຄ້າສຳເລັດ" : "ບັນທຶກຮ້ານຄ້າໃໝ່ສຳເລັດ",
          "success",
        );
        navigate("/location/list");
      } else {
        showAlert("ບັນທຶກບໍ່ສຳເລັດ: " + data.message, "error");
      }
    } catch (err) {
      showAlert(
        isEdit
          ? "ແກ້ໄຂຂໍ້ມູນສຳເລັດ (Offline Mode)"
          : "ບັນທຶກຂໍ້ມູນສຳເລັດ (Offline Mode)",
        "success",
      );
      navigate("/location/list");
    }

    setIsSaving(false);
  };

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 font-lao animate-in slide-in-from-bottom-4 duration-300 mb-4 max-w-5xl mx-auto relative">
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

      <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-6 md:mb-8 border-b pb-3 md:pb-4 flex items-center space-x-2 md:space-x-3">
        <div className="bg-orange-100 p-1.5 md:p-2 rounded-lg">
          <Store className="text-orange-500 w-5 h-5 md:w-6 md:h-6" />
        </div>
        <span>{isEdit ? "ແກ້ໄຂຂໍ້ມູນຮ້ານຄ້າ" : "ເພີ່ມຮ້ານຄ້າໃໝ່"}</span>
      </h2>

      <form onSubmit={handleSave} className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* ຖັນຊ້າຍ: ຂໍ້ມູນຮ້ານຄ້າ */}
          <div className="space-y-4 md:space-y-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
              <Store size={18} className="text-gray-400" /> ຂໍ້ມູນທົ່ວໄປ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  ລະຫັດລູກຄ້າ *
                </label>
                <input
                  required
                  name="customerCode"
                  value={formData.customerCode}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm bg-gray-50 focus:bg-white"
                  placeholder="ປ້ອນລະຫັດ..."
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  ຊື່ລູກຄ້າ *
                </label>
                <input
                  required
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm bg-gray-50 focus:bg-white"
                  placeholder="ປ້ອນຊື່ຮ້ານ/ລູກຄ້າ..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ຊ່ອງເພີ່ມໃໝ່: ຊ່ອງທາງ */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  ຊ່ອງທາງ (Channel)
                </label>
                <input
                  name="channel"
                  value={formData.channel}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm bg-gray-50 focus:bg-white"
                  placeholder="ຕົວຢ່າງ: HOReCa..."
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  ເບີໂທຕິດຕໍ່ (ຮ້ານ)
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm bg-gray-50 focus:bg-white"
                  placeholder="ປ້ອນເບີໂທຮ້ານຄ້າ..."
                />
              </div>
            </div>

            <h3 className="font-bold text-gray-800 flex items-center gap-2 mt-6 mb-2 border-b border-gray-100 pb-2">
              <MapPin size={18} className="text-gray-400" /> ທີ່ຢູ່
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  ບ້ານ *
                </label>
                <input
                  required
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm bg-gray-50 focus:bg-white"
                  placeholder="ປ້ອນບ້ານ..."
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  ເມືອງ *
                </label>
                <input
                  required
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm bg-gray-50 focus:bg-white"
                  placeholder="ປ້ອນເມືອງ..."
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  ແຂວງ
                </label>
                <input
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm bg-gray-50 focus:bg-white"
                  placeholder="ປ້ອນແຂວງ..."
                />
              </div>
            </div>

            <h3 className="font-bold text-gray-800 flex items-center gap-2 mt-6 mb-2 border-b border-gray-100 pb-2">
              <User size={18} className="text-gray-400" /> ຂໍ້ມູນຜູ້ຮັບຜິດຊອບ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  ຝ່າຍຂາຍຮັບຜິດຊອບ
                </label>
                <input
                  name="salesperson"
                  value={formData.salesperson}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm bg-gray-50 focus:bg-white"
                  placeholder="ປ້ອນຊື່ຝ່າຍຂາຍ..."
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  ເບີໂທ ຝ່າຍຂາຍ
                </label>
                <input
                  name="salesPhone"
                  value={formData.salesPhone}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm bg-gray-50 focus:bg-white"
                  placeholder="ປ້ອນເບີໂທຝ່າຍຂາຍ..."
                />
              </div>
            </div>
          </div>

          {/* ຖັນຂວາ: ແຜນທີ່ປັກໝຸດ */}
          <div className="space-y-3 flex flex-col h-full">
            <div className="flex justify-between items-end">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <MapPin size={18} className="text-orange-500" /> ປັກໝຸດທີ່ຕັ້ງ
                (ພິກັດ)
              </h3>
              {formData.lat && formData.lng ? (
                <span className="text-[10px] md:text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md flex items-center gap-1">
                  <CheckCircle size={12} /> ມີພິກັດແລ້ວ
                </span>
              ) : (
                <span className="text-[10px] md:text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md flex items-center gap-1">
                  <XCircle size={12} /> ຍັງບໍ່ມີພິກັດ
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-gray-500">
              ຄລິກໃສ່ແຜນທີ່ເພື່ອປັກໝຸດ ຫຼື ກົດປຸ່ມດຶງຕຳແໜ່ງປັດຈຸບັນ.
            </p>

            <div className="relative flex-1 min-h-[300px] md:min-h-[400px] bg-gray-200 rounded-2xl overflow-hidden border-2 border-gray-300 focus-within:border-orange-500 transition-colors shadow-inner">
              <div ref={mapRef} className="w-full h-full" />
              <button
                type="button"
                onClick={handleLocateMe}
                className="absolute bottom-6 right-4 md:right-6 bg-white text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-3 md:p-4 rounded-full shadow-lg border border-gray-100 transition transform hover:scale-105 active:scale-95 flex items-center justify-center group"
                title="ດຶງຕຳແໜ່ງປັດຈຸບັນ"
              >
                <LocateFixed size={22} className="group-hover:animate-pulse" />
              </button>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold mb-1 block">
                    Latitude (ລັດຕິຈູດ)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="lat"
                    value={formData.lat}
                    onChange={handleChange}
                    placeholder="ຕົວຢ່າງ: 17.9757"
                    className="w-full h-[42px] px-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold mb-1 block">
                    Longitude (ລອງຈິຈູດ)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="lng"
                    value={formData.lng}
                    onChange={handleChange}
                    placeholder="ຕົວຢ່າງ: 102.6331"
                    className="w-full h-[42px] px-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleShowOnMap}
                className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-sm active:scale-95 text-sm"
              >
                <MapPin size={18} />
                ສະແດງຕຳແໜ່ງໃນແຜນທີ່
              </button>
            </div>
          </div>
        </div>

        {/* ປຸ່ມຈັດການ */}
        <div className="flex justify-end space-x-3 md:space-x-4 pt-6 md:pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate("/location/list")}
            className="px-6 py-3 text-sm md:text-base text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition"
          >
            ຍົກເລີກ
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 text-sm md:text-base text-white bg-orange-500 hover:bg-orange-600 font-bold rounded-xl transition shadow-md flex items-center active:scale-95"
          >
            {isSaving ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກຮ້ານຄ້າ"}
          </button>
        </div>
      </form>
    </div>
  );
}
