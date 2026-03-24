// src/pages/UserManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Car,
  User,
  CheckSquare,
  XSquare,
  Search,
  X,
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

  // --- ເພີ່ມ State ສຳລັບການຄົ້ນຫາ ---
  const [search, setSearch] = useState("");

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

  const handleSelectAllCars = () => {
    setFormData((prev) => {
      const isAllSelected = prev.assignedCars.length === allCars.length;
      return { ...prev, assignedCars: isAllSelected ? [] : [...allCars] };
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
    setFormData({ ...user, password: user.password || "" });
    setIsFormOpen(true);
  };

  // --- ຟັງຊັ໋ນສຳລັບກັ່ນຕອງຜູ້ໃຊ້ງານຕາມການຄົ້ນຫາ ---
  const searchKeyword = search.toLowerCase().replace(/\s/g, "");
  const filteredUsers = users.filter(
    (u) =>
      (u.name || "").toLowerCase().replace(/\s/g, "").includes(searchKeyword) ||
      (u.username || "")
        .toLowerCase()
        .replace(/\s/g, "")
        .includes(searchKeyword),
  );

  if (isLoading && users.length === 0)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 mb-4 font-lao">
      {/* --- ແຖບ Header --- */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-orange-500" />{" "}
          <span>ການຈັດການຜູ້ໃຊ້ງານ</span>
          <button
            onClick={loadData}
            className="ml-2 p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
            title="ໂຫຼດໃໝ່"
          >
            <RefreshCw className="w-4 h-4 md:w-5 h-5" />
          </button>
        </h3>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData(initialForm);
            setIsFormOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold flex items-center space-x-1.5 transition shadow-md"
        >
          <Plus className="w-4 h-4" /> <span>ເພີ່ມຜູ້ໃຊ້</span>
        </button>
      </div>

      {/* --- ແຖບຄົ້ນຫາ --- */}
      {!isFormOpen && (
        <div className="p-4 md:p-5 border-b border-gray-100 bg-white">
          <div className="w-full md:max-w-md flex items-center bg-gray-50 border border-gray-200 rounded-xl p-2.5 relative focus-within:ring-2 focus-within:ring-orange-500 transition">
            <Search className="text-gray-400 mr-2 shrink-0" size={20} />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຊື່ ຫຼື Username..."
              className="flex-1 bg-transparent outline-none text-sm font-medium w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="shrink-0 p-1 hover:bg-gray-200 rounded-full transition"
              >
                <X className="text-gray-400" size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- ຟອມເພີ່ມ/ແກ້ໄຂຜູ້ໃຊ້ --- */}
      {isFormOpen && (
        <div className="p-4 md:p-6 bg-orange-50/30 border-b border-orange-100 animate-in fade-in zoom-in-95 duration-200">
          <form
            onSubmit={handleSaveUser}
            className="space-y-4 md:space-y-5 max-w-4xl mx-auto"
          >
            <div className="flex items-center space-x-2 mb-2 md:mb-4">
              <User className="text-orange-500 w-5 h-5" />
              <h4 className="font-bold text-gray-800 text-base md:text-lg">
                {editingUser ? "ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້" : "ເພີ່ມຜູ້ໃຊ້ງານໃໝ່"}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-xs md:text-sm font-bold mb-1.5 text-gray-700">
                  ຊື່-ນາມສະກຸນ *
                </label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                  placeholder="ປ້ອນຊື່ເຕັມ"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold mb-1.5 text-gray-700">
                  ຊື່ເຂົ້າລະບົບ (Username) *
                </label>
                <input
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                  placeholder="ex: admin_pp"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold mb-1.5 text-gray-700">
                  ລະຫັດຜ່ານ *
                </label>
                <input
                  required
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                  placeholder="ປ້ອນລະຫັດຜ່ານ"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold mb-1.5 text-gray-700">
                  ສິດການໃຊ້ງານ (Role)
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full h-[48px] px-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 bg-white transition text-sm font-medium text-gray-700"
                >
                  <option value="admin">Admin (ຜູ້ດູແລລະບົບ)</option>
                  <option value="user">User (ພະນັກງານທຳມະດາ)</option>
                  <option value="driver">Driver (ພະນັກງານຂັບລົດ)</option>
                </select>
              </div>
            </div>

            {formData.role !== "admin" && (
              <div className="mt-4 bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-3">
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Car size={18} className="text-gray-500" />{" "}
                    ທະບຽນລົດທີ່ຮັບຜິດຊອບ:
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllCars}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition border border-gray-200 shadow-sm active:scale-95 bg-gray-50 hover:bg-gray-100 text-gray-700 w-full md:w-auto"
                  >
                    {formData.assignedCars.length === allCars.length ? (
                      <>
                        <XSquare size={16} className="text-red-500" />{" "}
                        ຍົກເລີກທັງໝົດ
                      </>
                    ) : (
                      <>
                        <CheckSquare size={16} className="text-green-500" />{" "}
                        ເລືອກທັງໝົດ
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {allCars.map((car) => (
                    <label
                      key={car}
                      className={`px-4 py-2.5 md:px-5 md:py-3 rounded-xl text-xs md:text-sm font-bold border cursor-pointer transition select-none flex items-center gap-2 ${formData.assignedCars.includes(car) ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"}`}
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

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-3 text-sm md:text-base bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 text-sm md:text-base bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-md active:scale-95"
              >
                {isLoading ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກຜູ້ໃຊ້"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ສະແດງຜົນໃນຈໍ Desktop (Table) --- */}
      <div className="hidden md:block overflow-x-auto p-2">
        {/* ກຳນົດ min-w-[900px] ເພື່ອໃຫ້ຕາຕະລາງກວ້າງຂຶ້ນ ແລະ ຍືດອອກ */}
        <table className="w-full min-w-[900px] text-left text-sm text-gray-600 whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-700 text-xs border-b border-gray-200 uppercase">
            <tr>
              <th className="px-6 py-4 text-center w-16">ລ/ດ</th>
              <th className="px-8 py-4 font-bold">ຊື່-ນາມສະກຸນ</th>
              <th className="px-8 py-4 font-bold">Username</th>
              <th className="px-8 py-4 text-center font-bold">Role</th>
              <th className="px-8 py-4 font-bold">ລົດທີ່ຮັບຜິດຊອບ</th>
              <th className="px-6 py-4 text-center font-bold w-32">ຈັດການ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u, idx) => (
                <tr key={u.id} className="hover:bg-orange-50/50 transition">
                  <td className="px-6 py-5 text-center text-gray-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="px-8 py-5 font-bold text-gray-800 text-base">
                    {u.name}
                  </td>
                  <td className="px-8 py-5 font-medium">{u.username}</td>
                  <td className="px-8 py-5 text-center">
                    <span
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wider ${u.role === "admin" ? "bg-purple-100 text-purple-600" : u.role === "driver" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xs whitespace-normal max-w-[300px] leading-relaxed">
                    {u.role === "admin" ? (
                      <span className="text-gray-400 italic font-medium">
                        ເຂົ້າເຖິງທຸກຄັນ (Admin)
                      </span>
                    ) : (
                      <span className="font-medium text-gray-600">
                        {u.assignedCars?.length ? (
                          u.assignedCars.join(", ")
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-16 text-gray-400 font-medium"
                >
                  ບໍ່ພົບຜູ້ໃຊ້ງານທີ່ຄົ້ນຫາ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- ສະແດງຜົນໃນຈໍ Mobile (Card Layout) --- */}
      <div className="md:hidden flex flex-col gap-3 p-4 bg-gray-50/50">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((u, idx) => (
            <div
              key={u.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 w-1.5 h-full ${u.role === "admin" ? "bg-purple-400" : u.role === "driver" ? "bg-green-400" : "bg-blue-400"}`}
              ></div>

              <div className="flex justify-between items-start pl-2">
                <div>
                  <h4 className="font-bold text-gray-800 text-base">
                    {u.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">@{u.username}</p>
                </div>
                <span
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider shrink-0 ${u.role === "admin" ? "bg-purple-100 text-purple-600" : u.role === "driver" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                >
                  {u.role}
                </span>
              </div>

              <div className="pl-2">
                <p className="text-[10px] text-gray-400 font-bold mb-1.5 flex items-center gap-1">
                  <Car size={12} /> ທະບຽນລົດ:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {u.role === "admin" ? (
                    <span className="text-xs text-purple-500 font-medium bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                      ເຂົ້າເຖິງທຸກຄັນ (Admin)
                    </span>
                  ) : u.assignedCars?.length ? (
                    u.assignedCars.map((car) => (
                      <span
                        key={car}
                        className="text-[10px] font-bold bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-200"
                      >
                        {car}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">- ບໍ່ມີ -</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-gray-100 pl-2">
                <button
                  onClick={() => openEdit(u)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition"
                >
                  <Edit size={14} /> ແກ້ໄຂ
                </button>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition"
                >
                  <Trash2 size={14} /> ລຶບ
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm font-medium">
            ບໍ່ພົບຜູ້ໃຊ້ງານທີ່ຄົ້ນຫາ
          </div>
        )}
      </div>
    </div>
  );
}
