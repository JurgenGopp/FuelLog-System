// src/components/location/LocationPicker.jsx
import React, { useRef, useState, useEffect } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from "../../api/config";

export default function LocationPicker({
  initialLat,
  initialLng,
  onConfirm,
  onCancel,
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // ໂຫຼດ Google Maps Script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setScriptLoaded(true);
    } else {
      window.initGoogleMapForPicker = () => setScriptLoaded(true);
      const scriptId = "google-maps-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=lo&region=LA&loading=async&callback=initGoogleMapForPicker`;
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, []);

  useEffect(() => {
    if (
      scriptLoaded &&
      window.google &&
      window.google.maps &&
      mapRef.current &&
      !map
    ) {
      const center = {
        lat: parseFloat(initialLat) || 17.9757,
        lng: parseFloat(initialLng) || 102.6331,
      };
      const m = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 16,
        mapTypeId: "hybrid",
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });
      setMap(m);

      if (!initialLat && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          m.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
      }
    }
  }, [scriptLoaded, mapRef, map, initialLat, initialLng]);

  const handleConfirm = () => {
    if (map) {
      const center = map.getCenter();
      onConfirm(center.lat(), center.lng());
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 animate-in slide-in-from-bottom-full duration-300 pb-[calc(env(safe-area-inset-bottom)+20px)]">
      <div className="flex justify-between items-center p-4 bg-white shadow-sm z-10">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-gray-800 font-lao">
          ເລື່ອນແຜນທີ່ເພື່ອປັກໝຸດ
        </h2>
        <div className="w-8"></div>
      </div>

      <div className="relative flex-1">
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-md pb-8">
          <MapPin size={40} className="text-orange-600 fill-orange-500" />
          <div className="w-3 h-1 bg-black/20 rounded-full mx-auto mt-1 blur-[1px]"></div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <button
          className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg font-lao active:scale-95 transition-transform"
          onClick={handleConfirm}
        >
          ຢືນຢັນພິກັດນີ້
        </button>
      </div>
    </div>
  );
}
