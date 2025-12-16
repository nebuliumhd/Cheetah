/** ABSTRACT: CreatePostForm.js
 *
 *  DESCRIPTION:
 *  Provides a form for creating new posts with text content, multiple image attachments,
 *  visibility options, previews, and secure backend submission. Handles form validation,
 *  loading states, error handling, and notifies parent components when a post is created.
 *
 *  RESPONSIBILITIES:
 *  - Manage form state for post text, attached files, previews, visibility, and loading.
 *  - Generate client-side previews for uploaded image files.
 *  - Validate that either text or at least one file is included before submission.
 *  - Build and submit FormData objects to the backend API with JWT authorization.
 *  - Reset form state after successful submission.
 *  - Notify parent components via onPostCreated callback.
 *  - Handle and display errors for failed post creation.
 *
 *  FUNCTIONS:
 *  - CreatePostForm(props):
 *      Main component function; manages state, renders form UI, handles user input and submission.
 *
 *  - handleFileChange(event):
 *      Handles image file selection, updates files state, and generates preview URLs.
 *
 *  - handleSubmit(event):
 *      Validates form, constructs FormData with text and attachments, sends POST request
 *      to backend, handles success/failure, resets form, and triggers onPostCreated callback.
 *
 *  HOOKS / STATE:
 *  - useState(text, files, preview, loading, visibility)
 *      Manages the post content, selected files, preview URLs, loading status, and post visibility.
 *
 *  ASSUMPTIONS:
 *  - The user is authenticated and has a valid token stored in localStorage.
 *  - onPostCreated callback is provided by the parent component to refresh UI.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

import { useState } from "react";
import "../../App.css";
import "./CreatePostForm.css";

export default function CreatePostForm({ onPostCreated }) {
  const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState("everyone");

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);

    // generate previews
    const urls = selected.map((file) => URL.createObjectURL(file));
    setPreview(urls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("text", text);
    formData.append("visibility", visibility);

    files.forEach((file) => formData.append("attachments", file));

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/api/posts/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to create post:", errorText);
        alert("Failed to create post. See console for details.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setText("");
      setFiles([]);
      setPreview([]);

      if (onPostCreated) onPostCreated(data);
    } catch (err) {
      console.error("Error creating post:", err);
      alert("An error occurred while creating the post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
      <form onSubmit={handleSubmit}>
        <textarea
          className="post-input"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div style={{ marginTop: "10px", marginBottom: "10px" }}>
          <label>Visibility: </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="visibility-select"
          >
            <option value="everyone">Everyone</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>

        {preview.length > 0 && (
          <div className="preview-container">
            {preview.map((src, i) => (
              <img key={i} src={src} alt="preview" className="preview-img" />
            ))}
          </div>
        )}

        <label className="file-label">
          Add Image
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
        </label>

        <div className="submit-container">
          <button className="submit-post" type="submit" disabled={loading}>
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
