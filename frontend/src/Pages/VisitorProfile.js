import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import Post from "../Components/Post and Feed/PostContainer";
import "../App.css";
import "./VisitorProfile.css";

const VisitorProfile = () => {
  const { username } = useParams(); // Get username from URL
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");

        // Fetch user data
        const userRes = await fetch(`${API_BASE}/api/users/username/${username}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userRes.ok) {
          throw new Error("User not found");
        }

        const userData = await userRes.json();
        setProfileUser(userData.user);

        // Fetch user's posts - you'll need to create this endpoint
        // For now, using feed and filtering client-side
        const postsRes = await fetch(`${API_BASE}/api/posts/feed`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (postsRes.ok) {
          const allPosts = await postsRes.json();
          // Filter to only this user's posts
          const filteredPosts = allPosts.filter(
            (post) => post.username === username
          );
          setUserPosts(filteredPosts);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, API_BASE]);

  const handlePostDeleted = (postId) => {
    setUserPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdated = () => {
    // Optionally refetch posts
  };

  if (loading) {
    return <div className="Profile-Page">Loading...</div>;
  }

  if (error) {
    return (
      <div className="Profile-Page">
        <h3>Error: {error}</h3>
        <button onClick={() => navigate("/feed")}>Back to Feed</button>
      </div>
    );
  }

  if (!profileUser) {
    return <div className="Profile-Page">User not found</div>;
  }

  return (
    <div className="Profile-Page">
      {/* User Header */}
      <div className="profile-header">
        <img
          src={
            profileUser?.profile_picture
              ? `${API_BASE}${profileUser.profile_picture}`
              : `${API_BASE}/uploads/profiles/default-profile.jpg`
          }
          alt="Profile"
          className="profile-avatar"
        />
        <h3 className="User-Name">{profileUser.username}</h3>
        
        {profileUser.bio && (
          <p className="bio-text">{profileUser.bio}</p>
        )}

        {isOwnProfile && (
          <button
            className="custom-button1"
            onClick={() => navigate("/profile")}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* User's Posts */}
      <div className="profile-posts">
        <h4>{userPosts.length} Posts</h4>
        {userPosts.length === 0 ? (
          <p>No posts yet</p>
        ) : (
          userPosts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onPostUpdated={handlePostUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default VisitorProfile;