import { useEffect, useState } from "react";
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
      method: "POST",
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
      method: "POST",
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
              />
              <span>{f.username}</span>
              <button onClick={() => removeFriend(f.username)}>Remove</button>
            </div>
          ))
        )}
      </section>

      <hr />

      {/* INCOMING */}
      <section className="friend-section">
        <h2>Incoming Requests</h2>
        {incoming.length === 0 ? (
          <p>No incoming requests</p>
        ) : (
          <div className="friend-container">
            {incoming.map((req) => (
              <div key={req.id} className="friend-request-item">
                <span>{req.username}</span>
                <button onClick={() => acceptFriend(req.username)}>
                  Accept
                </button>
                <button onClick={() => declineFriend(req.username)}>
                  Decline
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr />

      {/* OUTGOING */}
      <section>
        <h2>Outgoing Requests</h2>
        {outgoing.length === 0 ? (
          <p>No outgoing requests</p>
        ) : (
          outgoing.map((req) => (
            <div key={req.id} className="friend-request-item">
              <span>{req.username}</span>
              <button onClick={() => cancelRequest(req.username)}>
                Cancel Request
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
