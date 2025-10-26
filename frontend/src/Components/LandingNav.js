import { Link } from 'react-router-dom';
import './LandingNav.css';


const Navbar = () => {
  return (
    <nav className="main_nav">
      <div className="logo">
        <Link to="/landing">
        </Link>
      </div>
       
      <Link to="/landing" className="nav-title-link"> 
       <div className="nav-title">ChetChat</div>
      </Link>
      
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