import logo from "./logo.svg";
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
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/user/profile" element={<UserProfile />} />
          <Route path="/employee/profile" element={<EmployeeProfile />} />
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/admin/infastructure" element={<Infastructure />} />
          <Route path="/manager/panel" element={<ManagerPanel />} />
          <Route path="/manager/requests" element={<ManagerRequestsBoard />} />
          <Route
            path="/manager/employee/settings"
            element={<EmployeeSettingsPage />}
          />
          <Route
            path="/manager/employee/requests/assignable"
            element={<EmployeeAssignableRequestsBoard />}
          />
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
  );
}

export default App;
