/** ABSTRACT: Post.js
 *  
 *  DESCRIPTION:
 *  Defines the main posts management page for the logged-in user.
 *  Allows users to create new posts and view, update, or delete
 *  their existing posts.
 * 
 *  RESPONSIBILITIES:
 *  - Fetch and display all posts created by the currently authenticated user.
 *  - Provide a form for creating new posts.
 *  - Refresh the post list when posts are created, updated, or deleted.
 *  - Handle empty-state UI when the user has no posts.
 *
 *  FUNCTIONS:
 *  - Post(): Main component responsible for rendering the user’s post page
 *    and managing post state.
 *  - loadMyPosts(): Sends an authenticated request to retrieve the user’s
 *    posts from the backend and updates local state.
 * 
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 * 
 *  END ABSTRACT
 **/

import { useEffect, useState } from "react";
import PostContainer from "../Components/Post and Feed/PostContainer.js";
import CreatePostForm from "../Components/Post and Feed/CreatePostForm.js";

export default function Post() {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const [posts, setPosts] = useState([]);

  const loadMyPosts = async () => {
    const res = await fetch(`${API_BASE}/api/posts/my-posts`, {
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
        <p className="no-posts-text">You have no posts yet.</p>
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
