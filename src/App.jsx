// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AlertProvider } from "./contexts/AlertContext";

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
import MapView from "./pages/store-location/MapView";
import ListView from "./pages/store-location/ListView";
import FormView from "./pages/store-location/FormView";
import RoutePlanner from "./pages/store-location/RoutePlanner";

/**
 * Component ສຳລັບປ້ອງກັນ Route
 */
const ProtectedRoute = ({ children, requiredMenu }) => {
  const { user, hasAccess } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredMenu && !hasAccess(requiredMenu)) {
    alert("ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້");
    // --- ແກ້ໄຂ: ຖ້າເປັນ Driver ໃຫ້ເຕະກັບໄປໜ້າ Form, ຖ້າເປັນສື່ອື່ນເຕະໄປ Dashboard ---
    return (
      <Navigate
        to={user.role === "driver" ? "/fuel/add" : "/dashboard"}
        replace
      />
    );
  }

  return children;
};

/**
 * Component ສຳລັບການຈັດການໜ້າທຳອິດ (ເວລາມີຄົນເຂົ້າເວັບໂດຍບໍ່ລະບຸ Path /)
 */
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // ຖ້າເປັນ Driver ໃຫ້ໄປໜ້າ /fuel/add, ຖ້າບໍ່ແມ່ນໄປໜ້າ /dashboard
  return (
    <Navigate
      to={user.role === "driver" ? "/fuel/add" : "/dashboard"}
      replace
    />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* --- ແກ້ໄຂ: ໃຊ້ RootRedirect ແທນການ Redirect ໄປ Dashboard ຕາຍຕົວ --- */}
              <Route path="/" element={<RootRedirect />} />

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
              <Route
                path="/location/route"
                element={
                  <ProtectedRoute requiredMenu="locationRoute">
                    <RoutePlanner />
                  </ProtectedRoute>
                }
              />

              {/* ຖ້າພິມ URL ມົ້ວ ໃຫ້ໃຊ້ RootRedirect */}
              <Route path="*" element={<RootRedirect />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  );
}
