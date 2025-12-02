import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./UserProfile.css";
import DeleteAccount from "../Components/User Settings/DeleteAccount";
import UpdateAccount from "../Components/User Settings/UpdateAccount";
import PFPOverlayModal from "../Components/User Settings/PFPOverlayModal";
import Bio from "../Components/User Settings/Bio";
import { useState } from "react";

const Main = () => {
  const { logout, user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="Main-Page">
      <h1 className="Contact-Title">
        Welcome to your ChetChat Account {user ? `, ${user.username}` : ""}!
      </h1>

      {/* 🌟 Display profile picture */}
      <div style={{ marginBottom: "20px" }}>
        <img
          src={user?.profile_picture || "/default-avatar.png"}
          alt="Profile"
          className="profile-avatar"
          onClick={() => setModalOpen(true)}
          style={{ cursor: "pointer" }}
        />
        <button className="custom-button1" onClick={() => setModalOpen(true)}>
          Change Profile Picture
        </button>
      </div>

      {/* 🌟 Profile Picture Overlay Modal */}
      <PFPOverlayModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        currentProfile={user?.profile_picture}
        onUploadSuccess={(newPath) => {
          // Update user profile picture in AuthContext
          updateUser({ ...user, profile_picture: newPath });
          setModalOpen(false); // automatically close modal
        }}
      />

      {/* Account Management */}
      <DeleteAccount />
      <UpdateAccount />
      <Bio />

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
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
      </div>
    </div>
  );
};

export default Main;
