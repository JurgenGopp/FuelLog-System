// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// ໂຫຼດ Layouts
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";

// ໂຫຼດ Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FuelList from "./pages/FuelList";
import FuelFormPage from "./pages/FuelFormPage";
import FuelReport from "./pages/FuelReport";
import UserManagement from "./pages/UserManagement";

// ໂຫຼດ Pages (ສະຖານທີ່ຮ້ານຄ້າ)
import MapView from "./pages/store-location/MapView";
import ListView from "./pages/store-location/ListView";
import FormView from "./pages/store-location/FormView";

/**
 * Component ສຳລັບປ້ອງກັນ Route
 * - ຖ້າຍັງບໍ່ Login ໃຫ້ເຕະໄປໜ້າ /login
 * - ຖ້າ Login ແລ້ວແຕ່ບໍ່ມີສິດເຂົ້າໜ້ານັ້ນ ໃຫ້ເຕະໄປໜ້າ /dashboard
 */
const ProtectedRoute = ({ children, requiredMenu }) => {
  const { user, hasAccess } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredMenu && !hasAccess(requiredMenu)) {
    alert("ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* --- ເສັ້ນທາງສຳລັບໜ້າທີ່ບໍ່ຕອ້ງ Login (Auth Layout) --- */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* --- ເສັ້ນທາງສຳລັບລະບົບຫຼັງບ້ານ (Main Layout) --- */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* ເມື່ອເຂົ້າໜ້າເວັບຫຼັກ / ໃຫ້ Redirect ໄປຫາ Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredMenu="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/fuel/history"
              element={
                <ProtectedRoute requiredMenu="list">
                  <FuelList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fuel/add"
              element={
                <ProtectedRoute requiredMenu="form">
                  <FuelFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fuel/edit/:id"
              element={
                <ProtectedRoute requiredMenu="form">
                  <FuelFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fuel/report"
              element={
                <ProtectedRoute requiredMenu="report">
                  <FuelReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute requiredMenu="users">
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            {/* --- ກຸ່ມສະຖານທີ່ຮ້ານຄ້າ --- */}
            <Route
              path="/location/map"
              element={
                <ProtectedRoute requiredMenu="locationMap">
                  <MapView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/location/list"
              element={
                <ProtectedRoute requiredMenu="locationList">
                  <ListView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/location/add"
              element={
                <ProtectedRoute requiredMenu="locationForm">
                  <FormView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/location/edit"
              element={
                <ProtectedRoute requiredMenu="locationForm">
                  <FormView />
                </ProtectedRoute>
              }
            />

            {/* ຖ້າພິມ URL ມົ້ວ ໃຫ້ກັບໄປໜ້າ Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
