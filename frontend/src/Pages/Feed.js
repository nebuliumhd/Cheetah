/** ABSTRACT: Feed.js
 *
 *  DESCRIPTION:
 *  The FeedPage.js component retrieves and displays a personalized feed of posts
 *  for the authenticated user. Upon mounting, it sends an authenticated GET
 *  request to the backend to fetch posts from followed users and stores the
 *  results in component state. It renders each post using the PostContainer
 *  component and updates the feed dynamically when posts are deleted or
 *  modified. The component also provides user feedback when the feed is empty.
 *
 *  RESPONSIBILITIES:
 *  - Fetch the user’s feed posts from the backend API on component load.
 *  - Store and manage post data within the local component state.
 *  - Display individual posts using the PostContainer component.
 *  - Remove a post from the feed when it is deleted.
 *  - Optionally trigger a feed refresh when a post is edited.
 *  - Show a fallback message when no posts are available.
 *
 *  FUNCTIONS:
 *  - FeedPage(): Main component responsible for loading and displaying the
 *    user’s post feed.
 *  - fetchFeed(): Sends an authenticated request to retrieve feed posts from
 *    the backend API and updates component state. (defined inside useEffect)
 *  - handlePostDeleted(postId): Removes a deleted post from local state so
 *    the UI updates immediately.
 *  - handlePostUpdated(): Placeholder handler for responding to post edits
 *    or triggering a feed refresh.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

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
