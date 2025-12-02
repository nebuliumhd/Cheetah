import { useEffect, useState } from "react";

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const API = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API}/api/posts/feed`, {
          headers: { Authorization: `Bearer ${token}` }
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
  }, [API]); // API is stable, but safe to add

  return (
    <div className="feed-page">
      <h2>Feed</h2>

      {posts.map((p) => (
        <div key={p.id} className="post-card">
          <div className="post-header">
            <img 
              src={p.profile_picture || "/default-avatar.png"} 
              alt="User" 
              className="avatar" 
            />
            <span>{p.username}</span>
          </div>

          <p>{p.text}</p>
        </div>
      ))}
    </div>
  );
};

export default FeedPage;
