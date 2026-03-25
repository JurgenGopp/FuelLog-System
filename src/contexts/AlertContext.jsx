// src/contexts/AlertContext.jsx
import React, { createContext, useState, useContext } from "react";
import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: "",
    onConfirm: null,
    type: "delete",
  });

  // ຟັງຊັ໋ນສຳລັບສະແດງແຈ້ງເຕືອນ (ສຳເລັດ ຫຼື ຜິດພາດ)
  const showAlert = (message, type = "success") => {
    setToast({ show: true, message, type });
    // ປິດອັດຕະໂນມັດຫຼັງຈາກ 3 ວິນາທີ
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  // ຟັງຊັ໋ນສຳລັບສະແດງປັອບອັບຢືນຢັນ (ເຊັ່ນ: ຢືນຢັນການລຶບ)
  const showConfirm = (message, onConfirm, type = "delete") => {
    setConfirmDialog({ show: true, message, onConfirm, type });
  };

  const closeConfirm = () => {
    setConfirmDialog({
      show: false,
      message: "",
      onConfirm: null,
      type: "delete",
    });
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* --- UI ສຳລັບ Toast (ແຈ້ງເຕືອນມູມຂວາເທິງ) --- */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-[9999] px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl flex items-center space-x-3 transform transition-all duration-300 animate-in slide-in-from-top-10 fade-in font-lao ${toast.type === "success" ? "bg-white border-l-4 border-green-500" : "bg-white border-l-4 border-red-500"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
          )}
          <div>
            <p className="text-sm md:text-base font-bold text-gray-800">
              {toast.type === "success" ? "ສຳເລັດ!" : "ແຈ້ງເຕືອນ!"}
            </p>
            <p className="text-xs md:text-sm text-gray-600">{toast.message}</p>
          </div>
        </div>
      )}

      {/* --- UI ສຳລັບ Confirm Dialog (ປັອບອັບຢືນຢັນເຄິ່ງກາງຈໍ) --- */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[9999] flex items-center justify-center backdrop-blur-sm px-4 animate-in fade-in font-lao">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 md:p-6 text-center space-y-3 md:space-y-4">
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 ${confirmDialog.type === "warning" ? "bg-orange-100 text-orange-500" : "bg-red-100 text-red-500"}`}
              >
                <AlertTriangle className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800">
                {confirmDialog.type === "warning"
                  ? "ແຈ້ງເຕືອນ"
                  : "ຢືນຢັນການລຶບ?"}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex border-t border-gray-100 text-sm md:text-base">
              <button
                onClick={closeConfirm}
                className="flex-1 px-4 py-3 md:py-4 text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  closeConfirm();
                }}
                className={`flex-1 px-4 py-3 md:py-4 font-bold transition ${confirmDialog.type === "warning" ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
              >
                ຕົກລົງ
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

// Hook ສຳລັບເອີ້ນໃຊ້
export const useAlert = () => useContext(AlertContext);
