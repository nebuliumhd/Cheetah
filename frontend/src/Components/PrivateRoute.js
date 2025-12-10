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