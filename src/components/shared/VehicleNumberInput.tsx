import React, { useState } from 'react'
import { ChevronDown, Info, AlertCircle, CheckCircle } from 'lucide-react'
import { userRegistrationService } from '../../services/userRegistrationService'

interface StateCode {
  state: string
  code: string
  example: string
}

const indianStateCodes: StateCode[] = [
  { state: 'Andhra Pradesh', code: 'AP', example: 'AP 01 AB 1234' },
  { state: 'Arunachal Pradesh', code: 'AR', example: 'AR 01 AB 1234' },
  { state: 'Assam', code: 'AS', example: 'AS 01 AB 1234' },
  { state: 'Bihar', code: 'BR', example: 'BR 01 AB 1234' },
  { state: 'Chhattisgarh', code: 'CG', example: 'CG 01 AB 1234' },
  { state: 'Goa', code: 'GA', example: 'GA 01 AB 1234' },
  { state: 'Gujarat', code: 'GJ', example: 'GJ 01 AB 1234' },
  { state: 'Haryana', code: 'HR', example: 'HR 01 AB 1234' },
  { state: 'Himachal Pradesh', code: 'HP', example: 'HP 01 AB 1234' },
  { state: 'Jharkhand', code: 'JH', example: 'JH 01 AB 1234' },
  { state: 'Karnataka', code: 'KA', example: 'KA 01 AB 1234' },
  { state: 'Kerala', code: 'KL', example: 'KL 01 AB 1234' },
  { state: 'Madhya Pradesh', code: 'MP', example: 'MP 01 AB 1234' },
  { state: 'Maharashtra', code: 'MH', example: 'MH 01 AB 1234' },
  { state: 'Manipur', code: 'MN', example: 'MN 01 AB 1234' },
  { state: 'Meghalaya', code: 'ML', example: 'ML 01 AB 1234' },
  { state: 'Mizoram', code: 'MZ', example: 'MZ 01 AB 1234' },
  { state: 'Nagaland', code: 'NL', example: 'NL 01 AB 1234' },
  { state: 'Odisha', code: 'OD', example: 'OD 01 AB 1234' },
  { state: 'Punjab', code: 'PB', example: 'PB 01 AB 1234' },
  { state: 'Rajasthan', code: 'RJ', example: 'RJ 01 AB 1234' },
  { state: 'Sikkim', code: 'SK', example: 'SK 01 AB 1234' },
  { state: 'Tamil Nadu', code: 'TN', example: 'TN 01 AB 1234' },
  { state: 'Telangana', code: 'TS', example: 'TS 01 AB 1234' },
  { state: 'Tripura', code: 'TR', example: 'TR 01 AB 1234' },
  { state: 'Uttar Pradesh', code: 'UP', example: 'UP 01 AB 1234' },
  { state: 'Uttarakhand', code: 'UK', example: 'UK 01 AB 1234' },
  { state: 'West Bengal', code: 'WB', example: 'WB 01 AB 1234' },
  { state: 'Andaman and Nicobar Islands', code: 'AN', example: 'AN 01 AB 1234' },
  { state: 'Chandigarh', code: 'CH', example: 'CH 01 AB 1234' },
  { state: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DN', example: 'DN 01 AB 1234' },
  { state: 'Delhi', code: 'DL', example: 'DL 01 AB 1234' },
  { state: 'Jammu and Kashmir', code: 'JK', example: 'JK 01 AB 1234' },
  { state: 'Ladakh', code: 'LA', example: 'LA 01 AB 1234' },
  { state: 'Lakshadweep', code: 'LD', example: 'LD 01 AB 1234' },
  { state: 'Puducherry', code: 'PY', example: 'PY 01 AB 1234' },
  { state: 'BH Series (All India Transferable)', code: 'BH', example: '21 BH 1234 AB' }
]

interface VehicleNumberInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  className?: string
  placeholder?: string
  checkDuplicates?: boolean
  currentUserId?: string // To exclude current user when updating
}

