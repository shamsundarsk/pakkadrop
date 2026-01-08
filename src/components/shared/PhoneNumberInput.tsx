import React, { useState } from 'react'
import { ChevronDown, AlertCircle, CheckCircle } from 'lucide-react'
import { userRegistrationService } from '../../services/userRegistrationService'

interface CountryCode {
  code: string
  country: string
  flag: string
  dialCode: string
  maxLength: number
}

const countryCodes: CountryCode[] = [
  { code: 'IN', country: 'India', flag: '🇮🇳', dialCode: '+91', maxLength: 10 },
  { code: 'US', country: 'United States', flag: '🇺🇸', dialCode: '+1', maxLength: 10 },
  { code: 'GB', country: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', maxLength: 10 },
  { code: 'AU', country: 'Australia', flag: '🇦🇺', dialCode: '+61', maxLength: 9 },
  { code: 'CA', country: 'Canada', flag: '🇨🇦', dialCode: '+1', maxLength: 10 },
  { code: 'AE', country: 'UAE', flag: '🇦🇪', dialCode: '+971', maxLength: 9 },
  { code: 'SG', country: 'Singapore', flag: '🇸🇬', dialCode: '+65', maxLength: 8 },
  { code: 'MY', country: 'Malaysia', flag: '🇲🇾', dialCode: '+60', maxLength: 10 },
  { code: 'BD', country: 'Bangladesh', flag: '🇧🇩', dialCode: '+880', maxLength: 10 },
  { code: 'LK', country: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94', maxLength: 9 },
  { code: 'NP', country: 'Nepal', flag: '🇳🇵', dialCode: '+977', maxLength: 10 },
  { code: 'PK', country: 'Pakistan', flag: '🇵🇰', dialCode: '+92', maxLength: 10 }
]

interface PhoneNumberInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  className?: string
  placeholder?: string
  checkDuplicates?: boolean
  currentUserId?: string // To exclude current user when updating
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  error,
  required = false,
  className = "",
  placeholder = "Enter phone number",
  checkDuplicates = true,
  currentUserId
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]) // Default to India
  const [showDropdown, setShowDropdown] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCountries, setFilteredCountries] = useState<CountryCode[]>(countryCodes)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [duplicateUser, setDuplicateUser] = useState<string | null>(null)

  // Filter countries based on search query
  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCountries(countryCodes)
    } else {
      const filtered = countryCodes.filter(country =>
        country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery)
      )
      setFilteredCountries(filtered)
    }
  }, [searchQuery])

  // Extract phone number from full value
  React.useEffect(() => {
    if (value) {
      const country = countryCodes.find(c => value.startsWith(c.dialCode))
      if (country) {
        setSelectedCountry(country)
        setPhoneNumber(value.replace(country.dialCode + ' ', ''))
      }
    }
  }, [value])

  const handlePhoneChange = (phone: string) => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Limit to country's max length
    const limitedPhone = cleanPhone.slice(0, selectedCountry.maxLength)
    
    setPhoneNumber(limitedPhone)
    
    // Format the complete phone number
    const fullNumber = limitedPhone ? `${selectedCountry.dialCode} ${limitedPhone}` : ''
    
    // Check for duplicates if enabled and phone is complete
    if (checkDuplicates && fullNumber && limitedPhone.length === selectedCountry.maxLength) {
      const isRegistered = userRegistrationService.isPhoneNumberRegistered(fullNumber)
      if (isRegistered) {
        const existingUser = userRegistrationService.getUserByPhone(fullNumber)
        // Only show as duplicate if it's not the current user
        if (!currentUserId || existingUser?.id !== currentUserId) {
          setIsDuplicate(true)
          setDuplicateUser(existingUser?.name || 'another user')
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
    
    onChange(fullNumber)
  }

  const handleCountryChange = (country: CountryCode) => {
    setSelectedCountry(country)
    setShowDropdown(false)
    setSearchQuery('') // Clear search when country is selected
    
    // Update the full number with new country code
    const fullNumber = phoneNumber ? `${country.dialCode} ${phoneNumber}` : ''
    onChange(fullNumber)
  }

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown)
    setSearchQuery('') // Clear search when opening/closing
    setFilteredCountries(countryCodes) // Reset filter
  }

  const validatePhoneNumber = (phone: string) => {
    if (!phone && required) return 'Phone number is required'
    if (phone && phone.length < selectedCountry.maxLength) {
      return `Phone number must be ${selectedCountry.maxLength} digits for ${selectedCountry.country}`
    }
    
    // Check for duplicates
    if (checkDuplicates && isDuplicate) {
      return `This phone number is already registered by ${duplicateUser}`
    }
    
    // India-specific validation
    if (selectedCountry.code === 'IN' && phone) {
      const validPrefixes = ['6', '7', '8', '9']
      if (!validPrefixes.includes(phone[0])) {
        return 'Indian mobile numbers must start with 6, 7, 8, or 9'
      }
    }
    
    return null
  }

  const validationError = validatePhoneNumber(phoneNumber)
  const hasError = error || validationError || isDuplicate

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Phone Number {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex">
        {/* Country Code Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={handleDropdownToggle}
            className="flex items-center space-x-2 px-3 py-2 border border-r-0 border-slate-300 rounded-l-lg bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-slate-700">{selectedCountry.dialCode}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
              {/* Search Input */}
              <div className="p-3 border-b border-slate-200">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search countries..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  autoFocus
                />
              </div>
              
              {/* Countries List */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountryChange(country)}
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-slate-50 text-left"
                    >
                      <span className="text-lg">{country.flag}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{country.country}</div>
                        <div className="text-xs text-slate-500">{country.dialCode}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">
                    No countries found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="relative flex-1">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 pr-8 border border-slate-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              hasError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
            } ${isDuplicate ? 'border-red-400' : phoneNumber.length === selectedCountry.maxLength && !isDuplicate ? 'border-green-400' : ''}`}
            maxLength={selectedCountry.maxLength}
          />
          
          {/* Status Icon */}
          {phoneNumber.length === selectedCountry.maxLength && (
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

      {/* Validation Messages */}
      {hasError && (
        <div className={`mt-1 flex items-center space-x-1 ${isDuplicate ? 'text-red-600' : 'text-red-600'}`}>
          {isDuplicate && <AlertCircle className="w-4 h-4" />}
          <p className="text-sm">{error || validationError}</p>
        </div>
      )}

      {/* Success Message */}
      {phoneNumber.length === selectedCountry.maxLength && !hasError && (
        <div className="mt-1 flex items-center space-x-1 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <p className="text-sm">Phone number is available</p>
        </div>
      )}

      {/* Helper Text */}
      <p className="mt-1 text-xs text-slate-500">
        🔍 Click country dropdown and type to search • Enter {selectedCountry.maxLength}-digit phone number for {selectedCountry.country}
        {selectedCountry.code === 'IN' && ' (must start with 6, 7, 8, or 9)'}
      </p>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowDropdown(false)
            setSearchQuery('')
            setFilteredCountries(countryCodes)
          }}
        />
      )}
    </div>
  )
}

export default PhoneNumberInput