import { useEffect, useState } from "react";
import PostContainer from "../Components/Post and Feed/PostContainer.js";
import CreatePostForm from "../Components/Post and Feed/CreatePostForm.js";

export default function PostPage() {
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const [posts, setPosts] = useState([]);

  const loadMyPosts = async () => {
    const res = await fetch(`${API}/api/posts/my-posts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setPosts(data);
  };

  useEffect(() => {
    loadMyPosts();
  }, []);

  return (
    <div className="posts-page">
      <CreatePostForm onPostCreated={loadMyPosts} />

      {posts.length === 0 ? (
        <p style={{ color: "#fff" }}>You have no posts yet.</p>
      ) : (
        posts.map((post) => (
          <PostContainer
            key={post.id}
            post={post}
            onPostUpdated={loadMyPosts}
            onPostDeleted={loadMyPosts}
          />
        ))
      )}
    </div>
  );
}
