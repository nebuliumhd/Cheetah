import { useState } from "react";
import ConversationList from "../Components/Chat/ConversationList";
import ChatWindow from "../Components/Chat/ChatWindow";
import MessageInput from "../Components/Chat/MessageInput";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMessageSent = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
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

    if (typeof conversation.participant_ids === 'string') {
      return conversation.participant_ids.split(',').filter(id => id.trim()).length;
    }
    
    return 0;
  };

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
      <ConversationList onSelect={handleSelectConversation} />

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

              {/* Group emoji (TODO: group chat picture?) */}
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
                  onClick={() => {
                    // Just some filler stuff
                    alert(
                      "Group settings coming soon!"
                    );
                  }}
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
                currentUserId={null}
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
    </div>
  );
}