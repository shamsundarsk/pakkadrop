// Enhanced Fare Breakdown Component with Detailed Pricing
// Shows comprehensive fare calculation with all factors

import React from 'react'
import { 
  DollarSign, 
  MapPin, 
  Clock, 
  Fuel, 
  Scale, 
  Truck, 
  CloudRain, 
  Calendar,
  Package,
  Users,
  TrendingDown,
  Info,
  CheckCircle
} from 'lucide-react'
import { DetailedFareBreakdown } from '../services/enhancedPricingService'

interface EnhancedFareBreakdownProps {
  fareBreakdown: DetailedFareBreakdown
  distance: number
  weight: number
  vehicleType: string
  deliveryType: 'EXPRESS' | 'POOL'
  showDriverEarnings?: boolean
  className?: string
}

const EnhancedFareBreakdown: React.FC<EnhancedFareBreakdownProps> = ({
  fareBreakdown,
  distance,
  weight,
  vehicleType,
  deliveryType,
  showDriverEarnings = false,
  className = ""
}) => {
  const formatCurrency = (amount: number) => `₹${amount.toFixed(0)}`
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getVehicleIcon = (vehicle: string) => {
    switch (vehicle) {
      case 'bike': return '🏍️'
      case 'auto': return '🛺'
      case 'mini-truck': return '🚛'
      case 'pickup': return '🚚'
      default: return '🚗'
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-slate-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Fare Breakdown</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(fareBreakdown.totalFare)}
            </div>
            <div className="text-sm text-slate-500">
              {formatTime(fareBreakdown.estimatedTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Trip Summary */}
      <div className="p-4 bg-slate-50 border-b border-slate-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-slate-600">Distance</div>
              <div className="font-medium text-slate-900">{distance.toFixed(1)} km</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-slate-600">Weight</div>
              <div className="font-medium text-slate-900">{weight} kg</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-slate-600">Vehicle</div>
              <div className="font-medium text-slate-900 flex items-center space-x-1">
                <span>{getVehicleIcon(vehicleType)}</span>
                <span className="capitalize">{vehicleType}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-slate-600">Type</div>
              <div className="font-medium text-slate-900 flex items-center space-x-1">
                {deliveryType === 'POOL' ? (
                  <>
                    <Users className="w-3 h-3" />
                    <span>Pool</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>Express</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="p-4 space-y-3">
        {/* Base Charges */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700 flex items-center space-x-1">
            <Package className="w-4 h-4" />
            <span>Base Charges</span>
          </h4>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Base Fare</span>
              <span className="text-slate-900">{formatCurrency(fareBreakdown.baseFare)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-600">Distance ({distance.toFixed(1)} km)</span>
              <span className="text-slate-900">{formatCurrency(fareBreakdown.distanceCost)}</span>
            </div>
            
            {fareBreakdown.weightCost > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Extra Weight ({weight} kg)</span>
                <span className="text-slate-900">{formatCurrency(fareBreakdown.weightCost)}</span>
              </div>
            )}
            
            {fareBreakdown.vehicleCost > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Vehicle Maintenance</span>
                <span className="text-slate-900">{formatCurrency(fareBreakdown.vehicleCost)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Charges */}
        {(fareBreakdown.fuelCost > 0 || fareBreakdown.tollCharges > 0 || 
          fareBreakdown.timeSurcharge > 0 || fareBreakdown.weatherSurcharge > 0 || 
          fareBreakdown.holidaySurcharge > 0 || fareBreakdown.packageHandlingFee > 0) && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-700 flex items-center space-x-1">
              <Info className="w-4 h-4" />
              <span>Additional Charges</span>
            </h4>
            
            <div className="space-y-1 text-sm">
              {fareBreakdown.fuelCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 flex items-center space-x-1">
                    <Fuel className="w-3 h-3" />
                    <span>Fuel Adjustment</span>
                  </span>
                  <span className="text-slate-900">{formatCurrency(fareBreakdown.fuelCost)}</span>
                </div>
              )}
              
              {fareBreakdown.tollCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Toll Charges</span>
                  <span className="text-slate-900">{formatCurrency(fareBreakdown.tollCharges)}</span>
                </div>
              )}
              
              {fareBreakdown.timeSurcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Peak Hour Surcharge</span>
                  </span>
                  <span className="text-slate-900">{formatCurrency(fareBreakdown.timeSurcharge)}</span>
                </div>
              )}
              
              {fareBreakdown.weatherSurcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 flex items-center space-x-1">
                    <CloudRain className="w-3 h-3" />
                    <span>Weather Surcharge</span>
                  </span>
                  <span className="text-slate-900">{formatCurrency(fareBreakdown.weatherSurcharge)}</span>
                </div>
              )}
              
              {fareBreakdown.holidaySurcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Holiday Surcharge</span>
                  </span>
                  <span className="text-slate-900">{formatCurrency(fareBreakdown.holidaySurcharge)}</span>
                </div>
              )}
              
              {fareBreakdown.packageHandlingFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Special Handling</span>
                  <span className="text-slate-900">{formatCurrency(fareBreakdown.packageHandlingFee)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pool Discount */}
        {fareBreakdown.poolDiscount > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-green-600 flex items-center space-x-1">
                <TrendingDown className="w-4 h-4" />
                <span>Pool Delivery Discount (40%)</span>
              </span>
              <span className="text-green-600 font-medium">
                -{formatCurrency(fareBreakdown.poolDiscount)}
              </span>
            </div>
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              💡 You're saving {formatCurrency(fareBreakdown.poolDiscount)} by choosing pool delivery!
            </div>
          </div>
        )}

        {/* Fees and Taxes */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Platform Fee (12%)</span>
              <span className="text-slate-900">{formatCurrency(fareBreakdown.platformFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">GST (5%)</span>
              <span className="text-slate-900">{formatCurrency(fareBreakdown.taxes)}</span>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="pt-3 border-t-2 border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-slate-900">Total Amount</span>
            <span className="text-xl font-bold text-slate-900">
              {formatCurrency(fareBreakdown.totalFare)}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Estimated delivery time: {formatTime(fareBreakdown.estimatedTime)}
          </div>
        </div>

        {/* Driver Earnings */}
        {showDriverEarnings && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Driver Earnings</span>
              <span className="text-green-600 font-medium">
                {formatCurrency(fareBreakdown.driverEarnings)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Fair Pricing Notice */}
      <div className="p-4 bg-blue-50 border-t border-slate-100 rounded-b-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <div className="font-medium mb-1">Fair & Transparent Pricing</div>
            <div>
              Our pricing is based on actual distance, weight, and real-time factors like traffic and weather. 
              {deliveryType === 'POOL' && ' Pool deliveries help reduce costs and environmental impact.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedFareBreakdown