// Enhanced Pricing Service with Distance and Weight-based Calculations
// Provides accurate pricing based on kilometers, weight, and real-time factors

export interface PricingFactors {
  distance: number // in kilometers
  weight: number // in kilograms
  vehicleType: 'bike' | 'auto' | 'mini-truck' | 'pickup'
  deliveryType: 'EXPRESS' | 'POOL'
  timeOfDay: 'peak' | 'normal' | 'night'
  weatherCondition?: 'normal' | 'rain' | 'heavy-rain'
  isHoliday?: boolean
  packageType?: 'fragile' | 'normal' | 'hazardous'
}

export interface DetailedFareBreakdown {
  baseFare: number
  distanceCost: number
  weightCost: number
  vehicleCost: number
  timeSurcharge: number
  weatherSurcharge: number
  holidaySurcharge: number
  packageHandlingFee: number
  poolDiscount: number
  platformFee: number
  taxes: number
  totalFare: number
  driverEarnings: number
  estimatedTime: number // in minutes
  fuelCost: number
  tollCharges: number
}

class EnhancedPricingService {
  // Base pricing configuration
  private readonly baseFares = {
    bike: 30,
    auto: 50,
    'mini-truck': 200,
    pickup: 400
  }

  private readonly perKmRates = {
    bike: 8,
    auto: 12,
    'mini-truck': 25,
    pickup: 35
  }

  private readonly weightRates = {
    bike: { max: 10, rate: 2 }, // ₹2 per kg above 5kg
    auto: { max: 50, rate: 1.5 }, // ₹1.5 per kg above 10kg
    'mini-truck': { max: 500, rate: 1 }, // ₹1 per kg above 50kg
    pickup: { max: 1000, rate: 0.8 } // ₹0.8 per kg above 100kg
  }

  private readonly freeWeightLimits = {
    bike: 5,
    auto: 10,
    'mini-truck': 50,
    pickup: 100
  }

  /**
   * Calculate comprehensive fare breakdown
   */
  calculateFare(factors: PricingFactors): DetailedFareBreakdown {
    const baseFare = this.baseFares[factors.vehicleType]
    const distanceCost = this.calculateDistanceCost(factors.distance, factors.vehicleType)
    const weightCost = this.calculateWeightCost(factors.weight, factors.vehicleType)
    const vehicleCost = this.calculateVehicleCost(factors.vehicleType, factors.distance)
    const timeSurcharge = this.calculateTimeSurcharge(factors.timeOfDay, distanceCost)
    const weatherSurcharge = this.calculateWeatherSurcharge(factors.weatherCondition, distanceCost)
    const holidaySurcharge = this.calculateHolidaySurcharge(factors.isHoliday, distanceCost)
    const packageHandlingFee = this.calculatePackageHandlingFee(factors.packageType, factors.weight)
    const fuelCost = this.calculateFuelCost(factors.distance, factors.vehicleType)
    const tollCharges = this.calculateTollCharges(factors.distance)

    const subtotal = baseFare + distanceCost + weightCost + vehicleCost + 
                    timeSurcharge + weatherSurcharge + holidaySurcharge + 
                    packageHandlingFee + fuelCost + tollCharges

    const poolDiscount = factors.deliveryType === 'POOL' ? subtotal * 0.4 : 0
    const afterDiscount = subtotal - poolDiscount
    
    const platformFee = afterDiscount * 0.12 // 12% platform fee
    const taxes = afterDiscount * 0.05 // 5% GST
    
    const totalFare = afterDiscount + platformFee + taxes
    const driverEarnings = totalFare - platformFee - taxes

    const estimatedTime = this.calculateEstimatedTime(factors.distance, factors.vehicleType, factors.timeOfDay)

    return {
      baseFare,
      distanceCost,
      weightCost,
      vehicleCost,
      timeSurcharge,
      weatherSurcharge,
      holidaySurcharge,
      packageHandlingFee,
      poolDiscount,
      platformFee,
      taxes,
      totalFare: Math.round(totalFare),
      driverEarnings: Math.round(driverEarnings),
      estimatedTime,
      fuelCost,
      tollCharges
    }
  }

  /**
   * Calculate distance-based cost
   */
  private calculateDistanceCost(distance: number, vehicleType: string): number {
    const rate = this.perKmRates[vehicleType as keyof typeof this.perKmRates]
    return distance * rate
  }

  /**
   * Calculate weight-based cost
   */
  private calculateWeightCost(weight: number, vehicleType: string): number {
    const config = this.weightRates[vehicleType as keyof typeof this.weightRates]
    const freeLimit = this.freeWeightLimits[vehicleType as keyof typeof this.freeWeightLimits]
    
    if (weight <= freeLimit) {
      return 0
    }

    if (weight > config.max) {
      throw new Error(`Weight ${weight}kg exceeds maximum capacity of ${config.max}kg for ${vehicleType}`)
    }

    const chargeableWeight = weight - freeLimit
    return chargeableWeight * config.rate
  }

  /**
   * Calculate vehicle-specific costs
   */
  private calculateVehicleCost(vehicleType: string, distance: number): number {
    // Additional vehicle maintenance cost for longer distances
    if (distance > 20) {
      const maintenanceCosts = {
        bike: 10,
        auto: 15,
        'mini-truck': 30,
        pickup: 50
      }
      return maintenanceCosts[vehicleType as keyof typeof maintenanceCosts] || 0
    }
    return 0
  }

  /**
   * Calculate time-based surcharge
   */
  private calculateTimeSurcharge(timeOfDay: string, baseCost: number): number {
    const surchargeRates = {
      peak: 0.25, // 25% surcharge during peak hours (8-10am, 5-8pm)
      normal: 0,
      night: 0.15 // 15% surcharge during night hours (10pm-6am)
    }
    
    return baseCost * (surchargeRates[timeOfDay as keyof typeof surchargeRates] || 0)
  }

  /**
   * Calculate weather-based surcharge
   */
  private calculateWeatherSurcharge(weatherCondition: string = 'normal', baseCost: number): number {
    const weatherRates = {
      normal: 0,
      rain: 0.1, // 10% surcharge for rain
      'heavy-rain': 0.2 // 20% surcharge for heavy rain
    }
    
    return baseCost * (weatherRates[weatherCondition as keyof typeof weatherRates] || 0)
  }

  /**
   * Calculate holiday surcharge
   */
  private calculateHolidaySurcharge(isHoliday: boolean = false, baseCost: number): number {
    return isHoliday ? baseCost * 0.15 : 0 // 15% surcharge on holidays
  }

  /**
   * Calculate package handling fee
   */
  private calculatePackageHandlingFee(packageType: string = 'normal', weight: number): number {
    const handlingRates = {
      normal: 0,
      fragile: Math.max(20, weight * 2), // Minimum ₹20 or ₹2 per kg
      hazardous: Math.max(50, weight * 5) // Minimum ₹50 or ₹5 per kg
    }
    
    return handlingRates[packageType as keyof typeof handlingRates] || 0
  }

  /**
   * Calculate fuel cost based on current fuel prices
   */
  private calculateFuelCost(distance: number, vehicleType: string): number {
    const fuelEfficiency = {
      bike: 40, // km per liter
      auto: 15,
      'mini-truck': 8,
      pickup: 6
    }
    
    const currentFuelPrice = 105 // ₹105 per liter (current average in India)
    const efficiency = fuelEfficiency[vehicleType as keyof typeof fuelEfficiency]
    
    return (distance / efficiency) * currentFuelPrice * 0.3 // 30% of actual fuel cost
  }

  /**
   * Calculate toll charges for highways
   */
  private calculateTollCharges(distance: number): number {
    if (distance > 15) {
      return Math.floor(distance / 10) * 25 // ₹25 per 10km stretch on highways
    }
    return 0
  }

  /**
   * Calculate estimated delivery time
   */
  private calculateEstimatedTime(distance: number, vehicleType: string, timeOfDay: string): number {
    const averageSpeeds = {
      bike: { peak: 20, normal: 30, night: 35 },
      auto: { peak: 18, normal: 25, night: 30 },
      'mini-truck': { peak: 15, normal: 20, night: 25 },
      pickup: { peak: 12, normal: 18, night: 22 }
    }
    
    const speed = averageSpeeds[vehicleType as keyof typeof averageSpeeds]?.[timeOfDay as keyof typeof averageSpeeds.bike] || 20
    const travelTime = (distance / speed) * 60 // Convert to minutes
    
    // Add buffer time for pickup and delivery
    const bufferTime = vehicleType === 'bike' ? 10 : 15
    
    return Math.round(travelTime + bufferTime)
  }

  /**
   * Get current time category
   */
  getCurrentTimeCategory(): 'peak' | 'normal' | 'night' {
    const hour = new Date().getHours()
    
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      return 'peak'
    } else if (hour >= 22 || hour <= 6) {
      return 'night'
    } else {
      return 'normal'
    }
  }

  /**
   * Check if today is a holiday
   */
  isHoliday(): boolean {
    const today = new Date()
    const day = today.getDay()
    
    // Simple check for weekends (can be extended with actual holiday calendar)
    return day === 0 || day === 6
  }

  /**
   * Get weather condition (mock implementation)
   */
  getCurrentWeatherCondition(): 'normal' | 'rain' | 'heavy-rain' {
    // In production, this would integrate with weather API
    const conditions = ['normal', 'normal', 'normal', 'rain', 'heavy-rain']
    return conditions[Math.floor(Math.random() * conditions.length)] as any
  }

  /**
   * Calculate fare with automatic factors
   */
  calculateAutoFare(distance: number, weight: number, vehicleType: 'bike' | 'auto' | 'mini-truck' | 'pickup', deliveryType: 'EXPRESS' | 'POOL' = 'EXPRESS', packageType?: string): DetailedFareBreakdown {
    const factors: PricingFactors = {
      distance,
      weight,
      vehicleType,
      deliveryType,
      timeOfDay: this.getCurrentTimeCategory(),
      weatherCondition: this.getCurrentWeatherCondition(),
      isHoliday: this.isHoliday(),
      packageType: packageType as any
    }
    
    return this.calculateFare(factors)
  }

  /**
   * Get vehicle recommendations based on weight and distance
   */
  getVehicleRecommendations(weight: number, distance: number): Array<{
    vehicleType: string
    suitable: boolean
    reason: string
    estimatedFare: number
  }> {
    const recommendations = []
    
    for (const [vehicleType, config] of Object.entries(this.weightRates)) {
      const suitable = weight <= config.max
      let reason = ''
      
      if (!suitable) {
        reason = `Exceeds weight capacity (${config.max}kg)`
      } else if (weight <= this.freeWeightLimits[vehicleType as keyof typeof this.freeWeightLimits]) {
        reason = 'No extra weight charges'
      } else {
        const extraWeight = weight - this.freeWeightLimits[vehicleType as keyof typeof this.freeWeightLimits]
        reason = `Extra ₹${(extraWeight * config.rate).toFixed(0)} for ${extraWeight}kg`
      }
      
      let estimatedFare = 0
      if (suitable) {
        const fareBreakdown = this.calculateAutoFare(distance, weight, vehicleType as any)
        estimatedFare = fareBreakdown.totalFare
      }
      
      recommendations.push({
        vehicleType,
        suitable,
        reason,
        estimatedFare
      })
    }
    
    return recommendations.sort((a, b) => {
      if (a.suitable && !b.suitable) return -1
      if (!a.suitable && b.suitable) return 1
      return a.estimatedFare - b.estimatedFare
    })
  }
}

export const enhancedPricingService = new EnhancedPricingService()
export default enhancedPricingService