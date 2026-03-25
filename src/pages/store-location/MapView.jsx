// src/pages/store-location/MapView.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, RefreshCw, Plus, LocateFixed } from "lucide-react";
import { LOCATION_GAS_URL, GOOGLE_MAPS_API_KEY } from "../../api/config";
import { useAuth } from "../../contexts/AuthContext";
import { useAlert } from "../../contexts/AlertContext";

export default function MapView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ເອີ້ນໃຊ້ Alert ສຳລັບແຈ້ງເຕືອນ
  const alertContext = useAlert();
  const showAlert = alertContext?.showAlert || ((msg) => alert(msg));

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

  // --- 1. ສ້າງ Global Function ສຳລັບປຸ່ມ Copy ລິ້ງໃນແຜນທີ່ ---
  useEffect(() => {
    window.handleCopyMapLink = (link) => {
      navigator.clipboard.writeText(link).then(() => {
        showAlert("ກັອບປີ້ລິ້ງສຳເລັດແລ້ວ!", "success");
      });
    };
    // ລຶບ function ຖິ້ມເມື່ອປິດໜ້າຈໍ ເພື່ອບໍ່ໃຫ້ໜັກເຄື່ອງ
    return () => {
      delete window.handleCopyMapLink;
    };
  }, [showAlert]);

  // --- 2. ແກ້ໄຂ CSS ຂອງ Google Maps ເພື່ອລຶບຊ່ອງວ່າງດ້ານເທິງ ---
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .gmnoprint.gm-style-mtc {
        transform: scale(0.85);
        transform-origin: top left;
        margin-top: 5px !important;
        margin-left: 5px !important;
      }
      /* ບັງຄັບແກ້ໄຂຂອບ ແລະ ຊ່ອງວ່າງຂອງ Popup Google Maps */
      .gm-style-iw.gm-style-iw-c {
        padding: 14px 14px 10px 14px !important;
        border-radius: 12px !important;
      }
      .gm-style-iw-d {
        overflow: hidden !important;
      }
      /* ຍັບປຸ່ມ X (ປິດ) ໃຫ້ເຂົ້າຮູບ */
      .gm-style-iw-tc {
        display: none !important; /* ເຊື່ອງລູກສອນລຸ່ມ ຖ້າບໍ່ມັກ (ທາງເລືອກ) */
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
        gestureHandling: "greedy",
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

    // ໝຸດສີສົ້ມເງົາງາມ (Glossy) 24x36
    const storeIconSVG = {
      url:
        `data:image/svg+xml;charset=UTF-8,` +
        encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
          <defs>
            <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff9d33" />
              <stop offset="100%" stop-color="#d95d00" />
            </linearGradient>
            <radialGradient id="pinGlow" cx="30%" cy="30%" r="50%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="12" cy="34" rx="7" ry="2" fill="rgba(0,0,0,0.3)" />
          <path d="M12 1C5.9 1 1 5.9 1 12c0 8.4 11 23 11 23s11-14.6 11-23c0-6.1-4.9-11-11-11z" fill="url(#pinGrad)" stroke="#ffffff" stroke-width="1.5" />
          <path d="M12 1C5.9 1 1 5.9 1 12c0 8.4 11 23 11 23s11-14.6 11-23c0-6.1-4.9-11-11-11z" fill="url(#pinGlow)" />
          <circle cx="12" cy="12" r="3.5" fill="#ffffff" />
        </svg>
      `),
      scaledSize: new window.google.maps.Size(24, 36),
      anchor: new window.google.maps.Point(12, 36),
    };

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
          icon: storeIconSVG,
        });

        marker.addListener("click", () => {
          const gmapsLink = `https://maps.google.com/?q=${lat},${lng}`;

          // --- 3. ອັບເດດໂຄງສ້າງ HTML ໃຫ້ລົງແຖວ ແລະ ລຶບຊ່ອງວ່າງ ---
          const content = `
            <div style="width: 220px; font-family: 'Noto Sans Lao', sans-serif; white-space: normal;">
              <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; padding-right: 18px; line-height: 1.4; word-break: break-word;">
                ${c.customerName}
              </h3>
              
              <div style="font-size: 13px; color: #475569; margin-bottom: 12px; line-height: 1.5; word-break: break-word;">
                <p style="margin: 3px 0;"><b>ລະຫັດ:</b> ${c.customerCode}</p>
                <p style="margin: 3px 0;"><b>ເບີໂທ:</b> ${c.phone}</p>
                <p style="margin: 3px 0;"><b>ສະຖານທີ່:</b> ບ.${c.village}, ມ.${c.district}, ຂ.${c.province}</p>
              </div>
              
              <div style="display: flex; gap: 8px;">
                <a href="${gmapsLink}" target="_blank" style="flex: 1; display: flex; align-items: center; justify-content: center; background: #f97316; color: white; padding: 8px 0; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(249,115,22,0.3);">
                  ນຳທາງ
                </a>
                <button onclick="window.handleCopyMapLink('${gmapsLink}')" style="flex: 1; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 8px 0; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; transition: all 0.2s;">
                  ກັອບປີ້ລິ້ງ
                </button>
              </div>
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
        () =>
          showAlert("ບໍ່ສາມາດດຶງທີ່ຢູ່ປັດຈຸບັນໄດ້. ກະລຸນາເປີດ GPS.", "error"),
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
