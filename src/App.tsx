import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './providers/AuthProvider'
import DriverDashboard from './components/dashboards/DriverDashboard'
import CustomerDashboard from './components/dashboards/CustomerDashboard'
import BusinessDashboard from './components/dashboards/BusinessDashboard'
import OwnerDashboard from './components/dashboards/OwnerDashboard'
import CustomerLogin from './components/auth/CustomerLogin'
import DriverLogin from './components/auth/DriverLogin'
import BusinessLogin from './components/auth/BusinessLogin'
import DatabaseSetupNotice from './components/DatabaseSetupNotice'
import UserTypeSelector from './components/UserTypeSelector'
import NotificationSystem from './components/NotificationSystem'
import './index.css'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Landing Page - User Type Selection
const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-xl text-white">🚛</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">FairLoad</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">About</button>
              <button className="text-gray-600 hover:text-gray-900">Contact</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Smart Logistics for
              <span className="text-blue-600"> Everyone</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect customers, drivers, and businesses on India's most transparent delivery platform. 
              Fair pricing, real-time tracking, and pooled deliveries for maximum savings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/customer-login')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Send a Package
              </button>
              <button 
                onClick={() => navigate('/driver-login')}
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Become a Driver
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose FairLoad?</h2>
            <p className="text-gray-600">Built for transparency, efficiency, and fairness</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fair Pricing</h3>
              <p className="text-gray-600">Transparent pricing with no hidden fees. Pool deliveries save up to 40%.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
              <p className="text-gray-600">Track your packages live with GPS updates and delivery notifications.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Trusted Network</h3>
              <p className="text-gray-600">Verified drivers and secure payments for peace of mind.</p>
            </div>
          </div>
        </div>
      </section>

      {/* User Type Selection */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started</h2>
            <p className="text-gray-600">Choose your role to access your dashboard</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Customer Card */}
            <div 
              onClick={() => navigate('/customer-login')}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-white">👤</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Customer</h3>
              <p className="text-gray-600 mb-6">
                Send packages with transparent pricing and real-time tracking.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 mb-6">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Personal & Business deliveries
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Pool delivery savings up to 40%
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Live package tracking
                </li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Continue as Customer
              </button>
            </div>

            {/* Driver Card */}
            <div 
              onClick={() => navigate('/driver-login')}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 hover:border-green-300"
            >
              <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-white">🚗</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Driver</h3>
              <p className="text-gray-600 mb-6">
                Earn money by delivering packages in your area.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 mb-6">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Flexible working hours
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Fair payment system
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Weekly payouts
                </li>
              </ul>
              <button className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
                Become a Driver
              </button>
            </div>

            {/* Business Card */}
            <div 
              onClick={() => navigate('/business-login')}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 hover:border-purple-300"
            >
              <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-white">🏢</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Business</h3>
              <p className="text-gray-600 mb-6">
                Manage enterprise deliveries with advanced features.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 mb-6">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Bulk delivery management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Analytics & reporting
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Priority support
                </li>
              </ul>
              <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                Business Solutions
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">50K+</div>
              <div className="text-blue-100">Active Drivers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">120+</div>
              <div className="text-blue-100">Cities Covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">98.5%</div>
              <div className="text-blue-100">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">2M+</div>
              <div className="text-blue-100">Deliveries Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg text-white">🚛</span>
                </div>
                <span className="text-xl font-bold">FairLoad</span>
              </div>
              <p className="text-gray-400">
                India's most transparent logistics platform connecting customers, drivers, and businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Send Package</li>
                <li>Track Delivery</li>
                <li>Pool Delivery</li>
                <li>Pricing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Drivers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Join as Driver</li>
                <li>Earnings</li>
                <li>Requirements</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FairLoad. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Dashboard Router
const DashboardRouter = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  // Get user type from user object or localStorage
  let userType = user.userType
  if (!userType && user.id) {
    userType = localStorage.getItem(`userType_${user.id}`) as 'B2C' | 'B2B' | 'DRIVER' | 'OWNER'
  }

  console.log('DashboardRouter - User:', user, 'UserType:', userType) // Debug log

  // If still no user type, show selector
  if (!userType) {
    return <UserTypeSelector />
  }

  // Direct navigation based on user type
  switch (userType) {
    case 'B2C':
      return <Navigate to="/customer-dashboard" replace />
    case 'B2B':
      return <Navigate to="/business-dashboard" replace />
    case 'DRIVER':
      return <Navigate to="/driver-dashboard" replace />
    case 'OWNER':
      return <Navigate to="/owner-dashboard" replace />
    default:
      return <UserTypeSelector />
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen">
            <DatabaseSetupNotice />
            <NotificationSystem />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              
              {/* Specific Login Pages */}
              <Route path="/customer-login" element={<CustomerLogin />} />
              <Route path="/driver-login" element={<DriverLogin />} />
              <Route path="/business-login" element={<BusinessLogin />} />
              
              {/* Dashboard Router */}
              <Route path="/dashboard" element={<DashboardRouter />} />
              
              {/* Specific Dashboards */}
              <Route path="/customer-dashboard" element={
                <ProtectedRoute>
                  <CustomerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/business-dashboard" element={
                <ProtectedRoute>
                  <BusinessDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/driver-dashboard" element={
                <ProtectedRoute>
                  <DriverDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/owner-dashboard" element={
                <ProtectedRoute>
                  <OwnerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App