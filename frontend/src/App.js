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
import Profile from './Pages/UserProfile';
import LandingNav from "./Components/LandingNav";
import PostPage from "./Pages/Post";
import FeedPage from "./Pages/Feed";
import Friends from "./Pages/Friends";
import { createContext, useState } from "react";
import ReactSwitch from "react-switch";

export const ThemeContext = createContext(null);

function App() {
  const [theme, setTheme] = useState("dark");
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  useEffect(() => {
    console.log("User changed:", user);
    console.log("Profile picture:", user?.profile_picture);
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
  const chat = () => {
    navigate("/chat");
  };
  const profile = () => {
    navigate("/profile");
  };
  const posts = () => {
    navigate("/posts");
  };
  const feed = () => {
    navigate("/feed");
  };
  const friends = () => {
    navigate("/friends");
  };

  // Get profile picture URL
  const profilePicUrl = user?.profile_picture
    ? `${API_BASE}${user.profile_picture}`
    : `${API_BASE}/uploads/profiles/default-profile.jpg`;

  console.log("Full user object:", user);
  console.log("user.profile_picture value:", user?.profile_picture);
  console.log("Profile pic URL:", profilePicUrl);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
    <div className="App" id ={theme}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      
      {shouldShowNavbar && (
  isLoggedIn ? (
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
      {/* Left side: profile picture + greeting */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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

      {/* Right side: buttons + switch */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={friends} className="nav-btn">Friends List</button>
        <button onClick={chat} className="nav-btn">Chats</button>
        <button onClick={feed} className="nav-btn">Your Feed</button>
        <button onClick={posts} className="nav-btn">Your Posts</button>
        <button onClick={profile} className="nav-btn">Settings</button>

        {/* React Switch */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <ReactSwitch
            onChange={toggleTheme}
            checked={theme === "dark"}
          />
        </div>

        <button onClick={handleLogout} className="nav-btn">Logout</button>
      </div>
    </div>
  ) : (
    <LandingNav />
  )
)}

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
              <Profile />
            </ProtectedRoute>
          }
          />

           <Route
          path="/posts"
          element={
            <ProtectedRoute>
              <PostPage />
            </ProtectedRoute>
          }
          />

          <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          }
          />

                 <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </div>
    
    </div>
    </ThemeContext.Provider>
  );
}

export default App;