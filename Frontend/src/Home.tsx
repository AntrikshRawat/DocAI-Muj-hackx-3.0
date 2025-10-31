import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import './Home.css'
import { useStore } from './store/useStore'

function Home() {
  const { setUser } = useStore();

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleSuccess = async (credentialResponse: any) => {
    console.log('Login Success:', credentialResponse)
    
    if (credentialResponse.credential) {
      try {
        const base = backendUrl;
        const response = await axios.post(`${base}/api/auth/google`, {
          token: credentialResponse.credential,
        })
        const apiBody = response.data
        const data = apiBody?.data ?? apiBody
        console.log('API Response:', data)

        // Store user data from API response in Zustand
        setUser({
          email: data.user?.email || data.email || '',
          name: data.user?.name || data.name || '',
          picture: data.user?.picture || data.picture || '',
          token: data.token || credentialResponse.credential,
          id: data.user?.id || data.id || ''
        })

        // User will be automatically redirected to chat page by App.tsx
      } catch (error: any) {
        // axios throws for non-2xx responses — capture useful info if available
        console.error('Error sending token to API:', error.response?.data ?? error.message ?? error)
      }
    }
  }

  const handleError = () => {
    console.log('Login Failed')
    // Handle login error here
  }

  return (
    <div className="home-container">
      <h1 className="heading">Doc AI</h1>
      <div className="button-container">
        <GoogleLogin
          size='large'
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </div>
  )
}

export default Home
