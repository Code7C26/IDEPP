import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AvisosProvider } from './context/AvisosContext.jsx'
import { SonidoProvider } from './context/SonidoContext.jsx'
import { TemaProvider } from './context/TemaContext.jsx'
import './index.css'

// Los "Provider" envuelven la app para que cualquier página pueda usar la sesión, el tema, los avisos y el sonido
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* future: activa ya el comportamiento de React Router 7 (y saca los avisos en la consola) */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TemaProvider>
        <AuthProvider>
          <AvisosProvider>
            <SonidoProvider>
              <App />
            </SonidoProvider>
          </AvisosProvider>
        </AuthProvider>
      </TemaProvider>
    </BrowserRouter>
  </React.StrictMode>
)
