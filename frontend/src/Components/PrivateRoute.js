/** ABSTRACT: PrivateRoute.js
 *
 *  DESCRIPTION:
 *  Provides a protected route wrapper that restricts access to authenticated users.
 *  Redirects unauthenticated users to the login page and renders child components
 *  only after authentication status is verified.
 *
 *  RESPONSIBILITIES:
 *  - Verify authentication state using AuthContext.
 *  - Display a loading state while authentication is being checked.
 *  - Redirect unauthenticated users to the login page.
 *  - Render protected child components when authenticated.
 *
 *  FUNCTIONS:
 *  - PrivateRoute(children): Conditionally renders children or redirects
 *    based on authentication and loading state.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const PrivateRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  // Wait for auth check to complete
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  // If not logged in after loading completes, redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;