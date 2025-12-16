/** ABSTRACT: MessageActionsDropdown.js
 *
 *  DESCRIPTION:
 *  Provides a contextual dropdown menu for message-level actions in the chat interface.
 *  Enables users to edit or delete messages and handles UI interactions such as
 *  automatic closing when clicking outside the dropdown. Supports configurable
 *  dropdown positioning and accessibility via button semantics.
 *
 *  RESPONSIBILITIES:
 *  - Render a dropdown trigger for each message.
 *  - Display action options conditionally (Edit only for text messages).
 *  - Call parent-provided handlers for edit and delete actions.
 *  - Close the dropdown when user clicks outside the component.
 *  - Support multiple positioning presets (bottom-right, top-left, etc.).
 *  - Ensure accessible button usage and tooltips.
 *
 *  FUNCTIONS:
 *  - MessageActionsDropdown(props):
 *      Main component function; manages dropdown open/close state and renders UI.
 *
 *  - handleClickOutside(event):
 *      Internal function registered via useEffect to detect clicks outside
 *      the dropdown and automatically close it.
 *
 *  - handleEdit():
 *      Closes dropdown and calls parent onEdit handler with the current message.
 *
 *  - handleDelete():
 *      Closes dropdown and calls parent onDelete handler with the current message.
 *
 *  HOOKS / STATE:
 *  - useState(isOpen):
 *      Tracks whether the dropdown is open or closed.
 *
 *  - useRef(dropdownRef):
 *      References the dropdown DOM element for outside click detection.
 *
 *  - useEffect():
 *      Sets up and cleans up event listener for detecting clicks outside the dropdown.
 *
 *  ASSUMPTIONS:
 *  - The parent component provides valid onEdit and onDelete functions.
 *  - The message object includes a `message_type` property.
 *  - Dropdown positioning is controlled via CSS classes (position prop).
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland
 *
 *  END ABSTRACT
 **/


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