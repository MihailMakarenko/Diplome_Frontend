import "./App.css";

import Login from "./pages/Login/Login.js";
import UserProfile from "./pages/UserProfile/UserProfile.js";
import AdminPanel from "./pages/AdminPanel/AdminPanel.js";
import ManagerPanel from "./pages/ManagerPanel/ManagerPanel.js";
import ManagerRequestsBoard from "./pages/ManagerRequestsBoard/ManagerRequestsBoard.js";
import Infastructure from "./pages/StructureAdminPage/StructureAdminPage.js";
import EmployeeProfile from "./pages/EmployeeProfile/EmployeeProfile.js";
import EmployeeSettingsPage from "./pages/EmployeeSettingsPage/EmployeeSettingsPage.js";
import EmployeeAssignableRequestsBoard from "./pages/EmployeeAssignableRequestsBoard/EmployeeAssignableRequestsBoard";

import Forbidden from "./pages/Forbidden/Forbidden";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import RequireRole from "./auth/RequireRole";
import PublicOnly from "./auth/PublicOnly";
import IndexRedirect from "./auth/IndexRedirect";
import ProfileRedirect from "./auth/ProfileRedirect";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            {/* Только для НЕавторизованных */}
            <Route element={<PublicOnly />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Публично */}
            <Route path="/forbidden" element={<Forbidden />} />

            {/* Всё ниже — только после входа */}
            <Route element={<RequireAuth />}>
              {/* точка входа после логина */}
              <Route path="/" element={<IndexRedirect />} />
              <Route path="/app" element={<IndexRedirect />} />

              {/* кнопка "Профиль" ведёт сюда */}
              <Route path="/profile" element={<ProfileRedirect />} />

              {/* USER PROFILE доступен всем ролям */}
              <Route
                element={
                  <RequireRole
                    allowedRoles={["User", "Employee", "Manager", "Admin"]}
                  />
                }
              >
                <Route path="/user/profile" element={<UserProfile />} />
              </Route>

              {/* EMPLOYEE */}
              <Route element={<RequireRole allowedRoles={["Employee"]} />}>
                <Route path="/employee/profile" element={<EmployeeProfile />} />
              </Route>

              {/* ADMIN */}
              <Route element={<RequireRole allowedRoles={["Admin"]} />}>
                <Route path="/admin/panel" element={<AdminPanel />} />
                <Route
                  path="/admin/infastructure"
                  element={<Infastructure />}
                />
              </Route>

              {/* MANAGER */}
              <Route element={<RequireRole allowedRoles={["Manager"]} />}>
                <Route path="/manager/panel" element={<ManagerPanel />} />
                <Route
                  path="/manager/requests"
                  element={<ManagerRequestsBoard />}
                />
                <Route
                  path="/manager/employee/settings"
                  element={<EmployeeSettingsPage />}
                />
                <Route
                  path="/manager/employee/requests/assignable"
                  element={<EmployeeAssignableRequestsBoard />}
                />
              </Route>
            </Route>
          </Routes>

          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
