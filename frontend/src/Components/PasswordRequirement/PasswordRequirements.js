// import { useState } from "react";
// import { Eye, EyeOff } from "lucide-react";

// export default function PasswordValidator({ onChange }) {
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   // Validation states
//   const [minLength, setMinLength] = useState(false);
//   const [hasUppercase, setHasUppercase] = useState(false);
//   const [hasLowercase, setHasLowercase] = useState(false);
//   const [hasNumber, setHasNumber] = useState(false);
//   const [hasSpecialChar, setHasSpecialChar] = useState(false);

//   const handlePassword = (e) => {
//     const value = e.target.value;
//     setPassword(value);

//     // Run validations
//     setMinLength(value.length >= 8);
//     setHasUppercase(/[A-Z]/.test(value));
//     setHasLowercase(/[a-z]/.test(value));
//     setHasNumber(/[0-9]/.test(value));
//     setHasSpecialChar(/[^A-Za-z0-9]/.test(value));

//     // Send password + validation result to parent
//     const isValid =
//       value.length >= 8 &&
//       /[A-Z]/.test(value) &&
//       /[a-z]/.test(value) &&
//       /[0-9]/.test(value) &&
//       /[^A-Za-z0-9]/.test(value);

//     if (onChange) onChange(value, isValid);
//   };

//   return (
//     <div style={{ width: "100%", maxWidth: "400px" }}>
//       {/* Password Input */}
//       <div style={{ position: "relative" }}>
//         <input
//           type={showPassword ? "text" : "password"}
//           value={password}
//           onChange={handlePassword}
//           placeholder="Enter your password"
//           style={{
//             width: "100%",
//             padding: "12px 40px 12px 12px",
//             border: "1px solid #ccc",
//             borderRadius: "8px",
//             fontSize: "16px",
//           }}
//         />

//         {/* Eye Icon */}
//         <span
//           onClick={() => setShowPassword(!showPassword)}
//           style={{
//             position: "absolute",
//             right: "10px",
//             top: "50%",
//             transform: "translateY(-50%)",
//             cursor: "pointer",
//           }}
//         >
//           {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//         </span>
//       </div>

//       {/* Validation List */}
//       <ul style={{ marginTop: "12px", listStyle: "none", padding: 0 }}>
//         <ValidationItem label="At least 8 characters" valid={minLength} />
//         <ValidationItem label="One uppercase letter (A-Z)" valid={hasUppercase} />
//         <ValidationItem label="One lowercase letter (a-z)" valid={hasLowercase} />
//         <ValidationItem label="One number (0-9)" valid={hasNumber} />
//         <ValidationItem label="One special character (!@#$...)" valid={hasSpecialChar} />
//       </ul>
//     </div>
//   );
// }

// function ValidationItem({ label, valid }) {
//   return (
//     <li
//       style={{
//         color: valid ? "green" : "red",
//         fontSize: "15px",
//         marginBottom: "4px",
//         display: "flex",
//         alignItems: "center",
//         gap: "6px",
//       }}
//     >
//       <span>{valid ? "✔" : "✖"}</span> {label}
//     </li>
//   );
// }
