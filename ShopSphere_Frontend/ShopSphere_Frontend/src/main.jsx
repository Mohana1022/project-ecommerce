import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './Store.js'
import "./index.css";
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { VendorRegistrationProvider } from './context/VendorRegistrationContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
        <VendorRegistrationProvider>
          <App />
        </VendorRegistrationProvider>
      </GoogleOAuthProvider>
    </Provider>
  </StrictMode>,
);
