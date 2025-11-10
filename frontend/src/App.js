import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import Landing from "./Pages/Landing";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Chat from "./Pages/Chat";
import LandingNav from "./Components/LandingNav";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  useEffect(() => {
    console.log("User changed:", user);
  }, [user]);

  const hideNavbarOnPaths = [
    "/main",
    "/update",
    "/delete",
    "/register",
    "/login",
  ];
  const shouldShowNavbar = !hideNavbarOnPaths.includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {shouldShowNavbar &&
        (isLoggedIn ? (
          <div
            style={{
              width: "100%",
              padding: "10px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#790cd3",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              flexShrink: 0, // Prevent navbar from shrinking
              boxSizing: "border-box",
            }}
          >
            <div>Hello, {user.username}!</div>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 16px",
                backgroundColor: "#fff",
                color: "#4b0430ff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#f0f0f0";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#fff";
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <LandingNav />
        ))}

      <div style={{ flex: 1, overflow: "auto", width: "100%" }}>
        <Routes>
          {/* Public routes - anyone can access */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes - must be logged in */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;