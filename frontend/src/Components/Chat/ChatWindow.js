import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function ChatWindow({ otherUsername, refreshTrigger }) {
  const { user, userId } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [firstUnreadIndex, setFirstUnreadIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const observerRef = useRef(null);
  const messageRefs = useRef({});

  const currentUserId = userId || user?.id;

  const parseMessage = (msg) => {
    if (!msg) return "";

    if (typeof msg === "object" && msg.data) {
      return Array.isArray(msg.data)
        ? String.fromCharCode(...msg.data)
        : msg.data;
    }

    if (Array.isArray(msg)) {
      return String.fromCharCode(...msg);
    }

    return msg;
  };

  // DO NOT TOUCH THIS FUNCTION WITHOUT TESTING!!!
  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const messageLocal = new Date(ts);
    if (isNaN(messageLocal.getTime())) return "";

    const messageUTC =
      messageLocal.getTime() - messageLocal.getTimezoneOffset() * 60000;
    const nowUTC = Date.now();
    const diffMins = Math.floor((nowUTC - messageUTC) / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return messageLocal.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const markMessageAsRead = useCallback(async (messageId) => {
    const token = localStorage.getItem("token");

    try {
      await fetch(
        `http://localhost:5000/api/chat/mark-message-read/${messageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            const message = messages.find((m) => m.id === parseInt(messageId));

            if (
              message &&
              message.sender_id !== currentUserId &&
              !message.read_at
            ) {
              markMessageAsRead(parseInt(messageId));
            }
          }
        });
      },
      {
        threshold: 0.5,
        root: document.querySelector(".chat-window"),
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [messages, currentUserId, markMessageAsRead]);

  useEffect(() => {
    if (!observerRef.current) return;

    observerRef.current.disconnect();

    Object.values(messageRefs.current).forEach((ref) => {
      if (ref) {
        observerRef.current.observe(ref);
      }
    });
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval;
    let isActive = true;

    async function fetchMessages() {
      if (!otherUsername || !isActive) return;

      const token = localStorage.getItem("token");

      try {
        const res = await fetch(
          `http://localhost:5000/api/chat/messages-by-username/${otherUsername}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch messages");

        const data = await res.json();

        setMessages((prevMessages) => {
          const newMessagesString = JSON.stringify(data.messages);
          const oldMessagesString = JSON.stringify(prevMessages);

          if (newMessagesString !== oldMessagesString) {
            return data.messages || [];
          }
          return prevMessages;
        });
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        if (initialLoading) {
          setInitialLoading(false);
        }
      }
    }

    fetchMessages();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchMessages();
        interval = setInterval(fetchMessages, 5000);
      }
    };

    interval = setInterval(fetchMessages, 5000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [otherUsername, refreshTrigger, currentUserId, initialLoading]);

  useEffect(() => {
    const firstUnread = messages.findIndex(
      (msg) => !msg.read_at && msg.sender_id !== currentUserId
    );
    setFirstUnreadIndex(firstUnread === -1 ? null : firstUnread);
  }, [messages, currentUserId]);

  // Find the index of the last message sent by the current user
  const lastSentMessageIndex = messages.reduce((lastIndex, msg, index) => {
    if (String(msg.sender_id) === String(currentUserId)) {
      return index;
    }
    return lastIndex;
  }, -1);

  return (
    <div
      className="chat-window"
      style={{
        padding: "10px",
        overflowY: "auto",
        overflowX: "hidden",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#f0f2f5",
        display: "flex",
        flexDirection: "column",
        scrollBehavior: "smooth",
      }}
    >
      {initialLoading ? (
        <p style={{ textAlign: "center", marginTop: "150px" }}>
          Loading messages...
        </p>
      ) : messages.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888", marginTop: "150px" }}>
          No messages yet. Start the conversation!
        </p>
      ) : (
        <div style={{ flex: 1 }}>
          {messages.map((msg, index) => {
            const isSentByMe = String(msg.sender_id) === String(currentUserId);
            const showUnreadLine =
              index === firstUnreadIndex && firstUnreadIndex !== null;
            const isLastSentMessage = index === lastSentMessageIndex; // Check if this is the last message you sent

            return (
              <div key={msg.id}>
                {showUnreadLine && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      margin: "10px 0",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        backgroundColor: "#f23f43",
                      }}
                    />
                    <span
                      style={{
                        color: "#f23f43",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      New Messages
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        backgroundColor: "#f23f43",
                      }}
                    />
                  </div>
                )}

                {/* Message */}
                <div
                  ref={(el) => (messageRefs.current[msg.id] = el)}
                  data-message-id={msg.id}
                  style={{
                    textAlign: isSentByMe ? "right" : "left",
                    margin: "5px 0",
                  }}
                >
                  {msg.message_type === "image" ? (
                    // Image message
                    <div style={{ display: "inline-block", maxWidth: "70%" }}>
                      <img
                        src={`http://localhost:5000${parseMessage(
                          msg.ciphertext
                        )}`}
                        alt="Sent image"
                        style={{
                          maxWidth: "300px",
                          maxHeight: "300px",
                          borderRadius: "12px",
                          cursor: "default",
                          display: "block",
                        }}
                      />
                      {/* Delivery/Read status for images - ONLY on last message */}
                      {isSentByMe && isLastSentMessage && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#65676b",
                            marginTop: "2px",
                            textAlign: "right",
                          }}
                        >
                          {msg.read_at ? (
                            <span>Read • {formatTimestamp(msg.read_at)}</span>
                          ) : (
                            <span>
                              Delivered • {formatTimestamp(msg.created_at)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Text message
                    <div
                      style={{
                        display: "inline-block",
                        textAlign: isSentByMe ? "right" : "left",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "8px 12px",
                          borderRadius: "12px",
                          backgroundColor: isSentByMe ? "#0084ff" : "#e4e6eb",
                          color: isSentByMe ? "white" : "black",
                          maxWidth: "100%",
                          overflowWrap: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {parseMessage(msg.ciphertext)}
                      </span>

                      {/* Delivery/Read status - ONLY on last message you sent */}
                      {isSentByMe && isLastSentMessage && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#65676b",
                            marginTop: "2px",
                          }}
                        >
                          {msg.read_at ? (
                            <span>Read • {formatTimestamp(msg.read_at)}</span>
                          ) : (
                            <span>
                              Delivered • {formatTimestamp(msg.created_at)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}