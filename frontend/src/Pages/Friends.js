/** ABSTRACT: Friends.js
 *
 *  DESCRIPTION:
 *  The Friends.js component manages the full client-side interface for the
 *  application's friend system. It retrieves and displays the user’s friends,
 *  incoming friend requests, and outgoing requests, while also providing UI
 *  controls to add friends, accept or decline requests, cancel pending
 *  requests, and remove existing friends. The component communicates with the
 *  backend through authenticated API calls and updates its state accordingly,
 *  ensuring that all friend-related data remains synchronized and responsive
 *  to user actions.
 *
 *  RESPONSIBILITIES:
 *  - Fetch and display friend lists, incoming requests, and outgoing requests.
 *  - Allow users to send friend requests by username.
 *  - Accept, decline, or cancel friend requests.
 *  - Remove existing friends.
 *  - Maintain local component state for loading, errors, and form input.
 *  - Refresh all friend-related data after any action that changes state.
 *  - Display user profile pictures or a fallback default.
 *
 *  FUNCTIONS:
 *  - Friends(): Main component that controls the friends page UI and logic.
 *  - loadData(): Fetches friends, incoming requests, and outgoing requests
 *    from the backend and updates component state.
 *  - sendFriendRequest(): Sends a new friend request to a specified username.
 *  - acceptFriend(username): Accepts an incoming friend request.
 *  - declineFriend(username): Declines an incoming friend request.
 *  - removeFriend(username): Removes an existing friend.
 *  - cancelRequest(username): Cancels an outgoing friend request.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "./Friends.css";

export default function Friends() {
  const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  const [newFriend, setNewFriend] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const navigate = useNavigate();

  const authHeader = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Load everything
  const loadData = async () => {
    setLoading(true);

    const resFriends = await fetch(`${API}/api/users/list`, {
      headers: authHeader,
    });
    const resIncoming = await fetch(`${API}/api/users/requests/incoming`, {
      headers: authHeader,
    });
    const resOutgoing = await fetch(`${API}/api/users/requests/outgoing`, {
      headers: authHeader,
    });

    setFriends(await resFriends.json());
    setIncoming(await resIncoming.json());
    setOutgoing(await resOutgoing.json());

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Friend Actions ---
  const sendFriendRequest = async () => {
    if (!newFriend.trim()) return;

    setAdding(true);
    setAddError("");

    try {
      const res = await fetch(`${API}/api/users/friend-request/${newFriend}`, {
        method: "POST",
        headers: authHeader,
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Could not send friend request");
      } else {
        setNewFriend("");
        loadData(); // refresh friends/outgoing
      }
    } catch (err) {
      console.error(err);
      setAddError("Network error");
    }

    setAdding(false);
  };

  const acceptFriend = async (username) => {
    await fetch(`${API}/api/users/accept-friend/${username}`, {
      method: "POST",
      headers: authHeader,
    });
    loadData();
  };

  const declineFriend = async (username) => {
    await fetch(`${API}/api/users/decline-friend/${username}`, {
      method: "DELETE",
      headers: authHeader,
    });
    loadData();
  };

  const removeFriend = async (username) => {
    await fetch(`${API}/api/users/remove-friend/${username}`, {
      method: "DELETE",
      headers: authHeader,
    });
    loadData();
  };

  const cancelRequest = async (username) => {
    await fetch(`${API}/api/users/decline-friend/${username}`, {
      method: "DELETE",
      headers: authHeader,
    });
    loadData();
  };

  if (loading) return <p>Loading friends...</p>;

  return (
    <div className="friends-page">
      <h1>Friends</h1>
      {/* ADD FRIEND */}
      <section>
        <h2>Add a Friend</h2>
        <div className="add-friend">
          <input
            className="search-friend"
            type="text"
            placeholder="Enter username"
            value={newFriend}
            onChange={(e) => setNewFriend(e.target.value)}
          />
          <button onClick={sendFriendRequest} disabled={adding}>
            {adding ? "Sending..." : "Send Request"}
          </button>
        </div>
        {addError && <p style={{ color: "red" }}>{addError}</p>}
      </section>

      {/* FRIEND LIST */}
      <section className="friend-section">
        <h2>Your Friends</h2>
        <div className="friend-container">
          {friends.length === 0 ? (
            <p>You have no friends yet 💀</p>
          ) : (
            friends.map((f) => (
              <div key={f.id} className="friend-item">
                {/* Profile picture */}
                <img
                  src={
                    f.profile_picture
                      ? `${API}${f.profile_picture}`
                      : `${API}/uploads/profiles/default-profile.jpg`
                  }
                  alt={f.username}
                  className="friend-avatar"
                  onClick={() => navigate(`/username/${f.username}`)}
                />
                <span>{f.username}</span>
                <button onClick={() => removeFriend(f.username)}>Remove</button>
              </div>
            ))
          )}
        </div>
      </section>

      <hr />

      {/* INCOMING */}
      <section className="friend-section">
        <h2>Incoming Requests</h2>
        <div className="friend-container">
          {incoming.length === 0 ? (
            <p>No incoming requests</p>
          ) : (
            incoming.map((req) => (
              <div key={req.id} className="friend-request-item">
                <span>{req.username}</span>
                <div className="button-group">
                  <button
                    className="accept"
                    onClick={() => acceptFriend(req.username)}
                  >
                    Accept
                  </button>
                  <button
                    className="decline"
                    onClick={() => declineFriend(req.username)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <hr />

      {/* OUTGOING */}
      <section className="friend-section">
        <h2>Outgoing Requests</h2>
        <div className="friend-container">
          {outgoing.length === 0 ? (
            <p>No outgoing requests</p>
          ) : (
            outgoing.map((req) => (
              <div key={req.id} className="friend-request-item">
                <span>{req.username}</span>
                <button
                  className="cancel"
                  onClick={() => cancelRequest(req.username)}
                >
                  Cancel Request
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}