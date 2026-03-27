// src/pages/store-location/RoutePlanner.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  MapPin,
  Route,
  Plus,
  ChevronUp,
  ChevronDown,
  Wand2,
  Map as MapIcon,
  Eraser,
} from "lucide-react";
import { LOCATION_GAS_URL, GOOGLE_MAPS_API_KEY } from "../../api/config";
import { useAlert } from "../../contexts/AlertContext";

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const CustomerSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  const filteredOptions = options.filter(
    (opt) =>
      (opt.customerName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (opt.customerCode || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* ປັບຄວາມສູງໃຫ້ໃຫຍ່ຂຶ້ນອີກໜ້ອຍໜຶ່ງ (min-h-[44px]) */}
      <div
        className="w-full min-h-[44px] md:min-h-[48px] px-3 py-1.5 md:py-2 border border-gray-300 rounded-xl bg-white flex justify-between items-center cursor-pointer focus-within:ring-2 focus-within:ring-orange-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 truncate pr-2">
          {value ? (
            <div className="flex flex-col">
              {/* ປັບຕົວໜັງສືເປັນ text-sm */}
              <span
                className={`text-sm md:text-sm font-bold truncate ${value.id === "CURRENT_LOCATION" ? "text-blue-600" : "text-gray-800"}`}
              >
                {value.customerName}
              </span>
              <span className="text-[10px] md:text-[11px] text-gray-500 truncate">
                {value.id === "CURRENT_LOCATION"
                  ? `ສະຖານະ: ${value.village}`
                  : `ລະຫັດ: ${value.customerCode} | ${value.village}, ${value.district}`}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 font-medium">
              {placeholder}
            </span>
          )}
        </div>
        {value ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        ) : (
          <Search className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 bg-gray-50 shrink-0">
            <input
              autoFocus
              className="w-full text-sm outline-none py-1.5 px-2 bg-white border border-gray-200 rounded-lg"
              placeholder="ພິມຊື່ ຫຼື ລະຫັດຮ້ານ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-52 md:max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <div
                  key={opt.id || `search-opt-${idx}`}
                  className={`px-3 py-2.5 border-b border-gray-50 cursor-pointer transition ${opt.id === "CURRENT_LOCATION" ? "bg-blue-50/50 hover:bg-blue-100" : "hover:bg-orange-50"}`}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <div
                    className={`font-bold text-sm ${opt.id === "CURRENT_LOCATION" ? "text-blue-600" : "text-gray-800"}`}
                  >
                    {opt.customerName}
                  </div>
                  <div className="text-[11px] md:text-xs text-gray-500 flex justify-between">
                    <span>
                      {opt.id === "CURRENT_LOCATION"
                        ? opt.village
                        : `${opt.village}, ${opt.district}`}
                    </span>
                    <span
                      className={
                        opt.id === "CURRENT_LOCATION"
                          ? "text-blue-500 font-bold"
                          : "text-orange-600 font-bold"
                      }
                    >
                      {opt.customerCode}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-gray-400">
                ບໍ່ພົບຂໍ້ມູນ
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function RoutePlanner() {
  const alertContext = useAlert();
  const showAlert = alertContext?.showAlert || ((msg) => alert(msg));
  const showConfirm =
    alertContext?.showConfirm ||
    ((msg, onConfirm) => {
      if (window.confirm(msg)) onConfirm();
    });

  const [customers, setCustomers] = useState([]);
  const [waypoints, setWaypoints] = useState([null, null]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(LOCATION_GAS_URL);
        const json = await res.json();
        const mapped = (json.data || [])
          .map((row, index) => {
            const getVal = (keys) => {
              for (let k of keys) if (row[k]) return String(row[k]).trim();
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
              id: String(row.id || row["ລະຫັດລູກຄ້າ"] || `route-cust-${index}`),
              customerCode: getVal(["ລະຫັດ", "ລະຫັດລູກຄ້າ"]),
              customerName: getVal(["ລາຍຊື່ລູກຄ້າ", "ຊື່ລູກຄ້າ"]),
              village: getVal(["ບ້ານ"]),
              district: getVal(["ເມືອງ"]),
              province: getVal(["ແຂວງ"]),
              lat: lat || getVal(["lat"]),
              lng: lng || getVal(["lng"]),
            };
          })
          .filter((c) => c.lat && c.lng);
        setCustomers(mapped);
      } catch (err) {
        console.error("Fetch Error:", err);
      }
      setIsLoading(false);
    };

    fetchCustomers();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => console.log("GPS Denied or Unavailable"),
      );
    }

    if (window.google && window.google.maps) {
      setScriptLoaded(true);
    } else {
      window.initGoogleMapForRoute = () => setScriptLoaded(true);
      const scriptId = "google-maps-script-route";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=lo&region=LA&loading=async&callback=initGoogleMapForRoute`;
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && window.google && mapRef.current && !map) {
      const m = new window.google.maps.Map(mapRef.current, {
        center: { lat: 17.9757, lng: 102.6331 },
        zoom: 12,
        mapTypeId: "hybrid",
        disableDefaultUI: false,
        gestureHandling: "greedy",
      });
      const renderer = new window.google.maps.DirectionsRenderer({
        map: m,
        suppressMarkers: false,
      });
      setMap(m);
      setDirectionsRenderer(renderer);
    }
  }, [scriptLoaded, mapRef, map]);

  const optionsWithLocation = [
    {
      id: "CURRENT_LOCATION",
      customerName: "📍 ຕຳແໜ່ງປັດຈຸບັນ (My Location)",
      customerCode: "GPS",
      village: userLocation ? "ພ້ອມໃຊ້ງານ" : "ກົດເພື່ອດຶງຕຳແໜ່ງ...",
      district: "",
      lat: userLocation?.lat || "",
      lng: userLocation?.lng || "",
    },
    ...customers,
  ];

  const handleWaypointChange = (index, val) => {
    if (val && val.id === "CURRENT_LOCATION" && (!val.lat || !val.lng)) {
      showAlert("ກຳລັງດຶງຕຳແໜ່ງປັດຈຸບັນ, ກະລຸນາລໍຖ້າ...", "warning");

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setUserLocation(coords);
            const updatedVal = {
              ...val,
              lat: coords.lat,
              lng: coords.lng,
              village: "ພ້ອມໃຊ້ງານ",
            };

            const newWp = [...waypoints];
            newWp[index] = updatedVal;
            setWaypoints(newWp);

            showAlert("ດຶງຕຳແໜ່ງປັດຈຸບັນສຳເລັດ", "success");
          },
          () =>
            showAlert(
              "ບໍ່ສາມາດດຶງຕຳແໜ່ງໄດ້. ກະລຸນາເປີດ GPS ໃນອຸປະກອນ.",
              "error",
            ),
          { enableHighAccuracy: true },
        );
      } else {
        showAlert("ອຸປະກອນຂອງທ່ານບໍ່ຮອງຮັບ GPS", "error");
      }
      return;
    }

    const newWp = [...waypoints];
    newWp[index] = val;
    setWaypoints(newWp);
  };

  const addWaypoint = () => setWaypoints([...waypoints, null]);
  const removeWaypoint = (index) => {
    const newWp = waypoints.filter((_, i) => i !== index);
    if (newWp.length < 2) newWp.push(null);
    setWaypoints(newWp);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newWp = [...waypoints];
    [newWp[index - 1], newWp[index]] = [newWp[index], newWp[index - 1]];
    setWaypoints(newWp);
  };

  const moveDown = (index) => {
    if (index === waypoints.length - 1) return;
    const newWp = [...waypoints];
    [newWp[index + 1], newWp[index]] = [newWp[index], newWp[index + 1]];
    setWaypoints(newWp);
  };

  const handleClearAll = () => {
    const hasData = waypoints.some((wp) => wp !== null);
    if (!hasData) return;

    showConfirm("ທ່ານຕ້ອງການລ້າງລາຍຊື່ຮ້ານຄ້າທັງໝົດແທ້ບໍ່?", () => {
      setWaypoints([null, null]);
      if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
      }
      showAlert("ລ້າງລາຍຊື່ສຳເລັດ", "success");
    });
  };

  const handleAutoSort = () => {
    const validWps = waypoints.filter((wp) => wp !== null);
    if (validWps.length < 2)
      return showAlert("ກະລຸນາເລືອກຢ່າງໜ້ອຍ 2 ຈຸດກ່ອນຈັດລຽງ", "warning");

    let sorted = [];
    let remaining = [...validWps];
    let currentPoint = userLocation || {
      lat: parseFloat(remaining[0].lat),
      lng: parseFloat(remaining[0].lng),
    };

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        let dist = getDistance(
          currentPoint.lat,
          currentPoint.lng,
          parseFloat(remaining[i].lat),
          parseFloat(remaining[i].lng),
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      let nearest = remaining.splice(nearestIdx, 1)[0];
      sorted.push(nearest);
      currentPoint = {
        lat: parseFloat(nearest.lat),
        lng: parseFloat(nearest.lng),
      };
    }

    while (sorted.length < waypoints.length) sorted.push(null);
    setWaypoints(sorted);
    showAlert("ຈັດລຽງເສັ້ນທາງສຳເລັດ", "success");
  };

  const handleCalculateRoute = () => {
    const validWps = waypoints.filter((wp) => wp !== null);
    if (validWps.length < 2)
      return showAlert("ກະລຸນາເລືອກຢ່າງໜ້ອຍ 2 ຈຸດ", "warning");

    const directionsService = new window.google.maps.DirectionsService();
    const origin = {
      lat: parseFloat(validWps[0].lat),
      lng: parseFloat(validWps[0].lng),
    };
    const destination = {
      lat: parseFloat(validWps[validWps.length - 1].lat),
      lng: parseFloat(validWps[validWps.length - 1].lng),
    };

    const waypts = validWps.slice(1, -1).map((wp) => ({
      location: { lat: parseFloat(wp.lat), lng: parseFloat(wp.lng) },
      stopover: true,
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints: waypts,
        travelMode: "DRIVING",
      },
      (response, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(response);
        } else {
          showAlert("ບໍ່ສາມາດຄຳນວນເສັ້ນທາງໄດ້. ລອງໃໝ່ອີກຄັ້ງ.", "error");
        }
      },
    );
  };

  const handleOpenGoogleMaps = () => {
    const validWps = waypoints.filter((wp) => wp !== null && wp.lat && wp.lng);
    if (validWps.length < 2) {
      return showAlert("ກະລຸນາເລືອກຢ່າງໜ້ອຍ 2 ຈຸດ ທີ່ມີພິກັດ", "warning");
    }

    const origin = `${validWps[0].lat},${validWps[0].lng}`;
    const destination = `${validWps[validWps.length - 1].lat},${validWps[validWps.length - 1].lng}`;

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;

    if (validWps.length > 2) {
      const waypts = validWps
        .slice(1, -1)
        .map((wp) => `${wp.lat},${wp.lng}`)
        .join("|");
      url += `&waypoints=${waypts}`;
    }

    window.open(url, "_blank");
  };

  return (
    // ປັບຄວາມສູງເປັນ h-[calc(100dvh-130px)] ເພື່ອໃຫ້ກ່ອງສັ້ນລົງ ແລະ ປຸ່ມລຸ່ມສະແດງສະເໝີ
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-130px)] lg:h-[calc(100vh-120px)] gap-3 md:gap-4 font-lao mb-4">
      {/* ດ້ານຊ້າຍ: ກ່ອງຈັດການເສັ້ນທາງ */}
      <div className="w-full lg:w-[400px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-[15px] md:text-lg">
            <Route className="text-orange-500 w-5 h-5" /> ຄົ້ນຫາເສັ້ນທາງ
          </h2>
          <div className="flex gap-1.5 md:gap-2">
            <button
              onClick={handleClearAll}
              className="text-[11px] md:text-xs bg-red-50 text-red-600 font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition flex items-center gap-1"
            >
              <Eraser className="w-3.5 h-3.5" /> ລ້າງ
            </button>
            <button
              onClick={handleAutoSort}
              className="text-[11px] md:text-xs bg-orange-100 text-orange-600 font-bold px-2.5 py-1.5 rounded-lg hover:bg-orange-200 transition flex items-center gap-1"
            >
              <Wand2 className="w-3.5 h-3.5" /> ຈັດລຽງເສັ້ນທາງ
            </button>
          </div>
        </div>

        {/* ລາຍການ (ສ່ວນທີ່ສາມາດ Scroll ໄດ້) */}
        <div className="flex-1 overflow-y-auto p-2.5 md:p-4 space-y-2 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex justify-center pt-10">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
          )}

          {waypoints.map((wp, index) => (
            <div
              key={`wp-${index}`}
              className="flex items-center gap-2 bg-gray-50 p-1.5 md:p-2 rounded-xl border border-gray-200 relative group"
            >
              <div className="flex flex-col gap-1 items-center px-1">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-orange-500 disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === waypoints.length - 1}
                  className="text-gray-400 hover:text-orange-500 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <CustomerSelect
                  value={wp}
                  onChange={(val) => handleWaypointChange(index, val)}
                  options={optionsWithLocation}
                  placeholder={
                    index === 0 ? "ເລືອກຈຸດເລີ່ມຕົ້ນ..." : "ເລືອກຈຸດປາຍທາງ..."
                  }
                />
              </div>
              <button
                onClick={() => removeWaypoint(index)}
                className="p-1.5 md:p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          ))}

          <button
            onClick={addWaypoint}
            className="w-full py-2.5 md:py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold flex items-center justify-center gap-2 text-sm hover:bg-gray-50 hover:text-orange-500 hover:border-orange-300 transition mt-1"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" /> ເພີ່ມຈຸດປາຍທາງ
          </button>
        </div>

        {/* Footer (ປຸ່ມກົດ) ທີ່ຕິດຢູ່ລຸ່ມສະເໝີ */}
        {/* ຫຼຸດ Padding ໃຫ້ປະຢັດພື້ນທີ່ */}
        <div className="p-2.5 md:p-4 border-t border-gray-100 bg-white space-y-2 md:space-y-3 shrink-0">
          <button
            onClick={handleCalculateRoute}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 md:py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition active:scale-95"
          >
            <MapIcon className="w-4 h-4 md:w-5 md:h-5" /> ສະແດງໃນແຜນທີ່
          </button>
          <button
            onClick={handleOpenGoogleMaps}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 md:py-3.5 rounded-xl shadow-md shadow-orange-200 flex items-center justify-center gap-2 text-sm transition active:scale-95"
          >
            <MapPin className="w-4 h-4 md:w-5 md:h-5" /> ເປີດນຳທາງໃນ Google Maps
          </button>
        </div>
      </div>

      {/* ດ້ານຂວາ: ແຜນທີ່ Preview */}
      <div className="hidden lg:flex flex-1 bg-gray-200 rounded-2xl overflow-hidden border border-gray-200 relative">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
}
