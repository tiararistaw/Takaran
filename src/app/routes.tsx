
import { createBrowserRouter, Navigate } from "react-router";
import Root, { AdminLayout, OwnerLayout } from "./layout";

import Login from "./auth/login";
import Register from "./auth/register";
import ProtectedRoute from "./auth/ProtectedRoute";

import {
  AdminDashboard,
  CategoriesAdmin,
  Dashboard,
  EmissionsAdmin,
  Impact,
  MenuManagement,
  NotFound,
  Production,
  Recommendations,
  Reports,
  SettingsPage,
} from "./pages";

export const router = createBrowserRouter([
  {
    Component: Root,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },

      // Halaman autentikasi
      {
        path: "login",
        Component: Login,
      },
      {
        path: "register",
        Component: Register,
      },

      // Halaman khusus Pemilik Usaha
      {
        element: <ProtectedRoute allowedRoles={["pemilik"]} />,
        children: [
          {
            Component: OwnerLayout,
            children: [
              { path: "dashboard", Component: Dashboard },
              { path: "menu", Component: MenuManagement },
              { path: "produksi", Component: Production },
              { path: "rekomendasi", Component: Recommendations },
              { path: "laporan", Component: Reports },
              { path: "dampak", Component: Impact },
              { path: "pengaturan", Component: SettingsPage },
            ],
          },
        ],
      },

      // Halaman khusus Administrator
      {
        path: "admin",
        element: <ProtectedRoute allowedRoles={["admin"]} />,
        children: [
          {
            Component: AdminLayout,
            children: [
              { index: true, Component: AdminDashboard },
              { path: "kategori", Component: CategoriesAdmin },
              { path: "emisi", Component: EmissionsAdmin },
            ],
          },
        ],
      },

      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
