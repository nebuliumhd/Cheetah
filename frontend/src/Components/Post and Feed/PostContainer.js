/** ABSTRACT: PostContainer.js
 *
 *  DESCRIPTION:
 *  Renders an individual post with user profile info, text, attachments, likes, 
 *  and comments. Manages all interactive behaviors for a single post, including 
 *  liking/unliking, adding/deleting comments, editing/deleting posts, and updating 
 *  the UI based on backend responses.
 *
 *  RESPONSIBILITIES:
 *  - Render post content: user info, text, attachments, and timestamps.
 *  - Handle liking/unliking with live UI updates and backend calls.
 *  - Manage comment creation, deletion, and UI updates.
 *  - Allow post owners to edit or delete their posts.
 *  - Communicate with backend API endpoints for all post actions.
 *  - Safely handle null/undefined post fields with defaults.
 *  - Support "Read more/Read less" for long posts.
 *
 *  FUNCTIONS:
 *  - PostContainer(props):
 *      Main component function; manages state, renders UI, handles user interactions.
 *
 *  - toggleLike():
 *      Toggles the like status for the current user, updates the likes count locally,
 *      and calls the backend to persist the like/unlike action.
 *
 *  - submitComment():
 *      Sends a new comment to the backend, updates local comment state, and triggers 
 *      onPostUpdated callback.
 *
 *  - deleteComment(commentId):
 *      Deletes a comment from the backend, updates local comment state, and triggers 
 *      onPostUpdated callback.
 *
 *  - deletePost():
 *      Deletes the current post from the backend and calls onPostDeleted callback 
 *      to remove it from the UI.
 *
 *  - startEdit():
 *      Enables editing mode for the post text.
 *
 *  - cancelEdit():
 *      Cancels editing mode and restores original post text.
 *
 *  - saveEdit():
 *      Submits edited post text to the backend and updates local UI state.
 *
 *  - formatTime(dateString):
 *      Converts a timestamp into a "time ago" string for display (e.g., 5m ago).
 *
 *  - renderPostText():
 *      Renders post text with support for editing and "Read more/Read less" 
 *      functionality for long posts.
 *
 *  HOOKS / STATE:
 *  - useState(likes, userLiked, comments, commentText, isEditing, caption, isExpanded)
 *      Manages likes, comment list, comment input, edit state, edited text, and 
 *      text expansion.
 *
 *  ASSUMPTIONS:
 *  - The user is authenticated with a valid token stored in localStorage.
 *  - The parent component provides onPostUpdated and onPostDeleted callbacks.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import "./PostContainer.css";
import { useAuth } from "../../context/AuthContext";

export default function PostContainer({ post = {}, onPostUpdated, onPostDeleted }) {
  const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Debug: log post data
  console.log("Post data:", post);

  const [likes, setLikes] = useState(post.likes ?? 0);
  const [userLiked, setUserLiked] = useState(post.user_liked ?? false);

  const [comments, setComments] = useState(post.comments ?? []);
  const [commentText, setCommentText] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [caption, setEditText] = useState(post.caption || "")
  
  // For read more/less functionality
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LENGTH = 300; // Characters before truncating

  const navigate = useNavigate();

  const authHeader = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const { userId, username } = useAuth();
  console.log(userId);

  // ---------------- LIKE / UNLIKE ----------------
  const toggleLike = async () => {
  try {
    const res = await fetch(`${API}/api/posts/${post.id}/toggle-like`, {
      method: "POST",
      headers: authHeader,
    });

    const data = await res.json();

    if (!data.success) return;

    // Update UI based on backend result
    if (data.action === "liked") {
      setLikes((prev) => prev + 1);
      setUserLiked(true);
    } else {
      setLikes((prev) => Math.max(prev - 1, 0));
      setUserLiked(false);
    }

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

      // newComment now includes username and profile_picture from backend
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
      const postId = post.id
      await fetch(`${API}/api/posts/${postId}/comment/${commentId}`, {
        method: "DELETE",
        headers: authHeader,
      });

      console.log(commentId, post.id);

      setComments((prev) => prev.filter((c) => c.id !== commentId));

      onPostUpdated?.();
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  // ---------------- DELETE POST ----------------
  const deletePost = async () => {
    try {
      const postId = post.id
      await fetch(`${API}/api/posts/${postId}`, {
        method: "DELETE",
        headers: authHeader,
      });

      onPostDeleted?.(post.id);
    } catch (err) {
      console.error("Delete post error:", err);
    }
  };

  // ---------------- EDIT POST ----------------
  const startEdit = () => {
    setIsEditing(true);
    setEditText(post.text || "");
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditText(post.text || "");
  };

  const saveEdit = async () => {
    if (!caption.trim()) {
      alert("Post text cannot be empty");
      return;
    }

    try {
      const postId = post.id;
      const res = await fetch(`${API}/api/posts/${postId}`, {
        method: "PATCH",
        headers: authHeader,
        body: JSON.stringify({ text: caption }),
      });

      if (!res.ok) throw new Error("Failed to update post");

      const data = await res.json();
      
      // Update the post text locally
      post.text = data.text;
      setIsEditing(false);
      onPostUpdated?.();
    } catch (err) {
      console.error("Edit post error:", err);
      alert("Failed to update post");
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

  // ---------------- RENDER POST TEXT ----------------
  const renderPostText = () => {
    const postText = post.text || "";
    const isLongPost = postText.length > MAX_LENGTH;

    if (isEditing) {
      return (
        <div className="post-edit-container">
          <textarea
            value={caption}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="post-edit-textarea"
          />
          <button className="edit-save" onClick={saveEdit}> Save Edit </button>
          <button className="edit-cancel" onClick={cancelEdit}> Cancel Edit </button>
        </div>
      );
    }

    if (!isLongPost) {
      return <p className="post-text">{postText}</p>;
    }

    return (
      <div>
        <p className="post-text">
          {isExpanded ? postText : `${postText.substring(0, MAX_LENGTH)}...`}
        </p>
        <button 
          className="read-more-btn" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Read less" : "Read more"}
        </button>
      </div>
    );
  };

  return (
    <div className="post">
      
      {/* HEADER */}
      <div className="post-header">
        <img
          src={post.profile_picture ? `${API}${post.profile_picture}` : `${API}/uploads/profiles/default-profile.jpg`}
          alt="avatar"
          className="post-avatar"
          onClick={() => navigate(`/username/${post.username}`)}
        />

        <div className="post-user-info">
          <p className="post-username">{post.username}</p>
          <span className="post-time">{formatTime(post.created_at)}</span>
        </div>

        {(Number(post.user_id) === Number(userId)) && (
          <div className="post-actions">
            {!isEditing && (
              <button className="post-edit" onClick={startEdit}> Edit</button>
            )}
            <button className="post-delete" onClick={deletePost}>Delete</button>
          </div>
        )}
      </div>

      {/* POST TEXT */}
      {renderPostText()}
      
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

            {( (Number(post.user_id) === Number(userId)) || (Number(c.user_id) === Number(userId)) ) && (
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