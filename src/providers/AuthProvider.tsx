import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from '../config/firebase'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  userType: 'CUSTOMER' | 'DRIVER' | 'BUSINESS' | 'ADMIN'
  companyName?: string
  vehicleType?: string
  vehicleNumber?: string
  isVerified: boolean
  isActive: boolean
}

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  token: string | null
}

interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
  userType: 'CUSTOMER' | 'DRIVER' | 'BUSINESS'
  companyName?: string
  vehicleType?: string
  vehicleNumber?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  // Demo mode user validation - works without server
  const validateUserWithServer = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken()
      setToken(idToken)
      
      // Check localStorage for existing user data
      const storedUser = localStorage.getItem(`user_${firebaseUser.uid}`)
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        console.log('✅ User loaded from localStorage (demo mode)')
        return
      }
      
      // Create a basic user profile for new Firebase users
      const basicUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        phone: firebaseUser.phoneNumber || '',
        userType: 'CUSTOMER' as const,
        companyName: undefined,
        vehicleType: undefined,
        vehicleNumber: undefined,
        isVerified: firebaseUser.emailVerified,
        isActive: true
      }
      
      setUser(basicUser)
      localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify(basicUser))
      console.log('✅ Created basic user profile for Firebase user (demo mode)')
      
    } catch (error) {
      console.error('User validation failed:', error)
      // Don't fail completely - create offline user
      const offlineUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'User',
        phone: '',
        userType: 'CUSTOMER' as const,
        companyName: undefined,
        vehicleType: undefined,
        vehicleNumber: undefined,
        isVerified: false,
        isActive: true
      }
      setUser(offlineUser)
      setToken(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      
      if (firebaseUser) {
        try {
          await validateUserWithServer(firebaseUser)
        } catch (error) {
          // Don't force logout - user validation failed but Firebase auth is working
          console.log('User validation failed, but keeping Firebase session:', error)
          // Create minimal user for demo mode
          const minimalUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            phone: '',
            userType: 'CUSTOMER' as const,
            companyName: undefined,
            vehicleType: undefined,
            vehicleNumber: undefined,
            isVerified: false,
            isActive: true
          }
          setUser(minimalUser)
        }
      } else {
        setUser(null)
        setToken(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true)
      
      // Create Firebase user first
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      )

      // Create user object immediately for demo mode
      const newUser = {
        id: firebaseUser.uid,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        userType: userData.userType,
        companyName: userData.companyName,
        vehicleType: userData.vehicleType,
        vehicleNumber: userData.vehicleNumber,
        isVerified: false,
        isActive: true
      }

      // Set user data immediately for demo mode
      setUser(newUser)
      
      // Store in localStorage for persistence in demo mode
      localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify(newUser))

      toast.success('Account created successfully!')
      
    } catch (error: any) {
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please sign in instead.')
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password should be at least 6 characters long.')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address.')
      } else {
        toast.error(error.message || 'Registration failed')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('Login successful!')
    } catch (error: any) {
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email. Please register first.')
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password. Please try again.')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address.')
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.')
      } else {
        toast.error(error.message || 'Login failed')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setToken(null)
      toast.success('Logged out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Logout failed')
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email address.')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address.')
      } else {
        toast.error(error.message || 'Failed to send reset email')
      }
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      login,
      register,
      logout,
      resetPassword,
      token
    }}>
      {children}
    </AuthContext.Provider>
  )
}