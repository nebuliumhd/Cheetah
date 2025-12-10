import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConversationList from "../Components/Chat/ConversationList";
import ChatWindow from "../Components/Chat/ChatWindow";
import MessageInput from "../Components/Chat/MessageInput";
import GroupSettingsModal from "../Components/Chat/GroupSettingsModal";
import { useAuth } from "../context/AuthContext";
import "./Chat.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Chat() {
  const { user, userId } = useAuth();
  const currentUserId = userId || user?.id;

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);

  const token = localStorage.getItem("token");

  const navigate = useNavigate();

  // Load conversations
  useEffect(() => {
    // Don't fetch if no token
    if (!token) {
      console.error("No token available, cannot fetch conversations");
      return;
    }

    let isActive = true;

    const loadConversations = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch conversations");
        }

        const data = await res.json();

        if (!isActive) return; // Component unmounted

        const newConversations = Array.isArray(data.conversations)
          ? data.conversations
          : [];

        setConversations(newConversations);

        // Update selected conversation if it exists in the new list
        if (selectedConversation) {
          const updatedConv = newConversations.find(
            (c) => c.id === selectedConversation.id
          );
          if (updatedConv) {
            setSelectedConversation(updatedConv);
          }
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }
    };

    loadConversations();

    return () => {
      isActive = false;
    };
  }, [API_BASE, token, refreshTrigger]);

  const handleMessageSent = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleGroupNameUpdated = (newGroupName) => {
    // Force refresh to get updated data from server
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleParticipantsChanged = (newCount) => {
    // Force refresh to update participant count everywhere
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectConversation = (conversation) => {
    console.log("Selected conversation:", conversation);
    setSelectedConversation(conversation);
    setShowGroupSettings(false);
    // Hide sidebar on mobile when conversation is selected
    if (window.innerWidth <= 768) {
      setShowSidebar(false);
    }
  };

  const handleBackToList = () => {
    setShowSidebar(true);
    // Don't clear the selected conversation - keep it in background
  };

  // Get PFP for 1:1 chats
  const getConversationPfp = (conversation) => {
    if (!conversation || conversation.is_group) return null;
    return conversation.profile_picture
      ? `${API_BASE}${conversation.profile_picture}`
      : `${API_BASE}/uploads/profiles/default-profile.jpg`;
  };

  // Get correct member count for groups
  const getMemberCount = (conversation) => {
    if (!conversation || !conversation.is_group) return 0;

    if (Array.isArray(conversation.participant_ids)) {
      return conversation.participant_ids.length;
    }

    return 0;
  };

  // Show loading state if no token
  if (!token) {
    return <div className="chat-loading">Please log in to access chat</div>;
  }

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <div className={`chat-sidebar ${showSidebar ? "show" : "hide"}`}>
        <ConversationList
          onSelect={handleSelectConversation}
          conversations={conversations}
          isSidebarOpen={showSidebar}
        />
      </div>

      {/* Chat Area */}
      <div className={`chat-main ${!showSidebar ? "show" : "hide"}`}>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="chat-header">
              {/* Back button for mobile */}
              <button className="chat-back-btn" onClick={handleBackToList}>
                ←
              </button>

              {/* 1:1 PFP */}
              {!selectedConversation.is_group && (
                <img
                  src={getConversationPfp(selectedConversation)}
                  alt="Profile"
                  className="chat-header-avatar"
                  onClick={() => navigate(`/username/${selectedConversation.other_user_username}`)}
                  onError={(e) => {
                    e.target.src = `${API_BASE}/uploads/profiles/default-profile.jpg`;
                  }}
                />
              )}

              {/* Group emoji */}
              {selectedConversation.is_group && (
                <span className="chat-header-icon">👥</span>
              )}

              {/* Title */}
              <div className="chat-header-info">
                <h2 className="chat-header-title">
                  {selectedConversation.display_name ||
                    selectedConversation.group_name ||
                    "Unknown"}
                </h2>
                {selectedConversation.is_group && (
                  <span className="chat-header-members">
                    ({getMemberCount(selectedConversation)} members)
                  </span>
                )}
              </div>

              {/* Group settings */}
              {selectedConversation.is_group && (
                <button
                  className="chat-settings-btn"
                  onClick={() => setShowGroupSettings(true)}
                >
                  Settings
                </button>
              )}
            </div>

            {/* Chat messages scrollable */}
            <div className="chat-messages-container">
              <ChatWindow
                conversation={selectedConversation}
                refreshTrigger={refreshTrigger}
                currentUserId={currentUserId}
              />
            </div>

            {/* Message input */}
            <div className="chat-input-container">
              <MessageInput
                conversation={selectedConversation}
                onMessageSent={handleMessageSent}
              />
            </div>
          </>
        ) : (
          <div className="chat-empty">
            Select a conversation to start chatting
          </div>
        )}
      </div>

      {/* Group Settings Modal */}
      {showGroupSettings && selectedConversation?.is_group && (
        <GroupSettingsModal
          conversation={selectedConversation}
          currentUserId={currentUserId}
          onClose={() => setShowGroupSettings(false)}
          onGroupNameUpdated={handleGroupNameUpdated}
          onParticipantsChanged={handleParticipantsChanged}
        />
      )}
    </div>
  );
}
