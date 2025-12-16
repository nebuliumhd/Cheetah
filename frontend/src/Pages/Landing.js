/** ABSTRACT: Landing.js
 *  
 *  DESCRIPTION:
 *  Defines the landing page component that introduces users to ChetChat.
 *  Displays an overview of the app’s features and provides navigation 
 *  to either registration or chat based on authentication status.
 * 
 *  RESPONSIBILITIES:
 *  - Display introductory text and call-to-action for new and returning users.
 *  - Check authentication state using AuthContext.
 *  - Redirect logged-in users to the chat or profile page.
 *  - Redirect new users to the registration page.
 *  - Provide a visually appealing landing interface through styled components.
 *
 *  FUNCTIONS:
 *  - LandingPage(): Main functional component responsible for rendering the
 *    landing page UI and coordinating navigation logic.
 *  - handleGetStarted(): Determines navigation behavior based on authentication
 *    status and redirects users to the appropriate page.
 * 
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland
 *  PROGRAMMER: Aabaan Samad
 * 
 *  END ABSTRACT
 **/


import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../App.css";
import "./Landing.css";

const LandingPage = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate("/profile");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="BackgroundDiv">
      <div className="MainDiv">
        <div className="TextDiv">
          <h1 className="Title">Welcome to ChetChat!</h1>

          <p className="Body">
            Connect with friends, join communities, and explore your own feed!
            ChetChat lets you chat, send friend requests, talk to friends, and
            view a public feed all in one place. Join now and become an chetter!
          </p>

          <button className="Landing-Button" onClick={handleGetStarted}>
            Get Started!
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
