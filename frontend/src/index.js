/** ABSTRACT: index.js
 *  
 *  DESCRIPTION:
 *  Entry point for the React frontend application.
 *  Initializes the React app, wraps it with necessary providers, and mounts
 *  it to the DOM. Supports routing through BrowserRouter and authentication
 *  state through AuthProvider. Optionally allows performance measurement.
 *
 *  RESPONSIBILITIES:
 *  - Start React and render the App component.
 *  - Wrap the App with BrowserRouter for client-side routing.
 *  - Provide global authentication context using AuthProvider.
 *  - Optionally enable performance monitoring with reportWebVitals.
 *
 *  FUNCTIONS:
 *  - root.render(): Mounts the application to the root DOM element.
 *  - reportWebVitals(): Optional function to measure app performance.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
