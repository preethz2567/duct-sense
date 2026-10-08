import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DemoDataProvider } from './services/DemoDataProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DemoDataProvider>
      <App />
    </DemoDataProvider>
  </StrictMode>,
)
