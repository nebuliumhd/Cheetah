/** ABSTRACT: db.js
 *  
 *  DESCRIPTION:
 *  Configures and exports a MySQL connection pool using mysql2 with async/await support.
 *  Loads environment variables via dotenv to securely manage database credentials.
 *  Ensures efficient connection handling through pooling for scalability and performance.
 * 
 *  RESPONSIBILITIES:
 *  - Load environment variables using dotenv.
 *  - Configure a MySQL connection pool with host, user, password, database, and port.
 *  - Set connection pool options such as connection limit and queue behavior.
 *  - Export the configured pool for use across the application.
 * 
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland
 *  PROGRAMMER: Aabaan Samad
 * 
 *  END ABSTRACT
 **/
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Make sure this is always ran first
dotenv.config();

export const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})