import {Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './Pages/Landing';
import Login from './Pages/Login';
import Register from './Pages/Register';
import LandingNav from './Components/LandingNav';
// import other components as needed

function App() {
  const location = useLocation();

  const hideNavbarOnPaths = ['/main', '/update', '/delete', '/register', '/login'];
  const shouldShowNavbar = !hideNavbarOnPaths.includes(location.pathname);
  return (
    <>
    {shouldShowNavbar && <LandingNav />}

    
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Add other routes here */}
        <Route path="*" element={<Navigate to="/landing" />} />
      </Routes>
    </>

  );
}

export default App;
