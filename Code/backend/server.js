const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const usersRoutes = require('./routes/user-routes');

const app = express();

// Parse incoming JSON
app.use(bodyParser.json());


// Set CORS headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers", 
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});


// Routes
app.use('/api/users', usersRoutes);

// Global error handler
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred' });
});

// MongoDB Connection and Server Start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(3001, () => {
      console.log("Server started on port 3001");
    });
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err);
  });