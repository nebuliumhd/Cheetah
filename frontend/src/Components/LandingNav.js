import { Link } from 'react-router-dom';
import './LandingNav.css';

const Navbar = () => {
  return (
    <nav className="main_nav">
      {/* Logo / Home link */}
      <div className="logo">
        <Link to="/landing"></Link>
      </div>

      {/* Title */}
      <Link to="/landing" className="nav-title-link"> 
        <div className="nav-title">ChetChat</div>
      </Link>

      {/* Right-side links */}
      <div className="Links">
        <Link to="/register" className="Text-link">Register</Link>

        <Link to="/login" className="Login-link">
          <button className='button1'>Login</button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;