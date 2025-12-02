
import { useState } from "react";
import "./PostContainer.css";

export default function Post({ post = {}, onPostUpdated, onPostDeleted }) {
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const [likes, setLikes] = useState(post.likes ?? 0);
  const [userLiked, setUserLiked] = useState(post.user_liked ?? false);

  const [comments, setComments] = useState(post.comments ?? []);
  const [commentText, setCommentText] = useState("");

  const authHeader = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ---------------- LIKE / UNLIKE ----------------
  const toggleLike = async () => {
    const url = `${API}/api/posts/${post.id}/like`;
    const method = userLiked ? "DELETE" : "POST";

    try {
      await fetch(url, { method, headers: authHeader });

      setLikes((prev) => (userLiked ? prev - 1 : prev + 1));
      setUserLiked(!userLiked);

      onPostUpdated?.();
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // ---------------- ADD COMMENT ----------------
  const submitComment = async () => {
    if (!commentText.trim()) return;

    try {
      const res = await fetch(`${API}/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({ text: commentText }),
      });

      const newComment = await res.json();

      setComments((prev) => [...prev, newComment]);
      setCommentText("");

      onPostUpdated?.();
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  // ---------------- DELETE COMMENT ----------------
  const deleteComment = async (commentId) => {
    try {
      await fetch(`${API}/api/posts/${post.id}/comment/${commentId}`, {
        method: "DELETE",
        headers: authHeader,
      });

      setComments((prev) => prev.filter((c) => c.id !== commentId));

      onPostUpdated?.();
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  // ---------------- DELETE POST ----------------
  const deletePost = async () => {
    try {
      await fetch(`${API}/api/posts/${post.id}`, {
        method: "DELETE",
        headers: authHeader,
      });

      onPostDeleted?.(post.id);
    } catch (err) {
      console.error("Delete post error:", err);
    }
  };

  // ---------------- TIME AGO ----------------
  const formatTime = (dateString) => {
    const diff = (Date.now() - new Date(dateString)) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="post">
      
      {/* HEADER */}
      <div className="post-header">
        <img
          src={post.user?.profile_picture || "/default-avatar.png"}
          alt="avatar"
          className="post-avatar"
        />

        <div>
          <p className="post-username">{post.user?.username}</p>
          <span className="post-time">{formatTime(post.created_at)}</span>
        </div>

        {post.is_owner && (
          <div className="post-actions">
            <button className="post-delete" onClick={deletePost}>Delete</button>
          </div>
        )}
      </div>

      {/* POST TEXT */}
      <p className="post-text">{post.text}</p>

      {/* ATTACHMENTS */}
      {post.attachments?.length > 0 && (
        <div className="post-images">
          {post.attachments.map((img) => (
            <img
              key={img.id}
              src={`${API}/${img.file_path}`}
              alt="attachment"
            />
          ))}
        </div>
      )}

      {/* FOOTER */}
      <div className="post-footer">
        <button onClick={toggleLike}>
          {userLiked ? "💙 Unlike" : "🤍 Like"} ({likes})
        </button>
      </div>

      {/* COMMENTS */}
      <div className="post-comments">
        {comments.map((c) => (
          <div key={c.id} className="comment">
            <span className="comment-username">{c.username}</span>
            <span className="comment-text">{c.text}</span>

            {c.is_owner && (
              <button className="comment-delete" onClick={() => deleteComment(c.id)}>
                ✖
              </button>
            )}
          </div>
        ))}

        {/* ADD COMMENT */}
        <div className="comment-input">
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button onClick={submitComment}>Post</button>
        </div>
      </div>

    </div>
  );
}
