import { useEffect, useState, memo } from "react";
import AsyncSelect from "react-select/async";
import "./ConversationList.css";

// Memoized conversation item
const ConversationItem = memo(({ conv, onSelect, onDelete, apiBase }) => {
  const isGroup = conv.is_group;
  const displayName =
    conv.display_name || (isGroup ? "Unnamed Group" : "Unknown");
  const memberCount = conv.participant_ids?.length || 0;

  // Profile picture URL - use default if not set
  const profilePicUrl = conv.profile_picture
    ? `${apiBase}${conv.profile_picture}`
    : `${apiBase}/uploads/profiles/default-profile.jpg`;

  return (
    <div className="conv-item">
      <div className="conv-item-main" onClick={() => onSelect(conv)}>
        <div className="conv-item-title">
          {!isGroup && (
            <img
              src={profilePicUrl}
              alt={displayName}
              className="conv-item-avatar"
              onError={(e) => {
                e.target.src = `${apiBase}/uploads/profiles/default-profile.jpg`;
              }}
            />
          )}
          {isGroup && <span className="conv-item-icon">👥</span>}
          <span className="conv-item-name">{displayName}</span>
        </div>

        {isGroup && (
          <span className="conv-item-members">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <button
        className="conv-item-delete"
        onClick={() => onDelete(conv.id)}
        title="Delete conversation"
      >
        ✕
      </button>
    </div>
  );
});

ConversationItem.displayName = "ConversationItem";

export default function ConversationList({
  onSelect,
  conversations: propConversations,
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const token = localStorage.getItem("token");
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  // Update conversations when prop changes
  useEffect(() => {
    if (propConversations) {
      setConversations(propConversations);
    }
  }, [propConversations]);

  // Load conversations only if no prop provided (for backwards compatibility)
  useEffect(() => {
    if (propConversations) return; // Skip if conversations are provided as prop

    if (!token) {
      console.log("No token found, skipping conversation fetch");
      setLoadingConversations(false);
      return;
    }

    let interval;
    let isActive = true;

    const loadConversations = async () => {
      if (!isActive) return;

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch conversations");

        const data = await res.json();
        const newConversations = Array.isArray(data.conversations)
          ? data.conversations
          : [];

        setConversations(newConversations);
        setLoadingConversations(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load conversations");
        setLoadingConversations(false);
      }
    };

    loadConversations();
    interval = setInterval(loadConversations, 5000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        loadConversations();
        interval = setInterval(loadConversations, 5000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isActive = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [token, API_BASE, propConversations]);

  const loadOptions = async (inputValue) => {
    if (!inputValue.trim()) return [];

    try {
      const res = await fetch(
        `${API_BASE}/api/chat/search-users?q=${encodeURIComponent(inputValue)}`,
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
    } catch {
      return [];
    }
  };

  // For direct messages (1:1)
  const startConversation = async () => {
    if (!selectedUser) return;

    if (
      conversations.some((c) => c.other_user_username === selectedUser.value)
    ) {
      setError("Conversation with this user already exists!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/chat/start-by-username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: selectedUser.value }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConversations((prev) =>
        prev.some((c) => c.id === data.id) ? prev : [data, ...prev]
      );

      onSelect({
        id: data.id,
        is_group: false,
        display_name: selectedUser.value,
        other_user_username: selectedUser.value,
      });

      setSelectedUser(null);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Create group chat
  const createGroupChat = async () => {
    if (!groupName.trim()) {
      setError("Group name is required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (selectedMembers.length < 2) {
      setError("Select at least 2 members for a group");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/chat/group/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupName: groupName.trim(),
          participantUsernames: selectedMembers.map((m) => m.label),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowGroupModal(false);
      setGroupName("");
      setSelectedMembers([]);

      const convRes = await fetch(`${API_BASE}/api/chat`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const convData = await convRes.json();
      setConversations(convData.conversations || []);

      onSelect({
        id: data.conversation.id,
        is_group: true,
        display_name: groupName.trim(),
      });
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Delete conversation
  const deleteConversation = async (convId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this conversation? All messages and images will be permanently deleted."
      )
    )
      return;

    try {
      const res = await fetch(`${API_BASE}/api/chat/conversation/${convId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete conversation");

      const data = await res.json();

      setConversations((prev) => prev.filter((c) => c.id !== convId));

      onSelect(null);

      alert(
        `Conversation deleted successfully. ${
          data.imagesDeleted || 0
        } image(s) removed.`
      );
    } catch (err) {
      alert("Error deleting conversation");
    }
  };

  return (
    <div className="conversation-list">
      <h3>Your Conversations</h3>

      <div className="one-to-one-box">
        <AsyncSelect
          cacheOptions
          loadOptions={loadOptions}
          defaultOptions
          value={selectedUser}
          onChange={setSelectedUser}
          placeholder="Enter username..."
          styles={{ container: (base) => ({ ...base, flexGrow: 1 }) }}
        />

        <button className="start-button" onClick={startConversation}>
          +
        </button>
      </div>

      <button
        className="new-group-button"
        onClick={() => setShowGroupModal(true)}
      >
        New Group Chat
      </button>

      {error && <p className="error-text">{error}</p>}

      {loadingConversations ? (
        <p>Loading...</p>
      ) : conversations.length === 0 ? (
        <p>No conversations yet</p>
      ) : (
        conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conv={conv}
            onSelect={onSelect}
            onDelete={deleteConversation}
            apiBase={API_BASE}
          />
        ))
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Group Chat</h3>

            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="modal-input"
            />

            <AsyncSelect
              isMulti
              cacheOptions
              loadOptions={loadOptions}
              defaultOptions
              value={selectedMembers}
              onChange={setSelectedMembers}
              placeholder="Search and add members..."
              styles={{
                container: (base) => ({ ...base, marginBottom: "15px" }),
              }}
            />

            <div className="modal-actions">
              <button className="modal-create-button" onClick={createGroupChat}>
                Create Group
              </button>

              <button
                className="modal-cancel-button"
                onClick={() => {
                  setShowGroupModal(false);
                  setGroupName("");
                  setSelectedMembers([]);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
