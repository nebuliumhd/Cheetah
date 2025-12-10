import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import ProtectedRoute from "./Components/PrivateRoute";
import Landing from "./Pages/Landing";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Chat from "./Pages/Chat";
import Profile from "./Pages/UserProfile";
import VisitorProfile from "./Pages/VisitorProfile";
import LandingNav from "./Components/LandingNav";
import PostPage from "./Pages/Post";
import FeedPage from "./Pages/Feed";
import Friends from "./Pages/Friends";
import UserProfile from "./Pages/UserProfile";
import ReactSwitch from "react-switch";
import { Sling as Hamburger } from "hamburger-react";
import { Sun, Moon } from "lucide-react";
import { useEffect, useMemo, createContext, useState } from "react";
import { useAuth } from "./context/AuthContext";

export const ThemeContext = createContext(null);

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });
  const [isOpen, setOpen] = useState(false);

  const location = useLocation();
  const isScrollablePage = [
    "/feed",
    "/posts",
    "/friends",
    "/profile",
    "/username",
    "/register",
  ].some((path) => location.pathname.startsWith(path));
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, loading } = useAuth();

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!loading && isLoggedIn && location.pathname === "/landing") {
      navigate("/profile", { replace: true });
    }
  }, [loading, isLoggedIn, location.pathname, navigate]);

  const hideNavbarOnPaths = ["/update", "/delete", "/register", "/login"];
  const shouldShowNavbar = !hideNavbarOnPaths.includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const profilePicUrl = useMemo(() => {
    return user?.profile_picture
      ? `${API_BASE}${user.profile_picture}`
      : `${API_BASE}/uploads/profiles/default-profile.jpg`;
  }, [user?.profile_picture, API_BASE]);

  const navItems = [
    { label: "Friends", onClick: () => navigate("/friends") },
    { label: "Chat", onClick: () => navigate("/chat") },
    { label: "Feed", onClick: () => navigate("/feed") },
    { label: "Posts", onClick: () => navigate("/posts") },
    { label: "Profile", onClick: () => navigate("/profile") },
  ];

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: theme === "dark" ? "#1a1a2e" : "#f0f0f0",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        className="App"
        id={theme}
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {shouldShowNavbar &&
          (isLoggedIn ? (
            <nav className="navbar">
              <div className="navbar-content">
                {/* Left side: profile picture + greeting */}
                <div className="navbar-left">
                  <img
                    src={profilePicUrl}
                    alt={user.username}
                    className="profile-pic"
                    onClick={() => navigate(`/username/${user.username}`)}
                    style={{ cursor: "pointer" }}
                    onError={(e) => {
                      e.target.src = `${API_BASE}/uploads/profiles/default-profile.jpg`;
                    }}
                  />
                  <span
                    className="greeting"
                    style={{
                      maxWidth: "25vw",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Hello, {user.username}!
                  </span>
                </div>

                {/* Center: Desktop navigation buttons */}
                <div className="navbar-center">
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      className="nav-btn"
                      onClick={item.onClick}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Right side: theme toggle, logout, hamburger */}
                <div className="navbar-right">
                  <div className="theme-toggle">
                    <ReactSwitch
                      onChange={toggleTheme}
                      checked={theme === "dark"}
                      uncheckedIcon={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            paddingLeft: 2,
                          }}
                        >
                          <Sun size={18} />
                        </div>
                      }
                      checkedIcon={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            paddingLeft: 2,
                          }}
                        >
                          <Moon size={18} />
                        </div>
                      }
                    />
                  </div>

                  <button onClick={handleLogout} className="nav-btn logout-btn">
                    Logout
                  </button>

                  <div className="hamburger-menu">
                    <Hamburger toggled={isOpen} toggle={setOpen} />
                  </div>
                </div>
              </div>

              {/* Mobile dropdown menu */}
              {isOpen && (
                <div className="mobile-dropdown">
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      className="mobile-nav-btn"
                      onClick={() => {
                        item.onClick();
                        setOpen(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    className="mobile-nav-btn"
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </nav>
          ) : (
            <LandingNav />
          ))}

        <div
          style={{
            flex: 1,
            width: "100%",
            backgroundColor: theme === "dark" ? "#1a1a2e" : "#f0f0f0",
            transition: "background-color 0.3s ease",
            overflow: isScrollablePage ? "auto" : "hidden",
            minHeight: 0,
            display: isScrollablePage ? "block" : "flex",
            flexDirection: isScrollablePage ? undefined : "column",
          }}
        >
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/username/:username" element={<VisitorProfile />} />

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

            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;