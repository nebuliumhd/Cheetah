/** ABSTRACT: PFPOverlayModal.js
 *
 *  DESCRIPTION:
 *  Provides an interactive modal for updating a user’s profile picture. 
 *  Handles image selection, preview generation, upload progress, fade-in/out 
 *  animation, and error handling. Validates selected files, generates a local 
 *  preview, and uploads the image to the backend with an authenticated PATCH request.
 *
 *  RESPONSIBILITIES:
 *  - Display a modal with fade-in and fade-out animations.
 *  - Allow users to select, preview, validate, and remove image files.
 *  - Upload the selected image using FormData through an authenticated API call.
 *  - Handle and display upload errors and loading states.
 *  - Notify the parent component when the upload succeeds.
 *  - Close the modal cleanly on user action or after a successful upload.
 *
 *  STATE & HOOKS:
 *  - useState: selectedFile, preview, error, isUploading, showModal
 *  - useRef: fileInputRef
 *  - useEffect: synchronize showModal with isOpen prop
 *
 *  FUNCTIONS:
 *  - handleClose(): Closes the modal with fade-out animation.
 *  - handleFileSelect(e): Validates selected file, generates preview, and sets error messages if invalid.
 *  - handleUpload(): Sends authenticated PATCH request to update profile picture, handles success/error states.
 *
 *  PROPS:
 *  - isOpen: boolean, whether the modal should be visible
 *  - onClose: function, callback when modal is closed
 *  - currentProfile: string, current profile picture path
 *  - onUploadSuccess: function, callback with new profile picture path after successful upload
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

import { useState, useRef, useEffect } from "react";
import "../../App.css";
import "./PFPOverlayModal.css";

export default function PFPOverlayModal({ 
  isOpen, 
  onClose, 
  currentProfile, 
  onUploadSuccess 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(currentProfile || "");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(isOpen);

  const fileInputRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  // Handle fade-in/out
  useEffect(() => {
    if (isOpen) setShowModal(true);
  }, [isOpen]);

  const handleClose = () => {
    // Fade out before closing
    setShowModal(false);
    setTimeout(() => onClose?.(), 300); // match animation duration
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return setError("Only images allowed");
    if (file.size > 5 * 1024 * 1024) return setError("File exceeds 5MB");

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("profilePicture", selectedFile);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/users/update-pfp`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onUploadSuccess?.(data.profilePicture);
      handleClose(); // Close modal after successful upload
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen && !showModal) return null;

  return (
    <div
      className={`modal-overlay ${showModal ? "fade-in" : "fade-out"}`}
      onClick={handleClose}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Update Profile Picture</h2>

        {error && <div className="error-banner">{error}</div>}

        {preview && (
          <div className="preview-container">
            <img src={`${API_BASE}${preview}`} alt="Preview" className="preview-img" />
            <button onClick={() => setSelectedFile(null)}>Remove</button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
          disabled={isUploading}
        />

        <div className="modal-buttons">
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            Select Image
          </button>
          <button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </button>
          <button onClick={handleClose} disabled={isUploading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
