import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "./UserProfile.css";
import DeleteAccount from '../Components/DeleteAccount';
import UpdateAccount from '../Components/Update';

const UserProfile = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="UserProfile-Page">
      <h1 className="Profile-Title">Welcome to your ChetChat Account!</h1>

      {user ? (
        <div className="user-info">
          <p><strong>First Name:</strong> {user.first_name || '-'}</p>
          <p><strong>Last Name:</strong> {user.last_name || '-'}</p>
          <p><strong>Username:</strong> {user.username || '-'}</p>
          <p><strong>Email:</strong> {user.email || '-'}</p>
        </div>
      ) : (
        <p>Loading user information...</p>
      )}

      <div className="actions">
        <button className="custom-button1" onClick={handleLogout}>Log Out</button>

        <DeleteAccount />
        <UpdateAccount />

        <button className="custom-button1" onClick={() => navigate('/chat')}>Chats</button>
        <button className="custom-button1" onClick={() => navigate('/posts')}>Make a Post</button>
        <button className="custom-button1" onClick={() => navigate('/feed')}>Go to Feed</button>
      </div>
    </div>
  );
};

export default UserProfile;
