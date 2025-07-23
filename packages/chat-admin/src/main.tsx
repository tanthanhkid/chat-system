import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthWrapper } from './AuthWrapper.tsx'
import './globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthWrapper>
      <App />
    </AuthWrapper>
  </React.StrictMode>,
)