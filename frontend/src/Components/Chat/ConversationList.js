/** ABSTRACT: ConversationList.js
 *  
 *  DESCRIPTION:
 *  Manages and renders the list of user conversations in a chat interface.  
 *  Provides functionality for starting 1:1 conversations, creating group chats, 
 *  and deleting conversations while integrating with backend API endpoints.  
 *  Utilizes AsyncSelect for user search and supports mobile-responsive UI behavior.
 *
 *  RESPONSIBILITIES:
 *  - Fetch and display existing conversations for the authenticated user.
 *  - Provide search functionality to find users and start new conversations.
 *  - Create group chats with multiple participants.
 *  - Delete conversations and notify the backend to remove associated messages and images.
 *  - Handle error states, loading indicators, and user feedback.
 *  - Notify parent components when a conversation is selected or updated.
 *  - Render UI elements for 1:1 and group conversations, including profile pictures.
 *
 *  FUNCTIONS:
 *  - loadConversations: Fetches the user's conversations from the backend API.
 *  - loadOptions: Searches for users based on input for starting new conversations or group chats.
 *  - startConversation: Initiates a new 1:1 conversation with a selected user and updates state.
 *  - createGroupChat: Creates a new group chat with a name and selected members.
 *  - deleteConversation: Deletes a conversation and its associated messages/images.
 *  - handleConversationSelect: Handles conversation selection and notifies parent components.
 *
 *  ASSUMPTIONS:
 *  - The user is authenticated and has a valid token stored in localStorage.
 *  - Backend API endpoints exist and follow expected request/response formats.
 *  - Profile pictures are stored at a predictable path and a default image is available.
 *  - Component may receive `conversations` and `isSidebarOpen` as props; if not, manages them via state.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland
 *
 *  END ABSTRACT
 **/

import { useEffect, useState, memo } from "react";
import { createPortal } from "react-dom";
import AsyncSelect from "react-select/async";
import "../../App.css";
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
  isSidebarOpen: propIsSidebarOpen,
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const token = localStorage.getItem("token");
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  // Use prop if provided, otherwise use local state
  const sidebarOpen =
    propIsSidebarOpen !== undefined ? propIsSidebarOpen : isSidebarOpen;

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
        // `${API_BASE}/api/chat/search-users?q=${encodeURIComponent(inputValue)}`,
        `${API_BASE}/api/chat/search-for-friends?q=${encodeURIComponent(
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
      // Close sidebar on mobile after selection
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
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

      // Close sidebar on mobile after selection
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
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

  const handleConversationSelect = (conv) => {
    onSelect(conv);
    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const convListStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "var(--bg-tertiary)",
      borderColor: state.isFocused
        ? "var(--button-primary)"
        : "var(--border-color)",
      boxShadow: state.isFocused
        ? "0 0 0 1px var(--button-primary)"
        : provided.boxShadow,
      "&:hover": {
        borderColor: "var(--button-primary)",
      },
    }),
    input: (provided) => ({
      ...provided,
      color: "var(--text-primary)",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "var(--bg-secondary)",
      border: "1px solid var(--border-color)",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "var(--button-primary)"
        : state.isFocused
        ? "var(--bg-tertiary)"
        : "transparent",
      color: state.isSelected ? "var(--text-tertiary)" : "var(--text-primary)",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--text-secondary)",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "var(--text-primary)",
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: "var(--border-color)",
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? "var(--text-primary)" : "var(--text-secondary)",
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "var(--text-secondary)",
    }),
    loadingIndicator: (provided) => ({
      ...provided,
      color: "var(--button-primary)",
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: "var(--text-secondary)",
    }),
    loadingMessage: (provided) => ({
      ...provided,
      color: "var(--text-secondary)",
    }),
    multiValue: (provided) => ({
      ...provided,
      color: "white",
      backgroundColor: "var(--button-primary-hover)",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "white",
      backgroundColor: "var(--button-primary-hover)",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      backgroundColor: "var(--button-primary)",
    }),
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Conversation List */}
      <div className={`conversation-list ${sidebarOpen ? "open" : ""}`}>
        <h3 className={"conversation-text"}>Your Conversations</h3>

        <div className="one-to-one-box">
          <AsyncSelect
            cacheOptions
            loadOptions={loadOptions}
            defaultOptions
            value={selectedUser}
            onChange={setSelectedUser}
            placeholder="Enter username..."
            styles={convListStyles}
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
              onSelect={handleConversationSelect}
              onDelete={deleteConversation}
              apiBase={API_BASE}
            />
          ))
        )}
      </div>

      {/* Group Modal - Using Portal */}
      {showGroupModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 999999,
            }}
            onClick={() => setShowGroupModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "var(--bg-secondary)",
                padding: "30px",
                borderRadius: "8px",
                minWidth: "400px",
                maxWidth: "500px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "center",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                Create Group Chat
              </h3>

              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-tertiary)",
                  boxSizing: "border-box",
                }}
              />

              <div style={{ marginBottom: "15px" }}>
                <AsyncSelect
                  isMulti
                  cacheOptions
                  loadOptions={loadOptions}
                  defaultOptions
                  value={selectedMembers}
                  onChange={setSelectedMembers}
                  placeholder="Search and add members..."
                  styles={convListStyles}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  onClick={createGroupChat}
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    backgroundColor: "var(--button-primary-hover)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Create Group
                </button>

                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupName("");
                    setSelectedMembers([]);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
