// src/pages/store-location/MapView.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, RefreshCw, Plus, LocateFixed } from "lucide-react";
import { LOCATION_GAS_URL, GOOGLE_MAPS_API_KEY } from "../../api/config";
import { useAuth } from "../../contexts/AuthContext";

export default function MapView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef({});
  const infoWindowRef = useRef(null);
  const userMarkerRef = useRef(null);

  // --- ເພີ່ມ CSS ສຳລັບຫຍໍ້ຂະໜາດປຸ່ມເລືອກປະເພດແຜນທີ່ ---
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .gmnoprint.gm-style-mtc {
        transform: scale(0.85); /* ຫຍໍ້ຂະໜາດລົງ 15% */
        transform-origin: top left;
        margin-top: 5px !important;
        margin-left: 5px !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
          id: String(row.id || `temp-${index}`),
          customerCode: getVal(["ລະຫັດ", "ລະຫັດລູກຄ້າ"]),
          customerName: getVal(["ລາຍຊື່ລູກຄ້າ", "ຊື່ລູກຄ້າ"]),
          phone: getVal(["ເບີໂທ", "ເບີໂທຕິດຕໍ່"]),
          village: getVal(["ບ້ານ"]),
          district: getVal(["ເມືອງ"]),
          province: getVal(["ແຂວງ"]),
          lat: lat || getVal(["lat"]),
          lng: lng || getVal(["lng"]),
          salesperson: getVal(["ຝ່າຍຂາຍຮັບຜິດຊອບ", "ພະນັກງານຂາຍ"]),
        };
      });
      setCustomers(mapped);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (window.google && window.google.maps) setScriptLoaded(true);
    else {
      window.initGoogleMapForStore = () => setScriptLoaded(true);
      const scriptId = "google-maps-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=lo&region=LA&loading=async&callback=initGoogleMapForStore`;
        script.async = true;
        document.head.appendChild(script);
      }
    }
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (scriptLoaded && window.google && mapRef.current && !map) {
      const m = new window.google.maps.Map(mapRef.current, {
        center: { lat: 17.9757, lng: 102.6331 },
        zoom: 12,
        mapTypeId: "hybrid",
        gestureHandling: "greedy", // --- ແກ້ໄຂ: ອະນຸຍາດໃຫ້ໃຊ້ນິ້ວດຽວເລື່ອນແຜນທີ່ໄດ້ ---
        disableDefaultUI: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.LEFT_BOTTOM,
        },
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: window.google.maps.ControlPosition.TOP_LEFT,
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
      });
      setMap(m);
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }
  }, [scriptLoaded, mapRef, map]);

  const searchKeyword = String(search || "")
    .toLowerCase()
    .replace(/\s/g, "");
  const filteredCustomers = customers.filter(
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

  useEffect(() => {
    if (!map || !window.google) return;
    Object.values(markersRef.current).forEach((m) => m.setMap(null));
    markersRef.current = {};

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidPoints = false;

    filteredCustomers.forEach((c) => {
      const lat = parseFloat(c.lat);
      const lng = parseFloat(c.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        hasValidPoints = true;
        bounds.extend({ lat, lng });

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: c.customerName,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#f97316",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            scale: 10,
          },
        });

        marker.addListener("click", () => {
          const content = `
            <div style="width: auto; max-width: 300px; font-family: 'Noto Sans Lao', sans-serif;">
              <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; overflow-wrap: break-word;">${c.customerName}</h3>
              <div style="font-size: 13px; color: #475569; margin-bottom: 8px; line-height: 1.5;">
                <p style="margin: 2px 0;"><b>ລະຫັດ:</b> ${c.customerCode}</p>
                <p style="margin: 2px 0;"><b>ເບີໂທ:</b> ${c.phone}</p>
                <p style="margin: 2px 0;"><b>ສະຖານທີ່:</b> ບ.${c.village}, ມ.${c.district}, ຂ.${c.province}</p>
              </div>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" style="display: block; background: #f97316; color: white; text-align: center; padding: 8px 0; border-radius: 6px; text-decoration: none; font-weight: bold;">ນຳທາງ (Navigate)</a>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        });
        markersRef.current[c.id] = marker;
      }
    });

    if (hasValidPoints && filteredCustomers.length > 0) {
      map.fitBounds(bounds);
      window.google.maps.event.addListenerOnce(map, "idle", () => {
        if (map.getZoom() > 16) map.setZoom(16);
      });
    }
  }, [map, filteredCustomers]);

  const focusOnCustomer = (c) => {
    setSearch(c.customerName);
    setShowDropdown(false);
    if (map && markersRef.current[c.id]) {
      map.setCenter({ lat: parseFloat(c.lat), lng: parseFloat(c.lng) });
      map.setZoom(18);
      window.google.maps.event.trigger(markersRef.current[c.id], "click");
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          map.setCenter(coords);
          map.setZoom(15);
          if (userMarkerRef.current) userMarkerRef.current.setMap(null);
          userMarkerRef.current = new window.google.maps.Marker({
            position: coords,
            map,
            title: "ຕຳແໜ່ງຂອງທ່ານ",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
        },
        () => alert("ບໍ່ສາມາດດຶງທີ່ຢູ່ປັດຈຸບັນໄດ້. ກະລຸນາເປີດ GPS."),
      );
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative font-lao bg-white">
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      )}

      {/* ແຖບຄົ້ນຫາ */}
      <div className="p-3 border-b border-gray-100 flex gap-2 z-20 shadow-sm shrink-0 bg-white relative">
        <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl p-2.5 relative focus-within:ring-2 focus-within:ring-orange-500 transition">
          <Search className="text-gray-400 mr-2 shrink-0" size={20} />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ ຫຼື ລະຫັດ..."
            className="flex-1 bg-transparent outline-none text-sm font-medium w-full"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setShowDropdown(false);
              }}
              className="shrink-0"
            >
              <X className="text-gray-400" size={18} />
            </button>
          )}

          {/* Dropdown ຄົ້ນຫາ */}
          {showDropdown && search && filteredCustomers.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-30">
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => focusOnCustomer(c)}
                  className="p-3 border-b border-gray-50 hover:bg-orange-50 cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-sm text-gray-800">
                      {c.customerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      ບ.{c.village || "-"}, ມ.{c.district || "-"}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md">
                    {c.customerCode}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={fetchCustomers}
          className="p-3 bg-orange-50 rounded-xl border border-orange-100 text-orange-500 hover:bg-orange-100 transition shrink-0"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* ສ່ວນແຜນທີ່ */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={mapRef}
          className="w-full h-full bg-gray-200"
          onClick={() => setShowDropdown(false)}
        />

        {/* ປຸ່ມຈັດການ */}
        <div className="absolute bottom-[30px] right-[10px] flex flex-col items-center gap-3 z-10">
          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/location/add")}
              className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-orange-500 text-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:bg-orange-600 hover:scale-105 transition-all"
              title="ເພີ່ມຮ້ານຄ້າໃໝ່"
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
          )}

          <button
            onClick={handleLocateMe}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.3)] text-gray-600 hover:text-orange-500 transition-colors"
            title="ສະແດງຕຳແໜ່ງປັດຈຸບັນ"
          >
            <LocateFixed size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
