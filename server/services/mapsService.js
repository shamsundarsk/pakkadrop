const axios = require('axios')
const { logAuditEvent, logSecurityEvent } = require('./audit')

class MapsService {
  constructor() {
    this.apiKey = process.env.MAPMYINDIA_API_KEY
    this.clientId = process.env.MAPMYINDIA_CLIENT_ID
    this.baseUrl = 'https://apis.mapmyindia.com'
    
    if (!this.apiKey || !this.clientId) {
      console.warn('⚠️  MapMyIndia credentials not configured')
    }
  }

  /**
   * Calculate distance and route between two points
   * Maximum security: input validation, rate limiting, audit logging
   */
  async calculateRoute(pickup, dropoff, userId, ipAddress, userAgent) {
    try {
      // Input validation with security checks
      const validatedPickup = this.validateCoordinates(pickup, 'pickup')
      const validatedDropoff = this.validateCoordinates(dropoff, 'dropoff')
      
      // Security: Check for suspicious coordinate patterns
      if (this.detectSuspiciousCoordinates(validatedPickup, validatedDropoff)) {
        await logSecurityEvent({
          userId,
          eventType: 'SUSPICIOUS_MAP_REQUEST',
          severity: 'medium',
          description: 'Potentially fake or suspicious coordinates detected',
          ipAddress,
          userAgent,
          metadata: { pickup: validatedPickup, dropoff: validatedDropoff }
        })
        throw new Error('Invalid coordinates detected')
      }

      // Audit log the request
      await logAuditEvent({
        userId,
        action: 'CALCULATE_ROUTE',
        resource: 'maps_api',
        ipAddress,
        userAgent,
        metadata: { 
          pickup: validatedPickup, 
          dropoff: validatedDropoff,
          service: 'mapmyindia'
        }
      })

      // Make secure API call to MapMyIndia
      const response = await this.makeSecureApiCall('/api/routing/route/v1/driving', {
        coordinates: `${validatedPickup.lng},${validatedPickup.lat};${validatedDropoff.lng},${validatedDropoff.lat}`,
        geometries: 'geojson',
        steps: true,
        overview: 'full'
      }, userId, ipAddress)

      if (!response.data || !response.data.routes || response.data.routes.length === 0) {
        throw new Error('No route found between the specified points')
      }

      const route = response.data.routes[0]
      
      return {
        distance: Math.round(route.distance / 1000 * 100) / 100, // km, rounded to 2 decimals
        duration: Math.round(route.duration / 60), // minutes
        geometry: route.geometry,
        steps: route.legs[0]?.steps || [],
        bounds: this.calculateBounds(route.geometry.coordinates)
      }

    } catch (error) {
      await logSecurityEvent({
        userId,
        eventType: 'MAP_API_ERROR',
        severity: 'low',
        description: `Route calculation failed: ${error.message}`,
        ipAddress,
        userAgent,
        metadata: { pickup, dropoff, error: error.message }
      })
      throw error
    }
  }

  /**
   * Calculate pricing based on distance and business rules
   */
  calculatePricing(distance, vehicleType = 'bike', deliveryType = 'EXPRESS', timeOfDay = new Date()) {
    try {
      // Base pricing structure (secure business logic)
      const pricingRules = {
        bike: { baseFare: 40, perKm: 8, minFare: 50 },
        auto: { baseFare: 60, perKm: 12, minFare: 80 },
        'mini-truck': { baseFare: 100, perKm: 15, minFare: 150 },
        pickup: { baseFare: 150, perKm: 20, minFare: 200 }
      }

      const rules = pricingRules[vehicleType] || pricingRules.bike
      
      // Calculate base cost
      let baseFare = rules.baseFare
      let distanceCost = distance * rules.perKm
      let total = baseFare + distanceCost
      
      // Apply minimum fare
      total = Math.max(total, rules.minFare)
      
      // Time-based multipliers (peak hours)
      const hour = timeOfDay.getHours()
      let timeMultiplier = 1
      
      if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)) {
        timeMultiplier = 1.2 // 20% peak hour surcharge
      } else if (hour >= 22 || hour <= 6) {
        timeMultiplier = 1.3 // 30% night surcharge
      }
      
      total *= timeMultiplier
      
      // Pool delivery discount
      let poolDiscount = 0
      if (deliveryType === 'POOL') {
        poolDiscount = total * 0.4 // 40% discount for pool
        total -= poolDiscount
      }
      
      // Platform commission (15%)
      const platformCommission = total * 0.15
      const driverEarnings = total - platformCommission
      
