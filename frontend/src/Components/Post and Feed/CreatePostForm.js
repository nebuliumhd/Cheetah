import { useState } from "react";
import "./CreatePostForm.css";

export default function CreatePostForm({ onPostCreated }) {
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);

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

    files.forEach((file) => formData.append("images", file));

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

        {preview.length > 0 && (
          <div className="preview-container">
            {preview.map((src, i) => (
              <img key={i} src={src} alt="preview" className="preview-img" />
            ))}
          </div>
        )}

        <label className="file-label">
          Add Images
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
        </label>

        <button className="submit-post" type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
}
