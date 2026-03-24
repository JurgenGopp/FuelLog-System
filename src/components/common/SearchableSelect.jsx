// src/components/common/SearchableSelect.jsx
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  showAllOption = false,
  labelClassName = "block text-xs md:text-sm font-bold text-gray-700 mb-1",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  const filteredOptions = (options || []).filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full min-w-0" ref={containerRef}>
      {label && <label className={labelClassName}>{label}</label>}
      <div
        className="w-full min-w-0 h-[40px] md:h-[48px] px-3 md:px-4 border border-gray-300 rounded-lg md:rounded-xl bg-gray-50 hover:bg-white flex justify-between items-center cursor-pointer focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition text-sm md:text-base box-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={
            value
              ? "text-gray-800 font-bold truncate"
              : "text-gray-400 font-medium truncate"
          }
        >
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 md:w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 md:mt-2 bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2.5 md:p-3 border-b border-gray-100 flex items-center space-x-2 md:space-x-3 bg-gray-50">
            <Search className="w-4 h-4 md:w-5 h-5 text-gray-400 shrink-0" />
            <input
              autoFocus
              className="w-full text-xs md:text-sm outline-none py-1 bg-transparent font-bold"
              placeholder="ພິມເພື່ອຄົ້ນຫາ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {showAllOption && (
              <div
                className={`px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm cursor-pointer transition border-b border-gray-50 ${!value ? "bg-orange-50 text-orange-600 font-bold" : "text-gray-700 hover:bg-gray-50 hover:text-orange-500 font-bold"}`}
                onClick={() => handleSelect("")}
              >
                -- ທັງໝົດ --
              </div>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  className={`px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm cursor-pointer transition border-b border-gray-50 last:border-0 ${value === opt ? "bg-orange-50 text-orange-600 font-bold" : "text-gray-700 hover:bg-gray-50 hover:text-orange-500 font-bold"}`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-4 md:px-5 py-4 md:py-6 text-center text-gray-400 text-xs md:text-sm font-medium">
                ບໍ່ພົບທະບຽນລົດ
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
