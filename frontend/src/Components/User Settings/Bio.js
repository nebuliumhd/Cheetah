import { useState, useEffect } from "react";

export default function Bio({ currentBio }) {
  const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const [bio, setBio] = useState(currentBio || "");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update bio when currentBio prop changes
  useEffect(() => {
    if (currentBio) {
      setBio(currentBio);
    }
  }, [currentBio]);

  const authHeader = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const saveBio = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/users/update-bio`, {
        method: "PATCH",
        headers: authHeader,
        body: JSON.stringify({ bio }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update bio");
      } else {
        setEditing(false);
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    }

    setLoading(false);
  };

  return (
    <div className="bio-component">
      <h3>Bio</h3>

      {editing ? (
        <>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Write something about yourself..."
            style={{
              maxWidth: "50vw"
            }}
          />
          <div className="custom-button1">
            <button onClick={saveBio} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setEditing(false)} disabled={loading}>
              Cancel
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </>
      ) : (
        <>
          <p>{bio || "Add a Bio!"}</p>
          <button className="custom-button1" onClick={() => setEditing(true)}>Edit Bio</button>
        </>
      )}
    </div>
  );
}