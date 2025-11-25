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
import UserProfile from "./Pages/UserProfile";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  useEffect(() => {
    console.log("User changed:", user);
    console.log("Profile picture:", user?.profile_picture);
  }, [user]);

  const hideNavbarOnPaths = [
    "/profile",
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

  // Get profile picture URL
  const profilePicUrl = user?.profile_picture
    ? `${API_BASE}${user.profile_picture}`
    : `${API_BASE}/uploads/profiles/default-profile.jpg`;

  console.log("Full user object:", user);
  console.log("user.profile_picture value:", user?.profile_picture);
  console.log("Profile pic URL:", profilePicUrl);

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
              flexShrink: 0,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <img
                src={profilePicUrl}
                alt={user.username}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid white",
                }}
                onError={(e) => {
                  e.target.src = `${API_BASE}/uploads/images/default-profile.jpg`;
                }}
              />
              <span>Hello, {user.username}!</span>
            </div>
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
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile /> 
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
