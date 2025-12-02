import { useState, useEffect } from "react";
import ConversationList from "../Components/Chat/ConversationList";
import ChatWindow from "../Components/Chat/ChatWindow";
import MessageInput from "../Components/Chat/MessageInput";
import GroupSettingsModal from "../Components/Chat/GroupSettingsModal";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Chat() {
  const { user, userId } = useAuth();
  const currentUserId = userId || user?.id;
  
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [conversations, setConversations] = useState([]);

  const token = localStorage.getItem("token");

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
  }, [API_BASE, token, refreshTrigger]); // REMOVED selectedConversation?.id from dependencies

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
    console.log('Selected conversation:', conversation);
    setSelectedConversation(conversation);
    setShowGroupSettings(false);
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
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          fontSize: "16px",
          color: "#65676b",
        }}
      >
        Please log in to access chat
      </div>
    );
  }

  return (
    <div
      className="chat-page"
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
        backgroundColor: "#f0f2f5",
      }}
    >
      {/* Sidebar */}
      <ConversationList 
        onSelect={handleSelectConversation} 
        conversations={conversations}
      />

      {/* Chat Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {selectedConversation ? (
          <>
            {/* Header */}
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid #ccc",
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexShrink: 0,
              }}
            >
              {/* 1:1 PFP */}
              {!selectedConversation.is_group && (
                <img
                  src={getConversationPfp(selectedConversation)}
                  alt="Profile"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.target.src = `${API_BASE}/uploads/profiles/default-profile.jpg`;
                  }}
                />
              )}

              {/* Group emoji */}
              {selectedConversation.is_group && (
                <span style={{ fontSize: "24px" }}>👥</span>
              )}

              {/* Title */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h2 style={{ margin: 0, fontSize: "18px" }}>
                  {selectedConversation.display_name ||
                    selectedConversation.group_name ||
                    "Unknown"}
                </h2>
                {selectedConversation.is_group && (
                  <span
                    style={{ fontSize: "13px", color: "#65676b", marginTop: "2px" }}
                  >
                    ({getMemberCount(selectedConversation)} members)
                  </span>
                )}
              </div>

              {/* Group settings */}
              {selectedConversation.is_group && (
                <button
                  style={{
                    marginLeft: "auto",
                    padding: "6px 12px",
                    backgroundColor: "#e4e6eb",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                  onClick={() => setShowGroupSettings(true)}
                >
                  Settings
                </button>
              )}
            </div>

            {/* Chat messages scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                padding: "12px 16px",
              }}
            >
              <ChatWindow
                conversation={selectedConversation}
                refreshTrigger={refreshTrigger}
                currentUserId={currentUserId}
              />
            </div>

            {/* Message input */}
            <div style={{ flexShrink: 0 }}>
              <MessageInput
                conversation={selectedConversation}
                onMessageSent={handleMessageSent}
              />
            </div>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              fontSize: "16px",
              color: "#65676b",
            }}
          >
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