import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Landing from './Pages/Landing';
import Contact from './Pages/Contact';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Navbar from './components/NavBar';
import Delete from './Pages/Delete';
import Main from './Pages/Main';
import Update from './Pages/Update';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const location = useLocation();

  const hideNavbarOnPaths = ['/main', '/update', '/delete'];
  const shouldShowNavbar = !hideNavbarOnPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}

      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/main" element={
          <PrivateRoute>
            <Main />
          </PrivateRoute>
        } />
        
        <Route path="/delete" element={
          <PrivateRoute>
            <Delete />
          </PrivateRoute>
        } />

        <Route path="/update" element={
          <PrivateRoute>
            <Update />
          </PrivateRoute>
        } />
        
        <Route path="*" element={<Navigate to="/landing" />} />
      </Routes>
    </>
  );
}

export default App;
