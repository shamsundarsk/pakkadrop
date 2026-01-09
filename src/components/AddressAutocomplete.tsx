// Address Autocomplete Component with Local Area Suggestions
// Provides intelligent address suggestions with Indian local areas

import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Building, Search, X } from 'lucide-react'
import { addressSuggestionService, type AddressSuggestion } from '../services/addressSuggestionService'

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  showPopularDestinations?: boolean
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter address",
  label,
  required = false,
  className = "",
  showPopularDestinations = false
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [popularDestinations, setPopularDestinations] = useState<AddressSuggestion[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load popular destinations on mount
  useEffect(() => {
    if (showPopularDestinations) {
      const popular = addressSuggestionService.getPopularDestinations(undefined, 6)
      setPopularDestinations(popular)
    }
  }, [showPopularDestinations])

  // Fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setLoading(true)
      try {
        const results = await addressSuggestionService.getSuggestions(value, 8)
        setSuggestions(results)
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [value])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.address, { lat: suggestion.lat, lng: suggestion.lng })
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle input focus
  const handleFocus = () => {
    if (value.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get icon for suggestion type
  const getSuggestionIcon = (suggestion: AddressSuggestion) => {
    switch (suggestion.type) {
      case 'landmark':
        return <Navigation className="w-4 h-4 text-blue-500" />
      case 'building':
        return <Building className="w-4 h-4 text-gray-500" />
      default:
        return <MapPin className="w-4 h-4 text-green-500" />
    }
  }

  // Get category badge color
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'commercial':
        return 'bg-blue-100 text-blue-700'
      case 'residential':
        return 'bg-green-100 text-green-700'
      case 'hospital':
        return 'bg-red-100 text-red-700'
      case 'school':
        return 'bg-purple-100 text-purple-700'
      case 'mall':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          required={required}
          className={`w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent ${className}`}
          placeholder={placeholder}
          autoComplete="off"
        />
        
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500"></div>
          </div>
        )}
        
        {value && !loading && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setShowSuggestions(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors ${
                    index === selectedIndex ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSuggestionIcon(suggestion)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {suggestion.address}
                        </p>
                        {suggestion.category && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(suggestion.category)}`}>
                            {suggestion.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {suggestion.area}, {suggestion.city}, {suggestion.state} - {suggestion.pincode}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : value.length >= 2 && !loading ? (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              No suggestions found for "{value}"
            </div>
          ) : null}
        </div>
      )}

      {/* Popular Destinations */}
      {showPopularDestinations && !showSuggestions && !value && (
        <div className="absolute z-40 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-100">
              Popular Destinations
            </div>
            {popularDestinations.map((destination) => (
              <button
                key={destination.id}
                type="button"
                onClick={() => handleSuggestionSelect(destination)}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getSuggestionIcon(destination)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {destination.address}
                    </p>
                    <p className="text-xs text-slate-500">
                      {destination.area}, {destination.city}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AddressAutocomplete