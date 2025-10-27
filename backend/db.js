import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Make sure this is always ran first
dotenv.config();

export const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

//export async function getAllUsers() {
//     try {
//         const [results, fields] = await pool.query('SELECT * FROM users');
//         console.log("Results:", results);
//         console.log("Fields:", fields);
//     } catch (err) {
//         console.error(err);
//     }
// }