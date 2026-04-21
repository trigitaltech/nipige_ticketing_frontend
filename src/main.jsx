import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.jsx'
import store from './redux/store'
import { TooltipProvider } from '@/components/ui/tooltip'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <TooltipProvider delayDuration={200}>
        <App />
      </TooltipProvider>
    </Provider>
  </StrictMode>,
)
