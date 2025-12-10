import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../App.css";
import "./UserProfile.css";
import DeleteAccount from "../Components/User Settings/DeleteAccount";
import UpdateAccount from "../Components/User Settings/UpdateAccount";
import PFPOverlayModal from "../Components/User Settings/PFPOverlayModal";
import Bio from "../Components/User Settings/Bio";
import { useState, useEffect } from "react";

const UserProfile = () => {
  const { logout, user, updateProfilePicture } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setModalOpen] = useState(false);
  const [currentBio, setCurrentBio] = useState("");

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Fetch user's current bio on mount
  useEffect(() => {
    const fetchUserBio = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/users/username/${user?.username}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        console.log("User data:", data); // Debug
        if (data.user?.bio) {
          setCurrentBio(data.user.bio);
        } else {
          setCurrentBio(""); // Set to empty string if no bio
        }
      } catch (err) {
        console.error("Failed to fetch bio:", err);
      }
    };

    if (user?.username) {
      fetchUserBio();
    }
  }, [user?.username, API_BASE]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="Main-Page">
      <h3 className="Contact-Title">
        Welcome to your ChetChat account{user ? `, ${user.username}` : ""}!
      </h3>

      <div>
        <img
          src={
            user?.profile_picture
              ? `${API_BASE}${user.profile_picture}`
              : `${API_BASE}/uploads/profiles/default-profile.jpg`
          }
          alt="Profile"
          className="profile-avatar"
          onClick={() => setModalOpen(true)}
          style={{ cursor: "pointer" }}
        />
      </div>

      <Bio currentBio={currentBio} />

      <div className="account-buttons">
        <div>
          <PFPOverlayModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            currentProfile={user?.profile_picture}
            onUploadSuccess={(newPath) => {
              // Update profile picture in AuthContext
              updateProfilePicture(newPath);
              setModalOpen(false);
            }}
          />
          <button className="custom-button1" onClick={() => setModalOpen(true)}>
            Edit Picture
          </button>
        </div>
        <DeleteAccount />
        <UpdateAccount />
      </div>

      {/* <div className="navigation-buttons">
        <button className="custom-button1" onClick={() => navigate("/chat")}>
          Chats
        </button>
        <button className="custom-button1" onClick={() => navigate("/posts")}>
          Your posts
        </button>
        <button className="custom-button1" onClick={() => navigate("/feed")}>
          Home Feed
        </button>
        <button className="custom-button1" onClick={() => navigate("/friends")}>
          Friends
        </button>
        <button className="custom-button1" onClick={handleLogout}>
          Log Out
        </button>
      </div> */}
    </div>
  );
};

export default UserProfile;
