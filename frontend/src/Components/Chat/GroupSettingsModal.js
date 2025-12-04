import { useState, useEffect, useCallback, useRef } from "react";
import AsyncSelect from "react-select/async";
import "../../App.css";
import "./GroupSettingsModal.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function GroupSettingsModal({
  conversation,
  currentUserId,
  onClose,
  onGroupNameUpdated,
  onParticipantsChanged,
}) {
  const [participants, setParticipants] = useState([]);
  const [groupName, setGroupName] = useState(conversation?.group_name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createdBy, setCreatedBy] = useState(conversation?.created_by || null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState(null);

  const isCreator = createdBy === currentUserId;
  const token = localStorage.getItem("token");
  const participantUpdateTimeoutRef = useRef(null);

  const loadParticipants = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/chat/group/${conversation.id}/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to load participants");

      const data = await res.json();
      setParticipants(data.participants || []);

      if (data.created_by) {
        setCreatedBy(data.created_by);
      }

      // Debounce parent callback to prevent rapid re-renders
      if (onParticipantsChanged) {
        if (participantUpdateTimeoutRef.current) {
          clearTimeout(participantUpdateTimeoutRef.current);
        }
        
        participantUpdateTimeoutRef.current = setTimeout(() => {
          onParticipantsChanged(data.participants?.length || 0);
        }, 300);
      }
    } catch (err) {
      console.error("Error loading participants:", err);
    } finally {
      setLoading(false);
    }
  }, [conversation.id, token, onParticipantsChanged]);

  useEffect(() => {
    loadParticipants();
    
    return () => {
      if (participantUpdateTimeoutRef.current) {
        clearTimeout(participantUpdateTimeoutRef.current);
      }
    };
  }, [loadParticipants]);

  const handleRemoveParticipant = async (username) => {
    if (!window.confirm(`Remove ${username} from this group?`)) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/chat/group/${conversation.id}/remove/${username}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to remove participant");

      // Optimistic update
      setParticipants((prev) => {
        const updated = prev.filter((p) => p.username !== username);
        
        // Notify parent with new count
        if (onParticipantsChanged) {
          if (participantUpdateTimeoutRef.current) {
            clearTimeout(participantUpdateTimeoutRef.current);
          }
          participantUpdateTimeoutRef.current = setTimeout(() => {
            onParticipantsChanged(updated.length);
          }, 300);
        }
        
        return updated;
      });
    } catch (err) {
      console.error("Error removing participant:", err);
      alert("Failed to remove participant");
      // Reload on error
      loadParticipants();
    }
  };

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) {
      alert("Group name cannot be empty");
      return;
    }

    if (groupName.trim() === conversation.group_name) {
      setIsEditingName(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/chat/group/${conversation.id}/name`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ groupName: groupName.trim() }),
        }
      );

      if (!res.ok) throw new Error("Failed to update group name");

      setIsEditingName(false);

      if (onGroupNameUpdated) {
        onGroupNameUpdated(groupName.trim());
      }
    } catch (err) {
      console.error("Error updating group name:", err);
      alert("Failed to update group name");
    }
  };

  const loadOptions = async (inputValue) => {
    if (!inputValue.trim()) return [];

    try {
      const res = await fetch(
        `${API_BASE}/api/chat/search-users?q=${encodeURIComponent(inputValue)}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to search users");

      const data = await res.json();

      const participantUsernames = participants.map((p) =>
        p.username.toLowerCase()
      );
      const filtered = (data.users || []).filter(
        (user) => !participantUsernames.includes(user.value.toLowerCase())
      );

      return filtered;
    } catch (err) {
      console.error("Error searching users:", err);
      return [];
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserToAdd) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/chat/group/${conversation.id}/add-participants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ usernames: [selectedUserToAdd.value] }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add user");
      }

      // Close modal immediately
      setShowAddUserModal(false);
      setSelectedUserToAdd(null);
      
      // Reload participants (debounced notification)
      await loadParticipants();
    } catch (err) {
      console.error("Error adding user:", err);
      alert(`Failed to add user to group: ${err.message}`);
    }
  };

  return (
    <div className="group-settings-overlay" onClick={onClose}>
      <div className="group-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="group-settings-header">
          <h2 className="group-settings-title">Group Settings</h2>
          <button onClick={onClose} className="group-settings-close-btn" title="Close">
            ×
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="group-settings-content">
          {/* Group Name Section */}
          <div className="group-name-section">
            <label className="group-name-label">Group Name</label>
            {isEditingName && isCreator ? (
              <div className="group-name-edit-container">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="group-name-input"
                  autoFocus
                />
                <button onClick={handleUpdateGroupName} className="group-name-save-btn">
                  Save
                </button>
                <button
                  onClick={() => {
                    setGroupName(conversation.group_name);
                    setIsEditingName(false);
                  }}
                  className="group-name-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="group-name-display">
                <span className="group-name-text">{groupName}</span>
                {isCreator && (
                  <button onClick={() => setIsEditingName(true)} className="group-name-edit-btn">
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Members Section */}
          <div className="members-section">
            <label className="members-label">Members ({participants.length})</label>

            {loading ? (
              <p className="members-loading">Loading members...</p>
            ) : (
              <div className="members-list">
                {participants.map((participant) => {
                  const isCurrentUser = participant.user_id === currentUserId;
                  const isParticipantCreator = participant.user_id === conversation.created_by;

                  return (
                    <div key={participant.user_id} className="participant-item">
                      <img
                        src={
                          participant.profile_picture
                            ? `${API_BASE}${participant.profile_picture}`
                            : `${API_BASE}/uploads/profiles/default-profile.jpg`
                        }
                        alt={participant.username}
                        className="participant-avatar"
                        onError={(e) => {
                          if (e.target.src !== `${API_BASE}/uploads/profiles/default-profile.jpg`) {
                            e.target.src = `${API_BASE}/uploads/profiles/default-profile.jpg`;
                          }
                        }}
                      />

                      <div className="participant-info">
                        <span className="participant-username">
                          {participant.username}
                          {isCurrentUser && (
                            <span className="participant-you-label">(You)</span>
                          )}
                        </span>
                      </div>

                      {isParticipantCreator && (
                        <span className="participant-creator-icon" title="Group Creator">
                          👑
                        </span>
                      )}

                      {isCreator && !isCurrentUser && !isParticipantCreator && (
                        <button
                          onClick={() => handleRemoveParticipant(participant.username)}
                          className="participant-remove-btn"
                          title="Remove from group"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add User Button */}
                {isCreator && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddUserModal(true);
                    }}
                    className="add-user-button"
                  >
                    <img
                      src={`${API_BASE}/uploads/profiles/default-profile.jpg`}
                      alt="Add user"
                      className="add-user-avatar"
                    />

                    <div className="add-user-info">
                      <span className="add-user-text">Add user...</span>
                    </div>

                    <span className="add-user-icon">+</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="group-settings-footer">
          <button onClick={onClose} className="group-settings-done-btn">
            Done
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div
          className="add-user-modal-overlay"
          onClick={() => {
            setShowAddUserModal(false);
            setSelectedUserToAdd(null);
          }}
        >
          <div className="add-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-user-modal-header">
              <h3 className="add-user-modal-title">Add User to Group</h3>
              <AsyncSelect
                cacheOptions
                loadOptions={loadOptions}
                value={selectedUserToAdd}
                onChange={setSelectedUserToAdd}
                placeholder="Search for users..."
                styles={{
                  container: (base) => ({ ...base, marginBottom: "0" }),
                }}
                autoFocus
              />
            </div>

            <div className="add-user-modal-footer">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setSelectedUserToAdd(null);
                }}
                className="add-user-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={!selectedUserToAdd}
                className="add-user-modal-add-btn"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}