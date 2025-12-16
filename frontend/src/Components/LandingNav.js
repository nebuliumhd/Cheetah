/** ABSTRACT: LandingNav.js
 *
 *  DESCRIPTION:
 *  Implements the navigation bar for the landing page of the application.
 *  Provides quick access to the home/landing page, registration, and login pages.
 *  Ensures consistent styling through external CSS and maintains a responsive,
 *  user-friendly layout.
 *
 *  RESPONSIBILITIES:
 *  - Display the application logo and link it to the landing page.
 *  - Show the application name "ChetChat" with navigation to the landing page.
 *  - Provide navigation buttons/links for user registration and login.
 *  - Maintain a visually consistent, responsive, and accessible header.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland
 *
 *  END ABSTRACT
 **/


import { Link } from "react-router-dom";
import "./LandingNav.css";

const Navbar = () => {
  return (
    <nav className="main_nav">
      <div className="logo">
        <Link to="/landing"></Link>
      </div>

      <div className="nav-title">ChetChat</div>

      <div className="Links">
        <Link to="/register" className="Text-link">
          <button className="register-button">Register</button>
        </Link>

        <Link to="/login" className="Login-link">
          <button className="login-button">Login</button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
