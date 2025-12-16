/** ABSTRACT: auth-middleware.js
 *  
 *  DESCRIPTION:
 *  Provides middleware for authenticating users via JSON Web Tokens (JWT).
 *  Validates tokens included in the Authorization header and ensures only
 *  authenticated users can access protected routes.
 * 
 *  RESPONSIBILITIES:
 *  - Verify presence and validity of JWT in request headers.
 *  - Decode token to extract user ID and username.
 *  - Attach verified user data to the request object.
 *  - Reject requests with missing, invalid, or expired tokens.
 * 
 *  FUNCTIONS:
 *  - authMiddleware(req, res, next):
 *    Validates a JWT and attaches authenticated user data to the request.
 * 
 *  ASSUMPTIONS:
 *  - JWT_SECRET is defined in environment variables.
 *  - Protected routes apply this middleware before controllers.
 * 
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland  
 * 
 *  END ABSTRACT
 **/

import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
        console.error("FATAL: JWT_SECRET is not defined in environment variables");
        return res.status(500).json({ message: "Server configuration error" });
    }
    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("Auth failed: No valid Bearer token in header");
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log("Auth failed: Token was not provided");
        return res.status(401).json({ message: "Token was not provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            username: decoded.username
        };
        next();
    } catch (err) {
        console.log("Auth failed: JWT verification error:", err.message);
        return res.status(401).json({ message: "Invalid or expired token." });
    }
}