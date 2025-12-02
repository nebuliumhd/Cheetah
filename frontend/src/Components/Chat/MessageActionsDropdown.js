import { useState, useRef, useEffect } from "react";
import "./MessageActionsDropdown.css";

export default function MessageActionsDropdown({
  message,
  onEdit,
  onDelete,
  position = "bottom-right"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isTextMessage = message.message_type === "text";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleEdit = () => {
    setIsOpen(false);
    onEdit(message);
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete(message);
  };

  return (
    <div className="message-actions-container" ref={dropdownRef}>
      <button
        className="message-actions-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Message options"
      >
        ⋮
      </button>

      {isOpen && (
        <div className={`message-actions-dropdown ${position}`}>
          {isTextMessage && (
            <button className="action-item edit" onClick={handleEdit}>
              Edit
            </button>
          )}
          <button className="action-item delete" onClick={handleDelete}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}