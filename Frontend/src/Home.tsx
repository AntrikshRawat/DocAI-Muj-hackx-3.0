import { GoogleLogin } from '@react-oauth/google'
import './Home.css'
import { useStore } from './store/useStore'

function Home() {
  const { setUser } = useStore()

  const handleSuccess = async (credentialResponse: any) => {
    console.log('Login Success:', credentialResponse)
    
    if (credentialResponse.credential) {
      try {
        const response = await fetch('http://10.35.157.146:5001/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: credentialResponse.credential
          })
        })

        const {data} = await response.json()
        console.log('API Response:', data)

        if (response.ok) {
          // Handle successful authentication
          console.log('Authentication successful:', data)
          
          // Store user data from API response in Zustand
          setUser({
            email: data.user?.email || data.email || '',
            name: data.user?.name || data.name || '',
            picture: data.user?.picture || data.picture || '',
            token: data.token || credentialResponse.credential,
            id: data.user?.id || data.id || ''
          })
          
          // User will be automatically redirected to chat page by App.tsx
        } else {
          console.error('Authentication failed:', data)
        }
      } catch (error) {
        console.error('Error sending token to API:', error)
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
