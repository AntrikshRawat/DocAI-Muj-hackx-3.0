import './App.css'
import Home from './Home'
import Chat from './Chat'
import { useStore } from './store/useStore'

function App() {
  const { isAuthenticated } = useStore()

  return (
    <>
      {isAuthenticated ? <Chat /> : <Home />}
    </>
  )
}

export default App
