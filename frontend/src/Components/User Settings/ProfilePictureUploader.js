/** ABSTRACT: ProfilePictureUploader.js
 *
 *  DESCRIPTION:
 *  Provides a modal interface for selecting, previewing, validating, and uploading
 *  a new profile picture. Manages state for file selection, preview generation,
 *  modal visibility, upload progress, and error handling. Validates file type
 *  and size, generates a temporary preview, and sends the image to the backend
 *  using an authenticated PATCH request via FormData. After a successful upload,
 *  the parent component is notified and the modal closes with a fade-out animation.
 *
 *  RESPONSIBILITIES:
 *  - Display a modal with fade-in/fade-out animation and overlay click handling.
 *  - Allow users to select image files through a hidden file input.
 *  - Validate selected files: must be image type and ≤5MB.
 *  - Generate a temporary preview of the selected image.
 *  - Upload the image via authenticated PATCH request.
 *  - Handle and display loading and error states.
 *  - Notify parent on successful upload and close the modal.
 *
 *  STATE & HOOKS:
 *  - useState: selectedFile, preview, error, isUploading, showModal
 *  - useRef: fileInputRef
 *  - useEffect: synchronize showModal with isOpen prop
 *
 *  FUNCTIONS:
 *  - handleClose(): Closes modal with fade-out animation.
 *  - handleFileSelect(e): Validates file and generates preview.
 *  - handleUpload(): Uploads the selected file and updates parent state.
 *
 *  PROPS:
 *  - isOpen: boolean, modal visibility
 *  - onClose: function, callback when modal closes
 *  - currentProfile: string, current profile picture path
 *  - onUploadSuccess: function, callback with new profile picture path after upload
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

import { useState, useRef, useEffect } from "react";
import "./ProfilePictureUploader.css"; // add modal/fade styling

export default function ProfilePictureUploader({ 
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

  // Handle fade-in/fade-out
  useEffect(() => {
    if (isOpen) setShowModal(true);
  }, [isOpen]);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => onClose?.(), 300); // match fade-out duration
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return setError("Only image files are allowed");
    if (file.size > 5 * 1024 * 1024) return setError("File size exceeds 5MB");

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("profilePicture", selectedFile);

      const res = await fetch(`${API_BASE}/api/users/update-pfp`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // Update parent user state
      onUploadSuccess?.(data.filename || data.profilePicture);
      setSelectedFile(null);
      handleClose(); // Close modal after upload
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen && !showModal) return null;

  return (
    <div className="modal-overlay fade-in" onClick={handleClose}>
  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
    
    {/* Close button */}
    <button className="modal-close-btn" onClick={handleClose}>
      ×
    </button>

    <h2>Update Profile Picture</h2>

    {error && <div className="error-banner">{error}</div>}

    {preview && (
      <div className="preview-container">
        <img src={preview} alt="Preview" className="preview-img" />
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
