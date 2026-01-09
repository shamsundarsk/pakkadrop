import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import PhoneNumberInput from '../shared/PhoneNumberInput'
import VehicleNumberInput from '../shared/VehicleNumberInput'
import toast from 'react-hot-toast'

const DriverLogin = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleType: '',
    vehicleNumber: ''
  })
  
  const { login, register, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Additional validation for registration
    if (!isLogin) {
      // Validate phone number format
      if (!formData.phone || !formData.phone.includes('+')) {
        toast.error('Please select a valid country code and enter your phone number')
        return
      }
      
      // Validate vehicle number format for drivers
      if (!formData.vehicleNumber) {
        toast.error('Please enter a valid vehicle number')
        return
      }
      
      // Check if vehicle number matches Indian format
      const vehiclePattern = /^[A-Z]{2,3}\s+\d{2}\s+[A-Z]{1,2}\s+\d{4}$|^\d{2}\s+BH\s+\d{4}\s+[A-Z]{2}$/
      if (!vehiclePattern.test(formData.vehicleNumber.toUpperCase())) {
        toast.error('Please enter a valid Indian vehicle number (e.g., MH 01 AB 1234)')
        return
      }
    }
    
    try {
      if (isLogin) {
        await login(email, password)
        // Navigate to driver dashboard after successful login
        setTimeout(() => navigate('/driver-dashboard'), 500)
      } else {
        await register({
          ...formData,
          email,
          password,
          userType: 'DRIVER'
        })
        // Navigate to driver dashboard after successful registration
        setTimeout(() => navigate('/driver-dashboard'), 500)
      }
    } catch (error) {
      // Error handled in AuthProvider
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">🚗</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Driver {isLogin ? 'Login' : 'Registration'}</h2>
            <p className="text-slate-600 mt-2">
              {isLogin ? 'Welcome back! Start earning today' : 'Join our driver community'}
            </p>
          </div>

          {/* Toggle Login/Register */}
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                !isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Join as Driver
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <PhoneNumberInput
                  value={formData.phone}
                  onChange={(phone) => setFormData({ ...formData, phone })}
                  required
                  className="mb-4"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select your vehicle</option>
                    <option value="bike">Bike/Motorcycle</option>
                    <option value="auto">Auto Rickshaw</option>
                    <option value="mini-truck">Mini Truck (Tata Ace)</option>
                    <option value="pickup">Pickup Truck</option>
                    <option value="truck">Large Truck</option>
                    <option value="tempo">Tempo Traveller</option>
                  </select>
                </div>
                <VehicleNumberInput
                  value={formData.vehicleNumber}
                  onChange={(vehicleNumber) => setFormData({ ...formData, vehicleNumber })}
                  required
                  className="mb-4"
                />
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Driver Benefits</p>
                    <ul className="text-xs text-green-700 mt-1 space-y-1">
                      <li>• Flexible working hours</li>
                      <li>• Fair payment system</li>
                      <li>• No hidden charges</li>
                      <li>• Weekly payouts</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Join as Driver')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            <p>
              {isLogin ? "New driver? " : "Already registered? "}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-green-600 hover:text-green-500 font-medium"
              >
                {isLogin ? 'Join now' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverLogin