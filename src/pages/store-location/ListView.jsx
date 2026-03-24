// src/pages/store-location/ListView.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Edit,
  Trash2,
  MapPin,
  Navigation,
  User,
} from "lucide-react";
import { LOCATION_GAS_URL } from "../../api/config";

export default function ListView() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(LOCATION_GAS_URL);
      const text = await res.text();
      const json = JSON.parse(text);

      const mapped = (json.data || []).map((rawRow, index) => {
        const row = {};
        for (let key in rawRow) if (key) row[key.trim()] = rawRow[key];
        const getVal = (keys) => {
          for (let k of keys)
            if (row[k] !== undefined && row[k] !== null && row[k] !== "")
              return String(row[k]).trim();
          return "";
        };
        return {
          id: String(row.id || `temp-${index}`),
          customerCode: getVal(["ລະຫັດ", "ລະຫັດລູກຄ້າ"]),
          customerName: getVal(["ລາຍຊື່ລູກຄ້າ", "ຊື່ລູກຄ້າ"]),
          phone: getVal(["ເບີໂທ", "ເບີໂທຕິດຕໍ່"]),
          village: getVal(["ບ້ານ"]),
          district: getVal(["ເມືອງ"]),
          province: getVal(["ແຂວງ"]),
          lat: getVal(["lat"]),
          lng: getVal(["lng"]),
          salesperson: getVal(["ຝ່າຍຂາຍຮັບຜິດຊອບ", "ພະນັກງານຂາຍ"]),
          salesPhone: getVal(["ເບີໂທຝ່າຍຂາຍ", "salesPhone"]),
        };
      });
      setCustomers(mapped);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("ທ່ານຕ້ອງການລຶບຂໍ້ມູນນີ້ແທ້ບໍ່?")) {
      setIsLoading(true);
      try {
        await fetch(LOCATION_GAS_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "DELETE", payload: { id } }),
        });
        fetchCustomers();
      } catch (err) {
        alert("ລຶບບໍ່ສຳເລັດ");
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (customer) => {
    // ສົ່ງຂໍ້ມູນລູກຄ້າໄປໜ້າ Form ຜ່ານ state
    navigate("/location/edit", { state: { customerData: customer } });
  };

  const searchKeyword = search.toLowerCase().replace(/\s/g, "");
  const filtered = customers.filter(
    (c) =>
      (c.customerName || "")
        .toLowerCase()
        .replace(/\s/g, "")
        .includes(searchKeyword) ||
      (c.customerCode || "")
        .toLowerCase()
        .replace(/\s/g, "")
        .includes(searchKeyword) ||
      (c.phone || "").toLowerCase().replace(/\s/g, "").includes(searchKeyword),
  );

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full font-lao">
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
          onClick={fetchCustomers}
          className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 text-orange-500 hover:bg-orange-50"
        >
          <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="space-y-3 pb-4">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 mx-auto border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <MapPin size={48} className="mx-auto mb-2 opacity-20" />
            <p>ບໍ່ພົບຂໍ້ມູນລູກຄ້າ</p>
          </div>
        ) : (
          filtered.map((c, index) => (
            <div
              key={index}
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
                    {c.salesperson} {c.salesPhone ? `(${c.salesPhone})` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
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
