// src/pages/store-location/ListView.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MapPin,
  RefreshCw,
  Store,
  Phone,
  User,
  X,
} from "lucide-react";
import { LOCATION_GAS_URL } from "../../api/config";
import { useAuth } from "../../contexts/AuthContext";
import { useAlert } from "../../contexts/AlertContext";

export default function ListView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const alertContext = useAlert();
  const showAlert = alertContext?.showAlert || ((msg) => alert(msg));
  const showConfirm =
    alertContext?.showConfirm ||
    ((msg, onConfirm) => {
      if (window.confirm(msg)) onConfirm();
    });

  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

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
        let lat = "",
          lng = "";
        const loc = getVal(["location", "ທີ່ຕັ້ງ", "ພິກັດ"]);
        if (loc) {
          const parts = loc.split(",");
          if (parts.length === 2) {
            lat = parts[0].trim();
            lng = parts[1].trim();
          }
        }

        return {
          id: String(row.id || row["ລະຫັດລູກຄ້າ"] || `temp-${index}`),
          customerCode: getVal(["ລະຫັດ", "ລະຫັດລູກຄ້າ"]),
          customerName: getVal(["ລາຍຊື່ລູກຄ້າ", "ຊື່ລູກຄ້າ"]),
          phone: getVal(["ເບີໂທ", "ເບີໂທຕິດຕໍ່"]),
          village: getVal(["ບ້ານ"]),
          district: getVal(["ເມືອງ"]),
          province: getVal(["ແຂວງ"]),
          lat: lat || getVal(["lat"]),
          lng: lng || getVal(["lng"]),
          salesperson: getVal(["ຝ່າຍຂາຍຮັບຜິດຊອບ", "ພະນັກງານຂາຍ"]),
          salesPhone: getVal(["ເບີໂທຝ່າຍຂາຍ", "ເບີໂທພະນັກງານຂາຍ"]),
        };
      });
      setCustomers(mapped);
    } catch (err) {
      showAlert("ບໍ່ສາມາດດຶງຂໍ້ມູນຮ້ານຄ້າໄດ້: " + err.message, "error");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = (id) => {
    if (!id || String(id).startsWith("temp-")) {
      showAlert("ບໍ່ສາມາດລຶບໄດ້: ຂໍ້ມູນນີ້ບໍ່ມີລະຫັດ ID ໃນຖານຂໍ້ມູນ", "error");
      return;
    }

    showConfirm("ທ່ານຕ້ອງການລຶບຂໍ້ມູນຮ້ານຄ້ານີ້ແທ້ບໍ່?", async () => {
      setIsDeleting(true);
      try {
        const res = await fetch(LOCATION_GAS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({
            action: "deleteLocation",
            data: { id: id },
            payload: { id: id },
          }),
        });

        const textResponse = await res.text();
        let data;
        try {
          data = JSON.parse(textResponse);
        } catch (err) {
          throw new Error("ການຕອບກັບຈາກເຊີບເວີຜິດພາດ");
        }

        if (data.success === true || data.status === "success") {
          setCustomers((prev) => prev.filter((c) => c.id !== id));
          showAlert("ລຶບຂໍ້ມູນຮ້ານຄ້າສຳເລັດ", "success");
        } else {
          showAlert(
            "ລຶບບໍ່ສຳເລັດ: " + (data.message || "ເກີດຂໍ້ຜິດພາດໃນເຊີບເວີ"),
            "error",
          );
        }
      } catch (error) {
        showAlert("ບໍ່ສາມາດເຊື່ອມຕໍ່ຖານຂໍ້ມູນໄດ້: " + error.message, "error");
      }
      setIsDeleting(false);
    });
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchKeyword(val);
    }, 400);
  };

  const clearSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    setSearchKeyword("");
  };

  const filteredCustomers = useMemo(() => {
    const keyword = searchKeyword.toLowerCase().replace(/\s/g, "");
    if (!keyword) return customers;

    return customers.filter(
      (c) =>
        (c.customerName || "")
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(keyword) ||
        (c.customerCode || "")
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(keyword) ||
        (c.phone || "").toLowerCase().replace(/\s/g, "").includes(keyword),
    );
  }, [customers, searchKeyword]);

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 font-lao mb-4 relative">
      {isDeleting && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-700 text-sm md:text-base">
              ກຳລັງລຶບຂໍ້ມູນ...
            </p>
          </div>
        </div>
      )}

      {/* --- Header --- */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center space-x-2">
          <Store className="w-5 h-5 text-orange-500" />{" "}
          <span>ລາຍຊື່ຮ້ານຄ້າທັງໝົດ</span>
          <button
            onClick={fetchCustomers}
            className="ml-2 p-1.5 md:p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw
              className={`w-4 h-4 md:w-5 md:h-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </h3>
        {user?.role === "admin" && (
          <button
            onClick={() => navigate("/location/add")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 md:space-x-2 transition shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> <span>ເພີ່ມຮ້ານໃໝ່</span>
          </button>
        )}
      </div>

      {/* --- Search Bar --- */}
      <div className="p-4 md:p-5 border-b border-gray-100 bg-white">
        <div className="w-full md:max-w-md flex items-center bg-gray-50 border border-gray-200 rounded-xl p-2.5 relative focus-within:ring-2 focus-within:ring-orange-500 transition">
          <Search className="text-gray-400 mr-2 shrink-0" size={20} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="ຄົ້ນຫາຊື່ຮ້ານ, ລະຫັດ ຫຼື ເບີໂທ..."
            className="flex-1 bg-transparent outline-none text-sm font-medium w-full"
            onChange={handleSearchChange}
          />
          {searchKeyword && (
            <button
              onClick={clearSearch}
              className="shrink-0 p-1 hover:bg-gray-200 rounded-full transition"
            >
              <X className="text-gray-400" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* --- Desktop Table View --- */}
      {isLoading && customers.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto p-2">
            <table className="w-full min-w-[1000px] text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs border-b border-gray-200 whitespace-nowrap">
                <tr>
                  <th className="px-4 py-4 text-center font-bold w-12">ລ/ດ</th>
                  <th className="px-4 py-4 font-bold w-px text-center">
                    ລະຫັດຮ້ານ
                  </th>
                  <th className="px-4 py-4 font-bold">ຊື່ຮ້ານຄ້າ</th>
                  <th className="px-4 py-4 font-bold w-px">ເບີໂທຕິດຕໍ່</th>
                  <th className="px-4 py-4 font-bold">ສະຖານທີ່</th>
                  <th className="px-4 py-4 font-bold">ພະນັກງານຂາຍ</th>
                  <th className="px-4 py-4 text-center font-bold w-20">
                    ແຜນທີ່
                  </th>
                  {user?.role === "admin" && (
                    <th className="px-4 py-4 text-center font-bold w-28">
                      ຈັດການ
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c, index) => (
                    <tr key={c.id} className="hover:bg-orange-50/50 transition">
                      <td className="px-4 py-4 text-center text-gray-400 font-medium whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 font-black text-orange-600 whitespace-nowrap w-px text-center">
                        {c.customerCode || "-"}
                      </td>
                      <td className="px-4 py-4 font-bold text-gray-800 text-base">
                        {c.customerName || "-"}
                      </td>
                      <td className="px-4 py-4 font-medium whitespace-nowrap">
                        {c.phone || "-"}
                      </td>
                      <td className="px-4 py-4 text-xs whitespace-normal max-w-[200px] leading-relaxed">
                        ບ.{c.village || "-"}, ມ.{c.district || "-"}, ຂ.
                        {c.province || "-"}
                      </td>
                      <td className="px-4 py-4 font-medium whitespace-nowrap">
                        <div>{c.salesperson || "-"}</div>
                        {c.salesPhone && (
                          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <Phone size={10} /> {c.salesPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {c.lat && c.lng ? (
                          /* --- ແກ້ໄຂລິ້ງ Google Maps ບ່ອນນີ້ --- */
                          <a
                            href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition"
                            title="ເປີດໃນ Google Maps"
                          >
                            <MapPin size={18} />
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      {user?.role === "admin" && (
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() =>
                                navigate("/location/edit", {
                                  state: { customer: c },
                                })
                              }
                              className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition shadow-sm"
                              title="ແກ້ໄຂ"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition shadow-sm"
                              title="ລຶບ"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={user?.role === "admin" ? 8 : 7}
                      className="text-center py-16 text-gray-400 font-medium"
                    >
                      ບໍ່ມີຂໍ້ມູນຮ້ານຄ້າທີ່ຄົ້ນຫາ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* --- Mobile Card View --- */}
          <div className="md:hidden flex flex-col gap-3 p-4 bg-gray-50/50">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c, index) => (
                <div
                  key={c.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>

                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h4 className="font-bold text-gray-800 text-base">
                        {c.customerName || "ບໍ່ລະບຸຊື່"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-1">
                        <Store size={12} /> ລະຫັດ:{" "}
                        <span className="text-orange-600 font-bold">
                          {c.customerCode || "-"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="pl-2 space-y-2">
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />{" "}
                      {c.phone || "-"}
                    </p>
                    <p className="text-xs text-gray-600 flex items-start gap-2">
                      <MapPin
                        size={14}
                        className="text-gray-400 mt-0.5 shrink-0"
                      />{" "}
                      <span className="leading-relaxed">
                        ບ.{c.village || "-"}, ມ.{c.district || "-"}, ຂ.
                        {c.province || "-"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 flex items-start gap-2">
                      <User
                        size={14}
                        className="text-gray-400 shrink-0 mt-0.5"
                      />
                      <span>
                        ຝ່າຍຂາຍ: {c.salesperson || "-"}
                        {c.salesPhone && (
                          <span className="text-gray-400 text-[11px] block mt-0.5">
                            ({c.salesPhone})
                          </span>
                        )}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100 pl-2">
                    <div>
                      {c.lat && c.lng ? (
                        /* --- ແກ້ໄຂລິ້ງ Google Maps ບ່ອນນີ້ (ສຳລັບມືຖື) --- */
                        <a
                          href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition"
                        >
                          <MapPin size={14} /> ນຳທາງ
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          ບໍ່ມີພິກັດ
                        </span>
                      )}
                    </div>

                    {user?.role === "admin" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate("/location/edit", {
                              state: { customer: c },
                            })
                          }
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm font-medium">
                ບໍ່ພົບຂໍ້ມູນທີ່ຄົ້ນຫາ
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
