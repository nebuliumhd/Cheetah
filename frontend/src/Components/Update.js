// import { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useAuth } from '../context/AuthContext';

// const UpdateAccount = () => {
//   const { user,logout } = useAuth();
//   const [showForm, setShowForm] = useState(false);
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     username: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   });
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//     const handleChange = (e) => {
//         setFormData(prev => ({
//         ...prev,
//         [e.target.name]: e.target.value,
//         }));
//     };

//   const handleUpdate = async (e) => {
//   e.preventDefault();
//   setError('');
//   setSuccess('');

//   try {
//     const body = {};

//     // Only include non-empty fields
//     Object.entries(formData).forEach(([key, value]) => {
//       if (value.trim() !== '') {
//         body[key] = value.trim();
//       }
//     });

    
//     body.id = user?.id;

//     const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
//     const res = await fetch(`${API_BASE}/api/users/update`, {
//       method: 'PATCH', // matches backend route
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(body),
//     });

//     const data = await res.json();

//     if (!res.ok) throw new Error(data.message || 'Failed to update account.');

//     setSuccess('Account updated successfully.');

//     // If password changed, logout user
//     if (body.password) {
//       setTimeout(() => {
//         logout();
//         window.location.href = '/login';
//       }, 2000);
//     }

//   } catch (err) {
//     setError(err.message || 'Error updating account.');
//   }
// };
//   return (
//     <div className="update-section">
//       <button
//         className="custom-button1"
//         onClick={() => setShowForm(!showForm)}
//       >
//         {showForm ? 'Cancel Update' : 'Update Account'}
//       </button>

//       <AnimatePresence>
//         {showForm && (
//           <motion.div
//             className="update-form-container"
//             initial={{ height: 0, opacity: 0 }}
//             animate={{ height: 'auto', opacity: 1 }}
//             exit={{ height: 0, opacity: 0 }}
//             transition={{ duration: 0.3, ease: 'easeInOut' }}
//           >
//             <form onSubmit={handleUpdate} className="update-form">
//               <p>Please update your information below.</p>

//               <label>First Name</label>
//               <input
//                 type="text"
//                 name="firstName"
//                 value={formData.firstName}
//                 onChange={handleChange}
                
//               />

//               <label>Last Name</label>
//               <input
//                 type="text"
//                 name="lastName"
//                 value={formData.lastName}
//                 onChange={handleChange}
                
//               />

//               <label>Username</label>
//               <input
//                 type="text"
//                 name="username"
//                 value={formData.username}
//                 onChange={handleChange}
//               />

//               <label>Email</label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
                
//               />

//               <label>Password</label>
//               <input
//                 type="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 placeholder="Leave blank to keep current password"
//               />

//               <label>Confirm Password</label>
//               <input
//                 type="password"
//                 name="confirmPassword"
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 placeholder="Confirm new password"
//               />

//               <button type="submit" className="custom-button1 update-btn">
//                 Confirm Update
//               </button>

//               {error && <p style={{ color: 'red' }}>{error}</p>}
//               {success && <p style={{ color: 'green' }}>{success}</p>}
//             </form>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default UpdateAccount;