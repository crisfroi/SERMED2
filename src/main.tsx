import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from './contexts/AppContext'
import { AppRouter } from '../packages/hosix/src/components/layout/AppRouter'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <AppRouter />
    </AppProvider>
  </React.StrictMode>,
)
