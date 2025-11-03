import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "./UserProfile.css";
import DeleteAccount  from '../Components/DeleteAccount';

const Main = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="Main-Page">
      <h1 className="Contact-Title">Welcome to your ChetChat Account {user ? `, ${user.username}` : ''}!</h1>
      <p>
        Still under development, but you can check out the other pages like Contact, Register, and Login.
      </p>

      <button className="custom-button1" onClick={handleLogout}>
        Log Out
      </button>

       <DeleteAccount />

      <button className="custom-button1" onClick={() => navigate('/update')}>
        Update Account Information
      </button>
    </div>
  );
};

export default Main;    