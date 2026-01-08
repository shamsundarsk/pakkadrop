const express = require('express')
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')
const mapsService = require('../services/mapsService')
const { logSecurityEvent } = require('../services/audit')

const router = express.Router()

// Strict rate limiting for maps API
const mapsRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: { error: 'Too many map requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await logSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'medium',
      description: 'Maps API rate limit exceeded',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { endpoint: req.path }
    })
    res.status(429).json({ error: 'Too many map requests. Please try again later.' })
  }
})

// Apply rate limiting to all maps routes
router.use(mapsRateLimit)

/**
 * Calculate route and pricing between two points
 * POST /api/maps/calculate-route
 */
router.post('/calculate-route', [
  // Input validation with security
  body('pickup.lat')
    .isFloat({ min: 6.0, max: 37.6 })
    .withMessage('Invalid pickup latitude for India'),
  body('pickup.lng')
    .isFloat({ min: 68.7, max: 97.25 })
    .withMessage('Invalid pickup longitude for India'),
  body('dropoff.lat')
    .isFloat({ min: 6.0, max: 37.6 })
    .withMessage('Invalid dropoff latitude for India'),
  body('dropoff.lng')
    .isFloat({ min: 68.7, max: 97.25 })
    .withMessage('Invalid dropoff longitude for India'),
  body('vehicleType')
    .optional()
    .isIn(['bike', 'auto', 'mini-truck', 'pickup'])
    .withMessage('Invalid vehicle type'),
  body('deliveryType')
    .optional()
    .isIn(['EXPRESS', 'POOL'])
    .withMessage('Invalid delivery type')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      await logSecurityEvent({
        eventType: 'INVALID_MAP_REQUEST',
        severity: 'low',
        description: 'Invalid input in map route calculation',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { errors: errors.array(), body: req.body }
      })
      return res.status(400).json({ 
        error: 'Invalid input parameters',
        details: errors.array()
      })
    }

    const { pickup, dropoff, vehicleType = 'bike', deliveryType = 'EXPRESS' } = req.body
    const userId = req.user?.id || 'anonymous'

    // Calculate route using secure maps service
    const routeData = await mapsService.calculateRoute(
      pickup, 
      dropoff, 
      userId, 
      req.ip, 
      req.get('User-Agent')
    )

    // Calculate pricing
    const pricing = mapsService.calculatePricing(
      routeData.distance,
      vehicleType,
      deliveryType,
      new Date()
    )

    // Combine route and pricing data
    const response = {
      route: {
        distance: routeData.distance,
        duration: routeData.duration,
        geometry: routeData.geometry,
        bounds: routeData.bounds
      },
      pricing,
      metadata: {
        calculatedAt: new Date().toISOString(),
        service: 'MapMyIndia',
        requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    }

    res.json(response)

  } catch (error) {
    console.error('Route calculation error:', error)
    
    await logSecurityEvent({
      eventType: 'MAP_CALCULATION_ERROR',
      severity: 'medium',
      description: `Route calculation failed: ${error.message}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { error: error.message, body: req.body }
    })

    // Don't expose internal errors
    const publicError = error.message.includes('Invalid') || error.message.includes('No route') 
      ? error.message 
      : 'Route calculation failed. Please try again.'

    res.status(500).json({ 
      error: publicError,
      requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    })
  }
})

/**
 * Get service health status
 * GET /api/maps/health
 */
router.get('/health', async (req, res) => {
  try {
    const status = mapsService.getServiceStatus()
    res.json(status)
  } catch (error) {
    res.status(500).json({ 
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * Calculate distance only (lightweight endpoint)
 * POST /api/maps/distance
 */
router.post('/distance', [
  body('pickup.lat').isFloat({ min: 6.0, max: 37.6 }),
  body('pickup.lng').isFloat({ min: 68.7, max: 97.25 }),
  body('dropoff.lat').isFloat({ min: 6.0, max: 37.6 }),
  body('dropoff.lng').isFloat({ min: 68.7, max: 97.25 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid coordinates',
        details: errors.array()
      })
    }

    const { pickup, dropoff } = req.body
    
    // Use Haversine formula for quick distance calculation
    const distance = mapsService.calculateHaversineDistance(pickup, dropoff)
    
    res.json({
      distance: Math.round(distance * 100) / 100, // Round to 2 decimals
      unit: 'km',
      method: 'haversine',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    res.status(500).json({ error: 'Distance calculation failed' })
  }
})

module.exports = router