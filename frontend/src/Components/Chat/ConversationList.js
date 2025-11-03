import { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";

export default function ConversationList({ onSelect }) {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);

  const token = localStorage.getItem("token");

  // Load all conversations initially
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoadingConversations(true);
        const res = await fetch("http://localhost:5000/api/chat", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        setConversations(
          Array.isArray(data.conversations) ? data.conversations : []
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load conversations");
      } finally {
        setLoadingConversations(false);
      }
    };

    loadConversations();
  }, [token]);

  // Load users asynchronously for the AsyncSelect
  const loadOptions = async (inputValue) => {
    if (!inputValue.trim()) return [];

    try {
      const res = await fetch(
        `http://localhost:5000/api/chat/search-users?q=${encodeURIComponent(
          inputValue
        )}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      return Array.isArray(data.users) ? data.users : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // Start a new conversation
  const startConversation = async () => {
    if (!selectedUser) return;

    // Prevent duplicate conversations
    if (
      conversations.some((c) => c.other_user_username === selectedUser.value)
    ) {
      setError("Conversation with this user already exists!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setError("");

    try {
      const res = await fetch(
        "http://localhost:5000/api/chat/start-by-username",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username: selectedUser.value }),
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to start conversation");

      setConversations((prev) =>
        prev.some((c) => c.id === data.id) ? prev : [data, ...prev]
      );
      onSelect(data.id, selectedUser.value);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Delete a conversation
  const deleteConversation = async (convId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this conversation? All messages and images will be permanently deleted."
      )
    )
      return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/chat/conversation/${convId}`,
        {
          // Changed from /api/chat/${convId}
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to delete conversation");

      const data = await res.json();

      setConversations((prev) => prev.filter((c) => c.id !== convId));
      onSelect(null, null);

      // Show success message
      alert(
        `Conversation deleted successfully. ${
          data.imagesDeleted || 0
        } image(s) removed.`
      );
    } catch (err) {
      console.error(err);
      alert("Error deleting conversation");
    }
  };

  return (
    <div
      className="conversation-list"
      style={{
        width: "280px",
        borderRight: "1px solid #ccc",
        padding: "10px",
        background: "#f9f9f9",
        overflowY: "auto",
      }}
    >
      <h3>Your Conversations</h3>

      <div
        style={{ marginBottom: "15px", display: "flex", alignItems: "center" }}
      >
        <AsyncSelect
          cacheOptions
          loadOptions={loadOptions}
          defaultOptions
          value={selectedUser}
          onChange={setSelectedUser}
          placeholder="Enter username..."
          styles={{ container: (base) => ({ ...base, flexGrow: 1 }) }}
        />

        <button
          onClick={startConversation}
          style={{ marginLeft: "5px", padding: "5px 10px" }}
        >
          +
        </button>
      </div>

      {error && <p style={{ color: "red", fontSize: "12px" }}>{error}</p>}

      {loadingConversations ? (
        <p>Loading...</p>
      ) : conversations.length === 0 ? (
        <p>No conversations yet</p>
      ) : (
        conversations.map((conv) => (
          <div
            key={conv.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px",
              marginBottom: "5px",
              cursor: "pointer",
              background: "#fff",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              onClick={() =>
                onSelect(conv.id, conv.other_user_username || "Unknown")
              }
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              {conv.other_user_username || "Unknown"}
            </div>
            <button
              onClick={() => deleteConversation(conv.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ff4081",
                fontWeight: "bold",
                cursor: "pointer",
                marginLeft: "10px",
              }}
              title="Delete conversation"
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );
}