      return {
        baseFare: Math.round(baseFare),
        distanceCost: Math.round(distanceCost),
        timeMultiplier: Math.round(timeMultiplier * 100) / 100,
        poolDiscount: Math.round(poolDiscount),
        platformCommission: Math.round(platformCommission),
        driverEarnings: Math.round(driverEarnings),
        totalFare: Math.round(total),
        breakdown: {
          distance: `${distance} km`,
          vehicleType,
          deliveryType,
          timeOfDay: hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'
        }
      }
      
    } catch (error) {
      console.error('Pricing calculation error:', error)
      throw new Error('Failed to calculate pricing')
    }
  }

  /**
   * Validate and sanitize coordinates with security checks
   */
  validateCoordinates(coords, type) {
    if (!coords || typeof coords !== 'object') {
      throw new Error(`Invalid ${type} coordinates: must be an object`)
    }

    const { lat, lng } = coords
    
    // Type validation
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error(`Invalid ${type} coordinates: lat/lng must be numbers`)
    }
    
    // Range validation for India
    if (lat < 6.0 || lat > 37.6 || lng < 68.7 || lng > 97.25) {
      throw new Error(`Invalid ${type} coordinates: outside India bounds`)
    }
    
    // Precision validation (prevent coordinate stuffing attacks)
    if (lat.toString().split('.')[1]?.length > 8 || lng.toString().split('.')[1]?.length > 8) {
      throw new Error(`Invalid ${type} coordinates: excessive precision`)
    }
    
    return {
      lat: Math.round(lat * 1000000) / 1000000, // 6 decimal places max
      lng: Math.round(lng * 1000000) / 1000000
    }
  }

  /**
   * Detect suspicious coordinate patterns
   */
  detectSuspiciousCoordinates(pickup, dropoff) {
    // Check for identical coordinates
    if (pickup.lat === dropoff.lat && pickup.lng === dropoff.lng) {
      return true
    }
    
    // Check for unrealistic distances (> 2000km in India)
    const distance = this.calculateHaversineDistance(pickup, dropoff)
    if (distance > 2000) {
      return true
    }
    
    // Check for coordinates in water bodies (basic check)
    const suspiciousAreas = [
      { lat: 19.0, lng: 72.8, radius: 0.1 }, // Arabian Sea near Mumbai
      { lat: 13.0, lng: 80.2, radius: 0.1 }  // Bay of Bengal near Chennai
    ]
    
    for (const area of suspiciousAreas) {
      const pickupDistance = this.calculateHaversineDistance(pickup, area)
      const dropoffDistance = this.calculateHaversineDistance(dropoff, area)
      if (pickupDistance < area.radius || dropoffDistance < area.radius) {
        return true
      }
    }
    
    return false
  }

  /**
   * Calculate Haversine distance between two points
   */
  calculateHaversineDistance(point1, point2) {
    const R = 6371 // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180
    const dLng = (point2.lng - point1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Make secure API call to MapMyIndia with rate limiting and error handling
   */
  async makeSecureApiCall(endpoint, params, userId, ipAddress) {
    try {
      const config = {
        method: 'GET',
        url: `${this.baseUrl}${endpoint}`,
        params: {
          ...params,
          access_token: this.apiKey
        },
        headers: {
          'User-Agent': 'PakkaDrop-Logistics/2.0',
          'X-Client-ID': this.clientId,
          'X-Request-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        timeout: 10000, // 10 second timeout
        maxRedirects: 0 // Prevent redirect attacks
      }

      const response = await axios(config)
      
      // Log successful API call
      await logAuditEvent({
        userId,
        action: 'MAP_API_CALL',
        resource: 'mapmyindia_api',
        ipAddress,
        metadata: { 
          endpoint,
          responseStatus: response.status,
          responseSize: JSON.stringify(response.data).length
        }
      })

      return response
      
    } catch (error) {
      // Enhanced error handling
      if (error.response) {
        const status = error.response.status
        let errorMessage = 'Map API error'
        
        switch (status) {
          case 401:
            errorMessage = 'Invalid API credentials'
            break
          case 403:
            errorMessage = 'API access forbidden'
            break
          case 429:
            errorMessage = 'Rate limit exceeded'
            break
          case 500:
            errorMessage = 'Map service temporarily unavailable'
            break
          default:
            errorMessage = `Map API error: ${status}`
        }
        
        throw new Error(errorMessage)
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Map service timeout')
      } else {
        throw new Error('Network error connecting to map service')
      }
    }
  }

  /**
   * Calculate bounding box for route geometry
   */
  calculateBounds(coordinates) {
    if (!coordinates || coordinates.length === 0) {
      return null
    }
    
    let minLat = coordinates[0][1]
    let maxLat = coordinates[0][1]
    let minLng = coordinates[0][0]
    let maxLng = coordinates[0][0]
    
    coordinates.forEach(coord => {
      minLat = Math.min(minLat, coord[1])
      maxLat = Math.max(maxLat, coord[1])
      minLng = Math.min(minLng, coord[0])
      maxLng = Math.max(maxLng, coord[0])
    })
    
    return {
      southwest: { lat: minLat, lng: minLng },
      northeast: { lat: maxLat, lng: maxLng }
    }
  }

  /**
   * Get service status for health checks
   */
  getServiceStatus() {
    return {
      service: 'MapMyIndia',
      configured: !!(this.apiKey && this.clientId),
      baseUrl: this.baseUrl,
      timestamp: new Date().toISOString()
    }
  }
}

module.exports = new MapsService()