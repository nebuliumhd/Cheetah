import { useState, useRef, useEffect } from "react";

export default function MessageInput({ otherUsername, onMessageSent }) {
  const [text, setText] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  
  const fileInputRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

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
    
    // Validate each file
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

    // Create previews for valid images
    const newImages = validImages.map((file) => {
      const reader = new FileReader();
      const imageObj = {
        file,
        preview: null,
        id: Math.random().toString(36).substr(2, 9), // Unique ID
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
    if ((!text.trim() && selectedImages.length === 0) || !otherUsername) return;
    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");
      // Send all images one by one
      for (const imageObj of selectedImages) {
        const formData = new FormData();
        formData.append("recipientUsername", otherUsername);
        formData.append("message", "Image");
        formData.append("messageType", "image");
        formData.append("image", imageObj.file);

        const imageRes = await fetch(
          `${API_BASE}/api/chat/send-image-by-username`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
        );

        if (!imageRes.ok) {
          const err = await imageRes.json().catch(() => ({}));
          setErrorMessage(err.error || "Failed to send image");
          return; // Stop sending if one fails
        }
      }

      // Send text message after all images if there is text
      if (text.trim()) {
        const textRes = await fetch(`${API_BASE}/api/chat/send-by-username`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            recipientUsername: otherUsername,
            message: text,
            messageType: "text",
          }),
        });

        if (!textRes.ok) {
          const err = await textRes.json().catch(() => ({}));
          setErrorMessage(err.error || "Failed to send text message");
          return;
        }
      }

      // Clear inputs after successful send
      setText("");
      handleRemoveAllImages();
      onMessageSent?.();
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <div style={{ borderTop: "1px solid #ccc", backgroundColor: "#fff" }}>
      {/* Error Message */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: "#ffe5e5",
            color: "#c00",
            padding: "8px 12px",
            textAlign: "center",
            fontSize: "14px",
            borderBottom: "1px solid #f5b5b5",
            opacity: showError ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Image Previews - Multiple Images */}
      {selectedImages.length > 0 && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#f5f5f5",
            borderBottom: "1px solid #ccc",
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            alignItems: "center",
          }}
        >
          {selectedImages.map((imageObj) => (
            <div
              key={imageObj.id}
              style={{
                position: "relative",
                flexShrink: 0,
              }}
            >
              <img
                src={imageObj.preview || ""}
                alt="Preview"
                style={{
                  height: "100px",
                  width: "100px",
                  borderRadius: "8px",
                  objectFit: "cover",
                  border: "2px solid #ddd",
                }}
              />
              <button
                onClick={() => handleRemoveImage(imageObj.id)}
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                  fontSize: "16px",
                  lineHeight: "1",
                  fontWeight: "bold",
                }}
              >
                ×
              </button>
            </div>
          ))}
          
          {/* Clear All Button */}
          {selectedImages.length > 1 && (
            <button
              onClick={handleRemoveAllImages}
              style={{
                padding: "6px 12px",
                backgroundColor: "#ff6b6b",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="message-input" style={{ display: "flex", padding: "10px", alignItems: "center" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple // Allow multiple file selection
          onChange={handleImageSelect}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "8px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "#f0f0f0",
            cursor: "pointer",
            marginRight: "8px",
            fontSize: "20px",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Attach images"
        >
          📎
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          style={{
            flexGrow: 1,
            padding: "8px 12px",
            borderRadius: "20px",
            border: "1px solid #ccc",
            outline: "none",
          }}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() && selectedImages.length === 0}
          style={{
            marginLeft: "8px",
            padding: "8px 16px",
            borderRadius: "20px",
            backgroundColor: text.trim() || selectedImages.length > 0 ? "#0084ff" : "#ccc",
            color: "white",
            border: "none",
            cursor: text.trim() || selectedImages.length > 0 ? "pointer" : "not-allowed",
            fontWeight: "bold",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}