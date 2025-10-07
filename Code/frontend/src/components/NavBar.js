import { Link } from 'react-router-dom';
import './NavBar.css';


const Navbar = () => {
  return (
    <nav className="main_nav">
      <div className="logo">
        <Link to="/landing">
          <img src="/GiftcordLogo.jpg" alt="GiftcordLogo" className="logo-image" />
        </Link>
      </div>
       
      <Link to="/landing" className="nav-title-link"> 
       <div className="nav-title">Giftcord</div>
      </Link>
      
      <div className="Links">
        <Link to="/contact" className="Text-link">Contact</Link>

        <Link to="/register" className="Text-link">Register</Link>

        <Link to="/login" className="Login-link">
          <button className='button1'>Login</button>
        </Link>

        <p className='name'>Made by Aabaan Samad</p>
        
        
      </div>
    </nav>
  );
};

export default Navbar;