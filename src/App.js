import logo from "./logo.svg";
import "./App.css";
import Login from "./pages/Login/Login.js";
import UserProfile from "./pages/UserProfile/UserProfile.js";
import AdminPanel from "./pages/AdminPanel/AdminPanel.js";
import ManagerPanel from "./pages/ManagerPanel/ManagerPanel.js";
import ManagerRequestsBoard from "./pages/ManagerRequestsBoard/ManagerRequestsBoard.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/Login" />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/AdminPanel" element={<AdminPanel />} />
          <Route path="/UserProfile" element={<UserProfile />} />
          <Route path="/manager/panel" element={<ManagerPanel />} />
          <Route path="/manager/requests" element={<ManagerRequestsBoard />} />
          {/* <Route path="/Administration" element={<AllUsers />} />
          <Route path="/Location" element={<Location />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/AdminProfile" element={<AdminProfile />} />
          <Route path="*" element={<NotFound404 />} /> */}
        </Routes>
        {/* <ManagerPanel />
        <AdminPanel />
        <UserProfile />
        <Login /> */}

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
