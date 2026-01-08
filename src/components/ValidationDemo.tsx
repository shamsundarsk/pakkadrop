import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneNumberInput from './shared/PhoneNumberInput'
import VehicleNumberInput from './shared/VehicleNumberInput'
import { userRegistrationService } from '../services/userRegistrationService'
import { ArrowLeft, CheckCircle, XCircle, Users, AlertTriangle } from 'lucide-react'

const ValidationDemo = () => {
  const navigate = useNavigate()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [validationResults, setValidationResults] = useState<{
    phone: boolean | null
    vehicle: boolean | null
  }>({ phone: null, vehicle: null })
  const [registrationStats, setRegistrationStats] = useState(userRegistrationService.getStats())

  // Update stats when component mounts
  React.useEffect(() => {
    setRegistrationStats(userRegistrationService.getStats())
  }, [])

  const validateInputs = () => {
    const phoneValid = phoneNumber && phoneNumber.includes('+') && phoneNumber.length >= 12
    const vehicleValid = vehicleNumber && (
      /^[A-Z]{2,3}\s+\d{2}\s+[A-Z]{1,2}\s+\d{4}$/.test(vehicleNumber.toUpperCase()) ||
      /^\d{2}\s+BH\s+\d{4}\s+[A-Z]{2}$/.test(vehicleNumber.toUpperCase())
    )
    
    setValidationResults({
      phone: phoneValid,
      vehicle: vehicleValid
    })
  }

  const addTestData = () => {
    try {
      // Add some test users to demonstrate duplicate checking
      const testUsers = [
        {
          id: 'test1',
          email: 'test.driver@example.com',
          phone: '+91 9876543210',
          vehicleNumber: 'MH 01 AB 1234',
          userType: 'DRIVER' as const,
          name: 'Test Driver 1'
        },
        {
          id: 'test2',
          email: 'test.customer@example.com',
          phone: '+91 8765432109',
          vehicleNumber: undefined,
          userType: 'CUSTOMER' as const,
          name: 'Test Customer 1'
        },
        {
          id: 'test3',
          email: 'test.driver2@example.com',
          phone: '+91 7654321098',
          vehicleNumber: 'DL 05 CD 5678',
          userType: 'DRIVER' as const,
          name: 'Test Driver 2'
        }
      ]

      testUsers.forEach(user => {
        try {
          userRegistrationService.registerUser(user)
        } catch (error) {
          // User might already exist, ignore
        }
      })

      setRegistrationStats(userRegistrationService.getStats())
      alert('Test data added! Now try entering the same phone numbers or vehicle numbers to see duplicate detection.')
    } catch (error) {
      console.error('Error adding test data:', error)
    }
  }

  const clearTestData = () => {
    userRegistrationService.clearAll()
    setRegistrationStats(userRegistrationService.getStats())
    alert('All test data cleared!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-slate-600 hover:text-slate-900 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Input Validation Demo</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Enhanced Input Validation</h2>
                <p className="text-slate-600">
                  Test our enhanced phone number and vehicle number validation with duplicate checking, country codes, and Indian vehicle formats.
                </p>
              </div>
              
              {/* Registration Stats */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Registered Users</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total: <span className="font-medium">{registrationStats.total}</span></div>
                  <div>Drivers: <span className="font-medium">{registrationStats.drivers}</span></div>
                  <div>Customers: <span className="font-medium">{registrationStats.customers}</span></div>
                  <div>With Vehicles: <span className="font-medium">{registrationStats.withVehicles}</span></div>
                </div>
              </div>
            </div>
            
            {/* Test Data Controls */}
            <div className="mt-4 flex space-x-2">
              <button
                onClick={addTestData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Add Test Data
              </button>
              <button
                onClick={clearTestData}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Clear All Data
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Phone Number Validation */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Phone Number Validation</h3>
              <PhoneNumberInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                required
                placeholder="Enter your phone number"
              />
              {validationResults.phone !== null && (
                <div className={`mt-2 flex items-center space-x-2 ${
                  validationResults.phone ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResults.phone ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {validationResults.phone ? 'Valid phone number format' : 'Invalid phone number format'}
                  </span>
                </div>
              )}
            </div>

            {/* Vehicle Number Validation */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Vehicle Number Validation</h3>
              <VehicleNumberInput
                value={vehicleNumber}
                onChange={setVehicleNumber}
                required
                placeholder="Enter vehicle number"
              />
              {validationResults.vehicle !== null && (
                <div className={`mt-2 flex items-center space-x-2 ${
                  validationResults.vehicle ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResults.vehicle ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {validationResults.vehicle ? 'Valid vehicle number format' : 'Invalid vehicle number format'}
                  </span>
                </div>
              )}
            </div>

            {/* Test Button */}
            <div className="pt-6 border-t border-slate-200">
              <button
                onClick={validateInputs}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Validate Inputs
              </button>
            </div>

            {/* Test Cases */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 mb-4">✨ New Features</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-red-700 mb-2">🚫 Duplicate Prevention:</h5>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Phone numbers cannot be registered twice</li>
                    <li>• Vehicle numbers cannot be registered by multiple drivers</li>
                    <li>• Real-time duplicate checking as you type</li>
                    <li>• Shows who already registered the number</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-green-700 mb-2">🔍 Phone Number Search:</h5>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Click country dropdown and type "t" to find Turkey, Thailand, etc.</li>
                    <li>• Search by country name, code, or dial code</li>
                    <li>• No more scrolling through long lists!</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-green-700 mb-2">🚗 Auto-Format Vehicle Numbers:</h5>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Type "MH01AB1234" → Auto-formats to "MH 01 AB 1234"</li>
                    <li>• Type "21BH1234AB" → Auto-formats to "21 BH 1234 AB"</li>
                    <li>• No manual spacing required!</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-green-700 mb-2">🔍 State Search:</h5>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Click state dropdown and type "m" to find Maharashtra, MP, etc.</li>
                    <li>• Search by state name or code</li>
                    <li>• Quick selection without scrolling!</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Duplicate Testing */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-red-900">Test Duplicate Detection</h4>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-red-800">
                  Click "Add Test Data" above, then try entering these numbers to see duplicate detection:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-red-700 mb-1">Test Phone Numbers:</h5>
                    <ul className="text-red-600 space-y-1 font-mono">
                      <li>+91 9876543210 (Test Driver 1)</li>
                      <li>+91 8765432109 (Test Customer 1)</li>
                      <li>+91 7654321098 (Test Driver 2)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-red-700 mb-1">Test Vehicle Numbers:</h5>
                    <ul className="text-red-600 space-y-1 font-mono">
                      <li>MH 01 AB 1234 (Test Driver 1)</li>
                      <li>DL 05 CD 5678 (Test Driver 2)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Cases */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Test Examples</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-slate-700 mb-2">Valid Phone Numbers:</h5>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• +91 9876543210 (India)</li>
                    <li>• +1 5551234567 (US/Canada)</li>
                    <li>• +44 7700900123 (UK)</li>
                    <li>• +971 501234567 (UAE)</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-slate-700 mb-2">Valid Vehicle Numbers:</h5>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• MH 01 AB 1234 (Maharashtra)</li>
                    <li>• DL 05 CD 5678 (Delhi)</li>
                    <li>• KA 03 EF 9012 (Karnataka)</li>
                    <li>• 21 BH 1234 AB (All-India BH Series)</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-slate-700 mb-2">Try Auto-Formatting (Vehicle):</h5>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Type: <code className="bg-white px-1 rounded">MH01AB1234</code> → Gets formatted to: <code className="bg-white px-1 rounded">MH 01 AB 1234</code></li>
                    <li>• Type: <code className="bg-white px-1 rounded">21BH1234AB</code> → Gets formatted to: <code className="bg-white px-1 rounded">21 BH 1234 AB</code></li>
                    <li>• Type: <code className="bg-white px-1 rounded">DL05CD5678</code> → Gets formatted to: <code className="bg-white px-1 rounded">DL 05 CD 5678</code></li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-slate-700 mb-2">Try Search (Phone & Vehicle):</h5>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Phone: Click dropdown, type "ind" to find India</li>
                    <li>• Phone: Type "uk" to find United Kingdom</li>
                    <li>• Vehicle: Click state dropdown, type "mah" to find Maharashtra</li>
                    <li>• Vehicle: Type "del" to find Delhi</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Current Values Display */}
            {(phoneNumber || vehicleNumber) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Current Values:</h4>
                <div className="space-y-2 text-sm">
                  {phoneNumber && (
                    <div>
                      <span className="font-medium text-blue-800">Phone:</span>
                      <span className="ml-2 font-mono text-blue-700">{phoneNumber}</span>
                    </div>
                  )}
                  {vehicleNumber && (
                    <div>
                      <span className="font-medium text-blue-800">Vehicle:</span>
                      <span className="ml-2 font-mono text-blue-700">{vehicleNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ValidationDemo