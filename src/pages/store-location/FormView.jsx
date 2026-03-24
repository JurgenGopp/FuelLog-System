// src/pages/store-location/FormView.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapPin, X, Crosshair, Save } from "lucide-react";
import { LOCATION_GAS_URL } from "../../api/config";
import { useAuth } from "../../contexts/AuthContext";
import LocationPicker from "../../components/location/LocationPicker";

export default function FormView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ຮັບຂໍ້ມູນລູກຄ້າຈາກໜ້າ ListView ຖ້າມີ (ກໍລະນີແກ້ໄຂ)
  const editData = location.state?.customerData || null;

  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    if (editData) setFormData(editData);
  }, [editData]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lat || !formData.lng)
      return alert("ກະລຸນາເລືອກພິກັດສະຖານທີ່ຈາກແຜນທີ່");

    setIsLoading(true);
    const apiPayload = {
      ...formData,
      location: `${formData.lat}, ${formData.lng}`,
      ລະຫັດ: formData.customerCode,
      ລາຍຊື່ລູກຄ້າ: formData.customerName,
      ຊ່ອງທາງ: formData.channel,
      ເບີໂທ: formData.phone,
      ບ້ານ: formData.village,
      ເມືອງ: formData.district,
      ແຂວງ: formData.province,
      ຝ່າຍຂາຍຮັບຜິດຊອບ: formData.salesperson,
      ຜູ້ສ້າງ: formData.creator || user?.name,
    };

    try {
      await fetch(LOCATION_GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text-plain;charset=utf-8" },
        body: JSON.stringify({
          action: editData ? "EDIT" : "ADD",
          payload: apiPayload,
        }),
      });
      navigate("/location/list");
    } catch (err) {
      alert("ບັນທຶກບໍ່ສຳເລັດ");
    }
    setIsLoading(false);
  };

  if (showPicker) {
    return (
      <LocationPicker
        initialLat={formData.lat}
        initialLng={formData.lng}
        onConfirm={(lat, lng) => {
          setFormData({ ...formData, lat, lng });
          setShowPicker(false);
        }}
        onCancel={() => setShowPicker(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full font-lao">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="text-orange-500" size={20} />
            {editData ? "ແກ້ໄຂຂໍ້ມູນສະຖານທີ່" : "ເພີ່ມສະຖານທີ່ຮ້ານຄ້າໃໝ່"}
          </h2>
          <button
            type="button"
            onClick={() => navigate("/location/list")}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
          >
            <X size={20} />
          </button>
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
                className="w-full border border-gray-300 bg-gray-50 rounded-lg p-2.5 outline-none focus:border-orange-500"
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
                className="w-full border border-gray-300 bg-gray-50 rounded-lg p-2.5 outline-none focus:border-orange-500"
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
              className="w-full border border-gray-300 bg-gray-50 rounded-lg p-2.5 outline-none focus:border-orange-500"
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
              className="w-full border border-gray-300 bg-gray-50 rounded-lg p-2.5 outline-none focus:border-orange-500"
            />
          </div>

          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3 shadow-inner">
            <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2">
              <MapPin size={16} /> ທີ່ຕັ້ງສະຖານທີ່ (ພິກັດ)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  ລະຕິຈູດ (Lat) *
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  name="lat"
                  value={formData.lat}
                  onChange={handleChange}
                  className="w-full border border-orange-300 bg-white rounded-lg p-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  ລອງຈິຈູດ (Lng) *
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  name="lng"
                  value={formData.lng}
                  onChange={handleChange}
                  className="w-full border border-orange-300 bg-white rounded-lg p-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="w-full bg-white border border-orange-300 text-orange-600 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-100"
            >
              <Crosshair size={18} />{" "}
              {formData.lat ? "ປ່ຽນພິກັດຈາກແຜນທີ່" : "ເລືອກພິກັດຈາກແຜນທີ່"}
            </button>
            <div className="grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-orange-200">
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
                className="w-full border border-gray-300 bg-gray-50 rounded-lg p-2.5 text-sm outline-none"
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
                className="w-full border border-gray-300 bg-gray-50 rounded-lg p-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex justify-center items-center gap-2 mt-4"
          >
            {isLoading ? (
              "ກຳລັງບັນທຶກ..."
            ) : (
              <>
                <Save size={20} /> ບັນທຶກຂໍ້ມູນ
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
