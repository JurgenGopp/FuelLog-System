// src/pages/UserManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { callApi } from "../api/config";
import { useAuth } from "../contexts/AuthContext";
import { generateUserId } from "../utils/helpers";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [allCars, setAllCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const initialForm = {
    username: "",
    password: "",
    name: "",
    role: "user",
    assignedCars: [],
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setIsLoading(true);
    const res = await callApi({ action: "getData" });
    if (res.success) {
      setUsers(res.users || []);
      setAllCars(res.cars || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCarToggle = (car) => {
    setFormData((prev) => {
      const assigned = prev.assignedCars.includes(car)
        ? prev.assignedCars.filter((c) => c !== car)
        : [...prev.assignedCars, car];
      return { ...prev, assignedCars: assigned };
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const isEdit = !!editingUser;
    const finalId = isEdit ? editingUser.id : generateUserId(users);
    const finalUserData = { ...formData, id: finalId };

    const res = await callApi({
      action: isEdit ? "editUser" : "addUser",
      data: finalUserData,
    });

    if (res.success !== false) {
      alert(isEdit ? "ແກ້ໄຂຜູ້ໃຊ້ງານສຳເລັດ" : "ເພີ່ມຜູ້ໃຊ້ງານສຳເລັດ");
      setIsFormOpen(false);
      loadData();
    } else {
      alert("ບັນທຶກບໍ່ສຳເລັດ: " + res.message);
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser?.id) {
      alert("ທ່ານບໍ່ສາມາດລຶບບັນຊີທີ່ກຳລັງໃຊ້ງານຢູ່ໄດ້");
      return;
    }
    if (window.confirm("ຕ້ອງການລຶບຜູ້ໃຊ້ງານນີ້ແທ້ບໍ່?")) {
      setIsLoading(true);
      const res = await callApi({ action: "deleteUser", id });
      if (res.success !== false) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        alert("ລຶບບໍ່ສຳເລັດ: " + res.message);
      }
      setIsLoading(false);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({ ...user, password: user.password || "" }); // Password ອາດຈະຖືກເຊື່ອງໄວ້ໃນ API ໂຕຈິງ, ແຕ່ນີ້ໃຊ້ແບບ basic
    setIsFormOpen(true);
  };

  if (isLoading && users.length === 0)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-base md:text-lg font-bold text-gray-800 font-lao flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-orange-500" />{" "}
          <span>ການຈັດການຜູ້ໃຊ້ງານ</span>
          <button
            onClick={loadData}
            className="ml-2 p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
            title="ໂຫຼດໃໝ່"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </h3>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData(initialForm);
            setIsFormOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center space-x-1 transition shadow-md"
        >
          <Plus className="w-4 h-4" /> <span>ເພີ່ມຜູ້ໃຊ້</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="p-4 md:p-6 bg-orange-50/30 border-b border-gray-100">
          <form onSubmit={handleSaveUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">
                  ຊື່-ນາມສະກຸນ
                </label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-[40px] px-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">
                  ຊື່ເຂົ້າລະບົບ (Username)
                </label>
                <input
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full h-[40px] px-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">
                  ລະຫັດຜ່ານ
                </label>
                <input
                  required
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-[40px] px-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">
                  ສິດການໃຊ້ງານ (Role)
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full h-[40px] px-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="admin">Admin (ຜູ້ດູແລລະບົບ)</option>
                  <option value="user">User (ພະນັກງານທຳມະດາ)</option>
                  <option value="driver">Driver (ພະນັກງານຂັບລົດ)</option>
                </select>
              </div>
            </div>

            {formData.role !== "admin" && (
              <div className="mt-4">
                <label className="block text-sm font-bold mb-2">
                  ທະບຽນລົດທີ່ຮັບຜິດຊອບ:
                </label>
                <div className="flex flex-wrap gap-2">
                  {allCars.map((car) => (
                    <label
                      key={car}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition ${formData.assignedCars.includes(car) ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.assignedCars.includes(car)}
                        onChange={() => handleCarToggle(car)}
                      />
                      {car}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition shadow-md"
              >
                {isLoading ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກຜູ້ໃຊ້"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-700 text-xs border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-center">ລ/ດ</th>
              <th className="px-6 py-3">ຊື່-ນາມສະກຸນ</th>
              <th className="px-6 py-3">Username</th>
              <th className="px-6 py-3 text-center">Role</th>
              <th className="px-6 py-3">ລົດທີ່ຮັບຜິດຊອບ</th>
              <th className="px-6 py-3 text-center">ຈັດການ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u, idx) => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-center text-gray-400">
                  {idx + 1}
                </td>
                <td className="px-6 py-3 font-bold text-gray-800">{u.name}</td>
                <td className="px-6 py-3">{u.username}</td>
                <td className="px-6 py-3 text-center">
                  <span
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase ${u.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-3 text-xs">
                  {u.role === "admin" ? (
                    <span className="text-gray-400 italic">ທຸກຄັນ</span>
                  ) : u.assignedCars?.length ? (
                    u.assignedCars.join(", ")
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
