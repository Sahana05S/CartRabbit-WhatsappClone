import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { E2EEProvider } from './context/E2EEContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <E2EEProvider>
          <SocketProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </SocketProvider>
        </E2EEProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
