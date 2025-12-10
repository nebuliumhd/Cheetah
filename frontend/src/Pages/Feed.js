import { useEffect, useState } from "react";
import "../App.css";
import "./Feed.css";
import PostContainer from "../Components/Post and Feed/PostContainer";

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/posts/feed`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load feed:", data.error);
          return;
        }

        setPosts(data);
      } catch (err) {
        console.error("Error fetching feed:", err);
      }
    };

    fetchFeed();
  }, [API_BASE]);

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdated = () => {
    // Optional: refresh feed on update
    // fetchFeed();
  };

  return (
    <div className="feed-page">
      <h1>Feed</h1>

      {posts.length === 0 ? (
        <p>No posts yet. Follow some friends to see their posts!</p>
      ) : (
        posts.map((post) => (
          <PostContainer
            key={post.id}
            post={post}
            onPostUpdated={handlePostUpdated}
            onPostDeleted={handlePostDeleted}
          />
        ))
      )}
    </div>
  );
};

export default FeedPage;