const VehicleNumberInput: React.FC<VehicleNumberInputProps> = ({
  value,
  onChange,
  error,
  required = false,
  className = "",
  placeholder = "Enter vehicle number",
  checkDuplicates = true,
  currentUserId
}) => {
  const [selectedState, setSelectedState] = useState<StateCode | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredStates, setFilteredStates] = useState<StateCode[]>(indianStateCodes)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [duplicateUser, setDuplicateUser] = useState<string | null>(null)

  // Filter states based on search query
  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStates(indianStateCodes)
    } else {
      const filtered = indianStateCodes.filter(state =>
        state.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        state.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredStates(filtered)
    }
  }, [searchQuery])

  // Auto-detect state from vehicle number
  React.useEffect(() => {
    if (value) {
      const upperValue = value.toUpperCase()
      const detectedState = indianStateCodes.find(state => 
        upperValue.startsWith(state.code) || 
        (state.code === 'BH' && upperValue.includes('BH'))
      )
      if (detectedState && detectedState !== selectedState) {
        setSelectedState(detectedState)
      }
    }
  }, [value, selectedState])

  const handleVehicleNumberChange = (vehicleNumber: string) => {
    // Convert to uppercase and remove all spaces first
    let cleanNumber = vehicleNumber.toUpperCase().replace(/\s/g, '')
    
    // Auto-format based on detected pattern
    let formattedNumber = ''
    
    // Check if it's BH series (starts with digits)
    if (/^\d/.test(cleanNumber)) {
      // BH Series format: 21BH1234AB -> 21 BH 1234 AB
      if (cleanNumber.length <= 2) {
        formattedNumber = cleanNumber
      } else if (cleanNumber.length <= 4) {
        formattedNumber = cleanNumber.slice(0, 2) + ' ' + cleanNumber.slice(2)
      } else if (cleanNumber.length <= 8) {
        formattedNumber = cleanNumber.slice(0, 2) + ' ' + cleanNumber.slice(2, 4) + ' ' + cleanNumber.slice(4)
      } else {
        formattedNumber = cleanNumber.slice(0, 2) + ' ' + cleanNumber.slice(2, 4) + ' ' + cleanNumber.slice(4, 8) + ' ' + cleanNumber.slice(8, 10)
      }
    } else {
      // Standard format: MH01AB1234 -> MH 01 AB 1234
      if (cleanNumber.length <= 2) {
        formattedNumber = cleanNumber
      } else if (cleanNumber.length <= 4) {
        formattedNumber = cleanNumber.slice(0, 2) + ' ' + cleanNumber.slice(2)
      } else if (cleanNumber.length <= 6) {
        formattedNumber = cleanNumber.slice(0, 2) + ' ' + cleanNumber.slice(2, 4) + ' ' + cleanNumber.slice(4)
      } else {
        formattedNumber = cleanNumber.slice(0, 2) + ' ' + cleanNumber.slice(2, 4) + ' ' + cleanNumber.slice(4, 6) + ' ' + cleanNumber.slice(6, 10)
      }
    }
    
    // Limit total length
    if (formattedNumber.length > 15) {
      formattedNumber = formattedNumber.slice(0, 15)
    }
    
    // Check for duplicates if enabled and vehicle number is complete
    if (checkDuplicates && formattedNumber && isValidVehicleFormat(formattedNumber)) {
      const isRegistered = userRegistrationService.isVehicleNumberRegistered(formattedNumber)
      if (isRegistered) {
        const existingUser = userRegistrationService.getUserByVehicleNumber(formattedNumber)
        // Only show as duplicate if it's not the current user
        if (!currentUserId || existingUser?.id !== currentUserId) {
          setIsDuplicate(true)
          setDuplicateUser(existingUser?.name || 'another driver')
        } else {
          setIsDuplicate(false)
          setDuplicateUser(null)
        }
      } else {
        setIsDuplicate(false)
        setDuplicateUser(null)
      }
    } else {
      setIsDuplicate(false)
      setDuplicateUser(null)
    }
    
    onChange(formattedNumber)
  }

  // Helper function to check if vehicle format is complete and valid
  const isValidVehicleFormat = (vehicleNum: string) => {
    const upperNum = vehicleNum.toUpperCase().trim()
    const bhPattern = /^\d{2}\s+BH\s+\d{4}\s+[A-Z]{2}$/
    const standardPattern = /^[A-Z]{2,3}\s+\d{2}\s+[A-Z]{1,2}\s+\d{4}$/
    return bhPattern.test(upperNum) || standardPattern.test(upperNum)
  }

  const handleStateChange = (state: StateCode) => {
    setSelectedState(state)
    setShowDropdown(false)
    setSearchQuery('') // Clear search when state is selected
    
    // If BH series, use different format
    if (state.code === 'BH') {
      onChange('21 BH ')
    } else {
      onChange(`${state.code} 01 `)
    }
  }

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown)
    setSearchQuery('') // Clear search when opening/closing
    setFilteredStates(indianStateCodes) // Reset filter
  }

  const validateVehicleNumber = (vehicleNum: string) => {
    if (!vehicleNum && required) return 'Vehicle number is required'
    if (!vehicleNum) return null

    const upperNum = vehicleNum.toUpperCase().trim()
    
    // Check if it matches any valid state code
    const matchingState = indianStateCodes.find(state => 
      upperNum.startsWith(state.code) || 
      (state.code === 'BH' && upperNum.includes('BH'))
    )
    
    if (!matchingState) {
      return 'Vehicle number must start with a valid Indian state/UT code'
    }

    // Check for duplicates
    if (checkDuplicates && isDuplicate) {
      return `This vehicle number is already registered by ${duplicateUser}`
    }

    // Validate format based on type
    if (matchingState.code === 'BH') {
      // BH Series format: 21 BH 1234 AB
      const bhPattern = /^\d{2}\s+BH\s+\d{4}\s+[A-Z]{2}$/
      if (!bhPattern.test(upperNum)) {
        return 'BH series format: 21 BH 1234 AB (2 digits + BH + 4 digits + 2 letters)'
      }
    } else {
      // Standard format: XX 01 AB 1234
      const standardPattern = /^[A-Z]{2,3}\s+\d{2}\s+[A-Z]{1,2}\s+\d{4}$/
      if (!standardPattern.test(upperNum)) {
        return `Standard format: ${matchingState.code} 01 AB 1234 (State code + 2 digits + 1-2 letters + 4 digits)`
      }
    }

    return null
  }

  const validationError = validateVehicleNumber(value)
  const hasError = error || validationError || isDuplicate
  const isComplete = isValidVehicleFormat(value)

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-slate-700">
          Vehicle Number {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="text-slate-400 hover:text-slate-600"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      <div className="flex space-x-2">
        {/* State Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={handleDropdownToggle}
            className="flex items-center justify-between w-48 px-3 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className="text-sm text-slate-700 truncate">
              {selectedState ? `${selectedState.code} - ${selectedState.state}` : 'Select State'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
              {/* Search Input */}
              <div className="p-3 border-b border-slate-200">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search states..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  autoFocus
                />
              </div>
              
              {/* States List */}
              <div className="max-h-48 overflow-y-auto">
                {filteredStates.length > 0 ? (
                  filteredStates.map((state) => (
                    <button
                      key={state.code}
                      type="button"
                      onClick={() => handleStateChange(state)}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-left"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900">{state.state}</div>
                        <div className="text-xs text-slate-500">{state.code}</div>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{state.example}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">
                    No states found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Number Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => handleVehicleNumberChange(e.target.value)}
            placeholder="Type vehicle number (auto-formatted)"
            className={`w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono ${
              hasError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
            } ${isDuplicate ? 'border-red-400' : isComplete && !isDuplicate ? 'border-green-400' : ''}`}
          />
          
          {/* Status Icon */}
          {isComplete && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {isDuplicate ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Format Information */}
      {showInfo && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Indian Vehicle Number Formats:</h4>
          <div className="space-y-1 text-xs text-blue-800">
            <div><strong>Standard:</strong> XX 01 AB 1234 (State + District + Series + Number)</div>
            <div><strong>BH Series:</strong> 21 BH 1234 AB (All-India transferable vehicles)</div>
          </div>
          <div className="mt-2 text-xs text-blue-700">
            Examples: MH 01 AB 1234, DL 05 CD 5678, 21 BH 1234 AB
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {hasError && (
        <div className={`mt-1 flex items-center space-x-1 ${isDuplicate ? 'text-red-600' : 'text-red-600'}`}>
          {isDuplicate && <AlertCircle className="w-4 h-4" />}
          <p className="text-sm">{error || validationError}</p>
        </div>
      )}

      {/* Success Message */}
      {isComplete && !hasError && (
        <div className="mt-1 flex items-center space-x-1 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <p className="text-sm">Vehicle number is available</p>
        </div>
      )}

      {/* Helper Text */}
      {selectedState && (
        <p className="mt-1 text-xs text-green-600">
          ✨ Auto-formatting enabled - just type without spaces: {selectedState.example.replace(/\s/g, '')} → {selectedState.example}
        </p>
      )}
      
      {!selectedState && (
        <p className="mt-1 text-xs text-slate-500">
          Select a state above or start typing your vehicle number (auto-formatted)
        </p>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowDropdown(false)
            setSearchQuery('')
            setFilteredStates(indianStateCodes)
          }}
        />
      )}
    </div>
  )
}

export default VehicleNumberInput