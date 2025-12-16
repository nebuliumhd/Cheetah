/** ABSTRACT: Bio.js
 *
 *  DESCRIPTION:
 *  Manages the display and editing of a user’s profile biography.
 *  Initializes state for bio text, editing mode, loading, and error handling.
 *  Communicates with the backend API to save updates via an authenticated PATCH request.
 *  Provides a responsive UI to view, edit, and submit bio changes.
 *
 *  RESPONSIBILITIES:
 *  - Display the current bio or a placeholder if none exists.
 *  - Allow the user to edit their bio text in a textarea.
 *  - Handle API requests to save updated bio information.
 *  - Manage UI states: editing, loading, and error messages.
 *  - Sync internal state when the parent updates the `currentBio` prop.
 *
 *  FUNCTIONS:
 *  - Bio({ currentBio }):
 *      Main component function managing state and rendering the bio UI.
 *
 *  - saveBio():
 *      Sends the updated bio to the backend API using a PATCH request.
 *      Updates the UI state based on success or failure.
 *
 *  HOOKS / STATE:
 *  - useState(bio, editing, loading, error)
 *      Tracks the bio text, editing mode, API loading status, and any error messages.
 *
 *  - useEffect():
 *      Syncs the internal bio state when `currentBio` prop changes.
 *
 *  ASSUMPTIONS:
 *  - The user is authenticated with a valid token stored in localStorage.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

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