import { useState } from "react";
import ConversationList from "../Components/Chat/ConversationList";
import ChatWindow from "../Components/Chat/ChatWindow";
import MessageInput from "../Components/Chat/MessageInput";

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMessageSent = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectConversation = (convId, username) => {
    setSelectedConversation(convId);
    setSelectedUsername(username);
  };

  return (
    <div
      className="chat-page"
      style={{
        display: "flex",
        height: "100%", // uses parent height
        width: "100%",
        overflow: "hidden", // prevents entire page scroll
        boxSizing: "border-box",
      }}
    >
      {/* Sidebar */}
      <ConversationList onSelect={handleSelectConversation} />

      {/* Chat area */}
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
            {/* ChatWindow scrolls independently */}
            <div style={{ 
              flex: 1, 
              overflowY: "auto",
              overflowX: "hidden"
            }}>
              <ChatWindow
                otherUsername={selectedUsername}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* MessageInput sticks at bottom */}
            <div style={{ flexShrink: 0 }}>
              <MessageInput
                otherUsername={selectedUsername}
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
            }}
          >
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}