import { createRoot } from 'react-dom/client'
import './utils/rechartsWarningFix' // Load first to catch warnings early
import App from './App.tsx'
import './index.css'
import './utils/suppressRechartsWarnings'
import './utils/errorDebugger'

createRoot(document.getElementById("root")!).render(<App />);
