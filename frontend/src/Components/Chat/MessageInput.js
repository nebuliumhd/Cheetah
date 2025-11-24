import { useState, useRef, useEffect } from "react";
import "./MessageInput.css";

export default function MessageInput({ conversation, onMessageSent }) {
  const [text, setText] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  const isGroup = conversation?.is_group;
  const conversationId = conversation?.id;
  const otherUsername = conversation?.other_user_username;

  useEffect(() => {
    if (errorMessage) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        const removeTimer = setTimeout(() => setErrorMessage(""), 300);
        return () => clearTimeout(removeTimer);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    const validImages = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Only image files are allowed");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(`${file.name} is larger than 5MB`);
        continue;
      }
      validImages.push(file);
    }

    if (validImages.length === 0) return;

    const newImages = validImages.map((file) => {
      const reader = new FileReader();
      const imageObj = {
        file,
        preview: null,
        id: Math.random().toString(36).substr(2, 9),
      };

      reader.onloadend = () => {
        imageObj.preview = reader.result;
        setSelectedImages((prev) =>
          prev.map((img) => (img.id === imageObj.id ? imageObj : img))
        );
      };
      reader.readAsDataURL(file);

      return imageObj;
    });

    setSelectedImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (imageId) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleRemoveAllImages = () => {
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if ((!text.trim() && selectedImages.length === 0) || !conversation || isSending) return;
    
    setIsSending(true);
    setErrorMessage("");

    // Clear UI immediately for optimistic update
    const messageText = text;
    const imagesToSend = [...selectedImages];
    setText("");
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const token = localStorage.getItem("token");

      if (isGroup) {
        // Send images to group
        for (const imageObj of imagesToSend) {
          const formData = new FormData();
          formData.append("conversationId", conversationId);
          formData.append("message", "Image");
          formData.append("messageType", "image");
          formData.append("image", imageObj.file);

          const imageRes = await fetch(
            `${API_BASE}/api/chat/group/send-image`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            }
          );

          if (!imageRes.ok) {
            const err = await imageRes.json().catch(() => ({}));
            setErrorMessage(err.error || "Failed to send image");
            // Restore images on error
            setSelectedImages(imagesToSend);
            setIsSending(false);
            return;
          }
        }

        // Send messages here
        if (messageText.trim()) {
          const res = await fetch(`${API_BASE}/api/chat/group/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              conversationId,
              message: messageText,
              messageType: "text",
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            setErrorMessage(err.error || "Failed to send message");
            // Restore text on error
            setText(messageText);
            setIsSending(false);
            return;
          }
        }
      } else {
        // Send images to direct messages (1:1)
        for (const imageObj of imagesToSend) {
          const formData = new FormData();
          formData.append("recipientUsername", otherUsername);
          formData.append("message", "Image");
          formData.append("messageType", "image");
          formData.append("image", imageObj.file);

          const imageRes = await fetch(
            `${API_BASE}/api/chat/send-image-by-username`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            }
          );

          if (!imageRes.ok) {
            const err = await imageRes.json().catch(() => ({}));
            setErrorMessage(err.error || "Failed to send image");
            setSelectedImages(imagesToSend);
            setIsSending(false);
            return;
          }
        }

        // Send direct messages (1:1)
        if (messageText.trim()) {
          const textRes = await fetch(`${API_BASE}/api/chat/send-by-username`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              recipientUsername: otherUsername,
              message: messageText,
              messageType: "text",
            }),
          });

          if (!textRes.ok) {
            const err = await textRes.json().catch(() => ({}));
            setErrorMessage(err.error || "Failed to send text message");
            setText(messageText);
            setIsSending(false);
            return;
          }
        }
      }

      // Success - trigger refresh
      onMessageSent?.();
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error. Please try again.");
      setText(messageText);
      setSelectedImages(imagesToSend);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="message-input-wrapper">
      {errorMessage && (
        <div className={`error-banner ${showError ? "visible" : ""}`}>
          {errorMessage}
        </div>
      )}

      {selectedImages.length > 0 && (
        <div className="preview-container">
          {selectedImages.map((imageObj) => (
            <div key={imageObj.id} className="preview-item">
              <img src={imageObj.preview || ""} alt="Preview" className="preview-img" />
              <button
                onClick={() => handleRemoveImage(imageObj.id)}
                className="preview-remove-btn"
              >
                ×
              </button>
            </div>
          ))}

          {selectedImages.length > 1 && (
            <button onClick={handleRemoveAllImages} className="preview-clear-btn">
              Clear All
            </button>
          )}
        </div>
      )}

      <div className="message-input">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          style={{ display: "none" }}
          disabled={isSending}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="attach-btn"
          title="Attach images"
          disabled={isSending}
        >
          📎
        </button>

        <input
          type="text"
          className="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={isSending ? "Sending..." : "Type a message..."}
          disabled={isSending}
        />

        <button
          onClick={handleSend}
          className={`send-btn ${
            (text.trim() || selectedImages.length > 0) && !isSending ? "active" : ""
          }`}
          disabled={(!text.trim() && selectedImages.length === 0) || isSending}
        >
          {isSending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}