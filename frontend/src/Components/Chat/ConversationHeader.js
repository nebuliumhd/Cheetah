const ConversationHeader = ({ conversation, apiBase }) => {
  if (!conversation) return null;

  const isGroup = conversation.is_group;
  const displayName = conversation.display_name || "Unknown";
  
  // Use profile_picture for 1:1 chats
  const profilePicUrl = !isGroup && conversation.profile_picture
    ? `${apiBase}${conversation.profile_picture}`
    : `${apiBase}/uploads/profiles/default-profile.jpg`;

  return (
    <div className="conversation-header">
      {!isGroup && (
        <img 
          src={profilePicUrl}
          alt={displayName}
          className="conversation-header-avatar"
          onError={(e) => {
            e.target.src = `${apiBase}/uploads/profiles/default-profile.jpg`;
          }}
        />
      )}
      {isGroup && <span className="conversation-header-icon">👥</span>}
      <h2>{displayName}</h2>
      {isGroup && conversation.participant_ids && (
        <span className="member-count">
          {conversation.participant_ids.length} members
        </span>
      )}
    </div>
  );
};

export default ConversationHeader;