import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import MessageActionsDropdown from "./MessageActionsDropdown";
import "./ChatWindow.css";

const MESSAGES_PER_PAGE = 20;
const UNLOAD_THRESHOLD = 100;
const NEAR_BOTTOM_THRESHOLD = 100;
const UNLOAD_KEEP_PAGES = 2;

export default function ChatWindow({ conversation, refreshTrigger }) {
  const { user, userId } = useAuth();
  const currentUserId = userId || user?.id;
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
  const isGroup = conversation?.is_group;
  const conversationId = conversation?.id;

  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [firstUnreadIndex, setFirstUnreadIndex] = useState(null);
  const [allowMarkingAsRead, setAllowMarkingAsRead] = useState(false);

  // Edit state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  // Lightbox
  const [lightBoxImage, setLightBoxImage] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxMounted, setLightboxMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // DOM refs
  const chatWindowRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const observerRef = useRef(null);
  const isLoadingOlderRef = useRef(false);
  const lastKnownMessageId = useRef(null);
  const pollingIntervalRef = useRef(null);
  const editInputRef = useRef(null);

  // Lightbox handling
  const openLightbox = (img) => {
    setLightBoxImage(img);
    setLightboxMounted(true);
    setTimeout(() => setShowLightbox(true), 10);
  };
  
  const closeLightbox = () => {
    setShowLightbox(false);
    setTimeout(() => {
      setLightBoxImage(null);
      setLightboxMounted(false);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }, 300);
  };

  const DRAG_THRESHOLD = 5;
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((p) => Math.min(Math.max(p + delta, 1), 3));
  };
  
  const dragStart = useRef({ x: null, y: null });
  const offsetStart = useRef({ x: 0, y: 0 });
  
  const handleMouseDown = (e) => {
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
    setIsDragging(false);
  };
  
  const handleMouseMove = (e) => {
    if (dragStart.current.x === null) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (!isDragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) setIsDragging(true);
    if (isDragging)
      setOffset({
        x: offsetStart.current.x + dx,
        y: offsetStart.current.y + dy,
      });
  };
  
  const handleMouseUp = () => {
    dragStart.current = { x: null, y: null };
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    dragStart.current = { x: null, y: null };
    setIsDragging(false);
  };

  // Util
  const parseMessage = (msg) => {
    if (!msg) return "";
    if (typeof msg === "object" && msg.data)
      return Array.isArray(msg.data)
        ? String.fromCharCode(...msg.data)
        : msg.data;
    if (Array.isArray(msg)) return String.fromCharCode(...msg);
    return msg;
  };
  
  const formatTimestamp = (ts) => {
    if (!ts) return "";
    let epochMs;
    if (typeof ts === "number") epochMs = ts;
    else if (typeof ts === "string") epochMs = Date.parse(ts);
    else if (ts instanceof Date) epochMs = ts.getTime();
    else return "";
    if (isNaN(epochMs)) return "";

    const diffMins = Math.floor((Date.now() - epochMs) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(epochMs).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const scrollToBottom = useCallback((instant = false) => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: instant ? "auto" : "smooth",
      });
    }
  }, []);

  const isUserNearBottom = useCallback(() => {
    if (!chatWindowRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatWindowRef.current;
    return scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_THRESHOLD;
  }, []);

  const markMessageAsRead = useCallback(
    async (messageId) => {
      const token = localStorage.getItem("token");
      try {
        await fetch(`${API_BASE}/api/chat/mark-message-read/${messageId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        setDisplayedMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, read_at: new Date().toISOString() } : m
          )
        );
      } catch (err) {
        console.error("Error marking message as read:", err);
      }
    },
    [API_BASE]
  );

  // Edit/Delete handlers
  const handleEditMessage = (message) => {
    setEditingMessageId(message.id);
    setEditText(parseMessage(message.ciphertext));
    // Focus the input after state updates
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 0);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleSaveEdit = async (messageId) => {
    if (!editText.trim()) {
      handleCancelEdit();
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/chat/message/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: editText.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to edit message");
        return;
      }

      // Update LOCALLY
      setDisplayedMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, ciphertext: editText.trim(), edited_at: new Date().toISOString() }
            : m
        )
      );

      handleCancelEdit();
    } catch (err) {
      console.error("Error editing message:", err);
      alert("Failed to edit message");
    }
  };

  const handleDeleteMessage = async (message) => {
    const confirmDelete = window.confirm(
      message.message_type === "image"
        ? "Are you sure you want to delete this image?"
        : "Are you sure you want to delete this message?"
    );

    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/chat/message/${message.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to delete message");
        return;
      }

      // Remove from local state
      setDisplayedMessages((prev) => prev.filter((m) => m.id !== message.id));
    } catch (err) {
      console.error("Error deleting message:", err);
      alert("Failed to delete message");
    }
  };

  // Load older messages for pagination purposes
  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || isLoadingOlderRef.current || !hasMoreOlder || displayedMessages.length === 0) {
      return;
    }

    isLoadingOlderRef.current = true;
    setLoadingOlder(true);

    const oldestMessage = displayedMessages[0];
    const before = oldestMessage?.id;

    if (!before) {
      setLoadingOlder(false);
      isLoadingOlderRef.current = false;
      return;
    }

    const prevScrollHeight = chatWindowRef.current?.scrollHeight || 0;
    const prevScrollTop = chatWindowRef.current?.scrollTop || 0;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/chat/messages/${conversationId}?before=${before}&limit=${MESSAGES_PER_PAGE}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!res.ok) throw new Error("Failed to fetch older messages");
      
      const data = await res.json();
      const rows = data.messages || [];

      if (rows.length === 0) {
        setHasMoreOlder(false);
        setLoadingOlder(false);
        isLoadingOlderRef.current = false;
        return;
      }

      setDisplayedMessages((prev) => [...rows, ...prev]);
      setHasMoreOlder(data.hasMore);

      setTimeout(() => {
        if (chatWindowRef.current) {
          const newScrollHeight = chatWindowRef.current.scrollHeight;
          const heightDifference = newScrollHeight - prevScrollHeight;
          chatWindowRef.current.scrollTop = prevScrollTop + heightDifference;
        }
      }, 0);
    } catch (err) {
      console.error("Error loading older messages:", err);
    } finally {
      setLoadingOlder(false);
      isLoadingOlderRef.current = false;
    }
  }, [conversationId, API_BASE, hasMoreOlder, displayedMessages]);

  // Poll for new messages (TODO: REWORK TO BE LESS RESOURCE INTENSIVE?)
  const pollForNewMessages = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/chat/messages/${conversationId}?limit=${MESSAGES_PER_PAGE}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!res.ok) throw new Error("Failed to fetch messages");
      
      const data = await res.json();
      const rows = data.messages || [];

      if (rows.length === 0) {
        if (displayedMessages.length === 0) {
          setDisplayedMessages([]);
          setHasMoreOlder(false);
        }
        return;
      }

      setDisplayedMessages((prev) => {
        if (prev.length === 0) {
          lastKnownMessageId.current = rows[rows.length - 1]?.id || null;
          setHasMoreOlder(data.hasMore);
          
          if (initialLoading) {
            setTimeout(() => scrollToBottom(true), 100);
          }
          
          return rows;
        }

        const lastDisplayedId = prev[prev.length - 1]?.id || 0;
        const newMessages = rows.filter((msg) => msg.id > lastDisplayedId);

        if (newMessages.length === 0) {
          return prev;
        }

        if (isUserNearBottom()) {
          const updated = [...prev, ...newMessages];
          lastKnownMessageId.current = updated[updated.length - 1]?.id || lastKnownMessageId.current;
          
          setTimeout(() => scrollToBottom(true), 50);
          
          if (updated.length > UNLOAD_THRESHOLD) {
            const keepCount = MESSAGES_PER_PAGE * UNLOAD_KEEP_PAGES;
            return updated.slice(-keepCount);
          }
          
          return updated;
        }

        return prev;
      });

      if (initialLoading) {
        setInitialLoading(false);
        setTimeout(() => setAllowMarkingAsRead(true), 300);
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, [conversationId, API_BASE, displayedMessages.length, initialLoading, isUserNearBottom, scrollToBottom]);

  // Scrolling handler
  const handleScroll = useCallback(() => {
    if (!chatWindowRef.current) return;
    const { scrollTop } = chatWindowRef.current;

    if (scrollTop < 200 && hasMoreOlder && !isLoadingOlderRef.current) {
      loadOlderMessages();
    }
  }, [loadOlderMessages, hasMoreOlder]);

  // Effects
  useEffect(() => {
    setAllowMarkingAsRead(false);
    setInitialLoading(true);
    setDisplayedMessages([]);
    setLoadingOlder(false);
    setHasMoreOlder(true);
    lastKnownMessageId.current = null;
    isLoadingOlderRef.current = false;
    messageRefs.current = {};
    setEditingMessageId(null);
    setEditText("");
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Initial fetch (most recent messages at bottom)
    pollForNewMessages();
    
    pollingIntervalRef.current = setInterval(pollForNewMessages, 1000);

    const handleVisibility = () => {
      if (document.hidden) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        // Slower polling when tab is hidden (5 seconds)
        pollingIntervalRef.current = setInterval(pollForNewMessages, 5000);
      } else {
        pollForNewMessages();
        // Fast polling when tab is active (1 second)
        pollingIntervalRef.current = setInterval(pollForNewMessages, 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [conversationId, pollForNewMessages]);

  useEffect(() => {
    const node = chatWindowRef.current;
    if (!node) return;
    
    node.addEventListener("scroll", handleScroll);
    return () => node.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!allowMarkingAsRead) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            const message = displayedMessages.find(
              (m) => String(m.id) === String(messageId)
            );
            if (
              message &&
              message.sender_id !== currentUserId &&
              !message.read_at
            ) {
              markMessageAsRead(parseInt(messageId, 10));
            }
          }
        });
      },
      { threshold: 0.5, root: chatWindowRef.current }
    );
    
    return () => observerRef.current?.disconnect();
  }, [allowMarkingAsRead, currentUserId, markMessageAsRead, displayedMessages]);

  useEffect(() => {
    if (!observerRef.current) return;
    observerRef.current.disconnect();
    Object.values(messageRefs.current).forEach((ref) => {
      if (ref) observerRef.current.observe(ref);
    });
  }, [displayedMessages]);

  useEffect(() => {
    const firstUnread = displayedMessages.findIndex(
      (msg) => !msg.read_at && msg.sender_id !== currentUserId
    );
    setFirstUnreadIndex(firstUnread === -1 ? null : firstUnread);
  }, [displayedMessages, currentUserId]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (editingMessageId) {
          handleCancelEdit();
        } else {
          closeLightbox();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [editingMessageId]);

  const lastSentMessageIndex = displayedMessages.reduce(
    (lastIndex, msg, index) => {
      return String(msg.sender_id) === String(currentUserId)
        ? index
        : lastIndex;
    },
    -1
  );
  
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="chat-window" ref={chatWindowRef}>
        {initialLoading ? (
          <p className="chat-center-text">Loading messages...</p>
        ) : !displayedMessages.length ? (
          <p className="chat-center-text">
            No messages yet. Start the conversation!
          </p>
        ) : (
          <div style={{ flex: 1 }}>
            {hasMoreOlder && (
              <div
                style={{
                  height: "30px",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loadingOlder && (
                  <p style={{ textAlign: "center", color: "#888", fontSize: "12px" }}>
                    Loading older messages...
                  </p>
                )}
              </div>
            )}

            {displayedMessages.map((msg, index) => {
              const isSentByMe = String(msg.sender_id) === String(currentUserId);
              const showUnreadLine = index === firstUnreadIndex && firstUnreadIndex !== null;
              const isLastSentMessage = index === lastSentMessageIndex;
              const isEditing = editingMessageId === msg.id;

              const prevMsg = index > 0 ? displayedMessages[index - 1] : null;
              const isSameSenderAsPrevious = prevMsg && prevMsg.sender_id === msg.sender_id;
              const showSenderInfo = isGroup && !isSentByMe && !isSameSenderAsPrevious;

              return (
                <div key={msg.id}>
                  {showUnreadLine && (
                    <div className="unread-divider">
                      <div className="unread-line" />
                      <span className="unread-text">New Messages</span>
                      <div className="unread-line" />
                    </div>
                  )}

                  <div
                    ref={(el) => (messageRefs.current[msg.id] = el)}
                    data-message-id={msg.id}
                    className={
                      isSentByMe
                        ? "message-row message-sent"
                        : "message-row message-received"
                    }
                  >
                    {showSenderInfo && (
                      <div className="group-message-header">
                        <img
                          src={
                            msg.sender_profile_picture
                              ? `${API_BASE}${msg.sender_profile_picture}`
                              : `${API_BASE}/uploads/profiles/default-profile.jpg`
                          }
                          alt={msg.sender_username || "User"}
                          className="group-sender-avatar"
                          onError={(e) => {
                            e.target.src = `${API_BASE}/uploads/profiles/default-profile.jpg`;
                          }}
                        />
                        <div className="sender-label">
                          {msg.sender_username || "Unknown"}
                        </div>
                      </div>
                    )}

                    <div className="message-content-wrapper">
                      <div className="message-content">
                        {msg.message_type === "image" ? (
                          <div style={{ display: "inline-block", maxWidth: "70%" }}>
                            <img
                              src={`${API_BASE}${parseMessage(msg.ciphertext)}`}
                              alt=""
                              className="message-image"
                              onClick={() =>
                                openLightbox(`${API_BASE}${parseMessage(msg.ciphertext)}`)
                              }
                            />
                            {isSentByMe && isLastSentMessage && (
                              <div className="message-status">
                                {msg.read_at ? (
                                  <span>Read • {formatTimestamp(msg.read_at)}</span>
                                ) : (
                                  <span>Delivered • {formatTimestamp(msg.created_at)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : isEditing ? (
                          <div className="edit-message-container">
                            <input
                              ref={editInputRef}
                              type="text"
                              className="edit-message-input"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveEdit(msg.id);
                                } else if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                            />
                            <div className="edit-message-actions">
                              <button
                                className="edit-btn save"
                                onClick={() => handleSaveEdit(msg.id)}
                              >
                                Save
                              </button>
                              <button
                                className="edit-btn cancel"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "inline-block",
                              textAlign: isSentByMe ? "right" : "left",
                            }}
                          >
                            <span
                              className={`message-bubble ${
                                isSentByMe ? "bubble-sent" : "bubble-received"
                              }`}
                            >
                              {parseMessage(msg.ciphertext)}
                              {msg.edited_at && (
                                <span className="edited-indicator"> (edited)</span>
                              )}
                            </span>
                            {isSentByMe && isLastSentMessage && (
                              <div className="message-status">
                                {msg.read_at ? (
                                  <span>Read • {formatTimestamp(msg.read_at)}</span>
                                ) : (
                                  <span>Delivered • {formatTimestamp(msg.created_at)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {isSentByMe && !isEditing && (
                        <MessageActionsDropdown
                          message={msg}
                          onEdit={handleEditMessage}
                          onDelete={handleDeleteMessage}
                          position={isSentByMe ? "bottom-left" : "bottom-right"}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {lightboxMounted && lightBoxImage && (
          <div
            className={`lightbox-overlay ${showLightbox ? "visible" : ""}`}
            onClick={closeLightbox}
          >
            <img
              src={lightBoxImage}
              alt=""
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className="lightbox-image"
              style={{
                transform: `scale(${zoom}) translate(${
                  offset.x / Math.max(zoom, 1)
                }px, ${offset.y / Math.max(zoom, 1)}px)`,
                transition: isDragging ? "none" : "transform 0.3s ease-in-out",
                cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "default",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}