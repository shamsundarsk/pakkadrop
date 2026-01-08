// Pooling Service - Implements Swiss Algorithm for optimal delivery pooling
// This service matches customers with similar routes to share delivery costs

export interface PoolRequest {
  id: string
  customerId: string
  pickup: {
    lat: number
    lng: number
    address: string
  }
  dropoff: {
    lat: number
    lng: number
    address: string
  }
  packageWeight: number
  maxWaitTime: number // minutes
  createdAt: Date
}

export interface PoolMatch {
  id: string
  requests: PoolRequest[]
  route: {
    lat: number
    lng: number
    address: string
  }[]
  totalDistance: number
  estimatedTime: number
  costPerCustomer: number
  savings: number
}

class PoolingService {
  private activeRequests: Map<string, PoolRequest> = new Map()
  private pools: Map<string, PoolMatch> = new Map()

  /**
   * Add a new pooling request
   */
  addPoolRequest(request: PoolRequest): string {
    this.activeRequests.set(request.id, request)
    
    // Try to find existing pools this request can join
    const matchingPool = this.findMatchingPool(request)
    
    if (matchingPool) {
      return this.addToExistingPool(matchingPool.id, request)
    } else {
      return this.createNewPool(request)
    }
  }

  /**
   * Find pools that this request can join based on Swiss Algorithm
   * Swiss Algorithm considers: route similarity, timing, capacity, and cost optimization
   */
  private findMatchingPool(request: PoolRequest): PoolMatch | null {
    const maxDeviationKm = 2 // Maximum route deviation allowed
    const maxWaitTimeMinutes = 15 // Maximum additional wait time
    
    for (const pool of this.pools.values()) {
      // Check if pool has capacity (max 3 customers per pool)
      if (pool.requests.length >= 3) continue
      
      // Check if adding this request doesn't exceed max wait time
      const additionalTime = this.calculateAdditionalTime(pool, request)
      if (additionalTime > maxWaitTimeMinutes) continue
      
      // Check route similarity using Swiss Algorithm scoring
      const routeScore = this.calculateRouteCompatibility(pool, request)
      if (routeScore < 0.7) continue // 70% compatibility threshold
      
      // Check if all customers benefit from cost savings
      const newCostPerCustomer = this.calculatePoolCost(pool, request)
      const currentCostPerCustomer = pool.costPerCustomer
      
      if (newCostPerCustomer < currentCostPerCustomer * 1.1) { // Max 10% cost increase
        return pool
      }
    }
    
    return null
  }

  /**
   * Calculate route compatibility score using Swiss Algorithm
   * Considers pickup/dropoff proximity and route efficiency
   */
  private calculateRouteCompatibility(pool: PoolMatch, request: PoolRequest): number {
    let totalScore = 0
    let comparisons = 0
    
    for (const existingRequest of pool.requests) {
      // Calculate pickup proximity score (0-1)
      const pickupDistance = this.calculateDistance(
        existingRequest.pickup,
        request.pickup
      )
      const pickupScore = Math.max(0, 1 - (pickupDistance / 5)) // 5km max for good score
      
      // Calculate dropoff proximity score (0-1)
      const dropoffDistance = this.calculateDistance(
        existingRequest.dropoff,
        request.dropoff
      )
      const dropoffScore = Math.max(0, 1 - (dropoffDistance / 5))
      
      // Calculate route direction similarity (0-1)
      const directionScore = this.calculateDirectionSimilarity(existingRequest, request)
      
      // Weighted average: pickup (30%), dropoff (30%), direction (40%)
      const requestScore = (pickupScore * 0.3) + (dropoffScore * 0.3) + (directionScore * 0.4)
      
      totalScore += requestScore
      comparisons++
    }
    
    return comparisons > 0 ? totalScore / comparisons : 0
  }

  /**
   * Calculate direction similarity between two delivery requests
   */
  private calculateDirectionSimilarity(req1: PoolRequest, req2: PoolRequest): number {
    // Calculate bearing (direction) for both routes
    const bearing1 = this.calculateBearing(req1.pickup, req1.dropoff)
    const bearing2 = this.calculateBearing(req2.pickup, req2.dropoff)
    
    // Calculate angular difference
    let angleDiff = Math.abs(bearing1 - bearing2)
    if (angleDiff > 180) angleDiff = 360 - angleDiff
    
    // Convert to similarity score (0-1)
    return Math.max(0, 1 - (angleDiff / 90)) // 90 degrees = 0 similarity
  }

  /**
   * Calculate bearing between two points
   */
  private calculateBearing(point1: {lat: number, lng: number}, point2: {lat: number, lng: number}): number {
    const lat1 = point1.lat * Math.PI / 180
    const lat2 = point2.lat * Math.PI / 180
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180
    
    const y = Math.sin(deltaLng) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI
    return (bearing + 360) % 360
  }

  /**
   * Calculate additional time if request is added to pool
   */
  private calculateAdditionalTime(pool: PoolMatch, request: PoolRequest): number {
    // Simplified calculation - in real implementation, use routing API
    const currentTime = pool.estimatedTime
    const additionalStops = 2 // pickup + dropoff
    const timePerStop = 5 // minutes
    const routeDeviation = 10 // estimated additional minutes for route deviation
    
    return additionalStops * timePerStop + routeDeviation
  }

  /**
   * Calculate cost per customer if request is added to pool
   */
  private calculatePoolCost(pool: PoolMatch, request: PoolRequest): number {
    const baseFare = 50
    const totalDistance = pool.totalDistance + 2 // estimated additional distance
    const distanceCost = totalDistance * 10 // ₹10 per km
    const totalCost = baseFare + distanceCost
    
    return totalCost / (pool.requests.length + 1)
  }

  /**
   * Add request to existing pool
   */
  private addToExistingPool(poolId: string, request: PoolRequest): string {
    const pool = this.pools.get(poolId)
    if (!pool) throw new Error('Pool not found')
    
    pool.requests.push(request)
    
    // Recalculate optimized route using Swiss Algorithm
    pool.route = this.optimizeRoute(pool.requests)
    pool.totalDistance = this.calculateTotalDistance(pool.route)
    pool.estimatedTime = this.calculateEstimatedTime(pool.route, pool.requests.length)
    pool.costPerCustomer = this.calculatePoolCost(pool, request)
    pool.savings = this.calculateSavings(pool)
    
    this.pools.set(poolId, pool)
    return poolId
  }

  /**
   * Create new pool for request
   */
  private createNewPool(request: PoolRequest): string {
    const poolId = `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const pool: PoolMatch = {
      id: poolId,
      requests: [request],
      route: [request.pickup, request.dropoff],
      totalDistance: this.calculateDistance(request.pickup, request.dropoff),
      estimatedTime: 30, // base time
      costPerCustomer: 100, // base cost
      savings: 0 // no savings for single request
    }
    
    this.pools.set(poolId, pool)
    return poolId
  }

  /**
   * Optimize route using Swiss Algorithm for multiple stops
   */
  private optimizeRoute(requests: PoolRequest[]): {lat: number, lng: number, address: string}[] {
    if (requests.length === 1) {
      return [requests[0].pickup, requests[0].dropoff]
    }
    
    // Swiss Algorithm: Start from the earliest pickup, then optimize subsequent stops
    const allPoints = []
    
    // Add all pickups first (prioritize by creation time)
    const sortedRequests = [...requests].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    for (const request of sortedRequests) {
      allPoints.push({ ...request.pickup, type: 'pickup', requestId: request.id })
    }
    
    // Then add dropoffs in optimal order (nearest first from last pickup)
    let currentLocation = allPoints[allPoints.length - 1]
    const remainingDropoffs = requests.map(r => ({ ...r.dropoff, type: 'dropoff', requestId: r.id }))
    
    while (remainingDropoffs.length > 0) {
      // Find nearest dropoff
      let nearestIndex = 0
      let nearestDistance = this.calculateDistance(currentLocation, remainingDropoffs[0])
      
      for (let i = 1; i < remainingDropoffs.length; i++) {
        const distance = this.calculateDistance(currentLocation, remainingDropoffs[i])
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIndex = i
        }
      }
      
      const nearestDropoff = remainingDropoffs.splice(nearestIndex, 1)[0]
      allPoints.push(nearestDropoff)
      currentLocation = nearestDropoff
    }
    
    return allPoints
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(point1: {lat: number, lng: number}, point2: {lat: number, lng: number}): number {
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
   * Calculate total distance for route
   */
  private calculateTotalDistance(route: {lat: number, lng: number}[]): number {
    let totalDistance = 0
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += this.calculateDistance(route[i], route[i + 1])
    }
    return totalDistance
  }

  /**
   * Calculate estimated time for route
   */
  private calculateEstimatedTime(route: {lat: number, lng: number}[], customerCount: number): number {
    const distance = this.calculateTotalDistance(route)
    const baseTime = distance * 2 // 2 minutes per km
    const stopTime = (customerCount * 2) * 5 // 5 minutes per stop (pickup + dropoff)
    return baseTime + stopTime
  }

  /**
   * Calculate savings for pool
   */
  private calculateSavings(pool: PoolMatch): number {
    if (pool.requests.length === 1) return 0
    
    // Calculate individual costs vs pool cost
    let totalIndividualCost = 0
    for (const request of pool.requests) {
      const individualDistance = this.calculateDistance(request.pickup, request.dropoff)
      const individualCost = 50 + (individualDistance * 10) // base + distance cost
      totalIndividualCost += individualCost
    }
    
    const totalPoolCost = pool.costPerCustomer * pool.requests.length
    return totalIndividualCost - totalPoolCost
  }

  /**
   * Get pool information
   */
  getPool(poolId: string): PoolMatch | null {
    return this.pools.get(poolId) || null
  }

  /**
   * Get all active pools
   */
  getActivePools(): PoolMatch[] {
    return Array.from(this.pools.values())
  }

  /**
   * Remove request from pool
   */
  removeFromPool(requestId: string): void {
    this.activeRequests.delete(requestId)
    
    // Find and update affected pool
    for (const [poolId, pool] of this.pools.entries()) {
      const requestIndex = pool.requests.findIndex(r => r.id === requestId)
      if (requestIndex !== -1) {
        pool.requests.splice(requestIndex, 1)
        
        if (pool.requests.length === 0) {
          this.pools.delete(poolId)
        } else {
          // Recalculate pool metrics
          pool.route = this.optimizeRoute(pool.requests)
          pool.totalDistance = this.calculateTotalDistance(pool.route)
          pool.estimatedTime = this.calculateEstimatedTime(pool.route, pool.requests.length)
          pool.costPerCustomer = pool.totalDistance * 10 / pool.requests.length
          pool.savings = this.calculateSavings(pool)
        }
        break
      }
    }
  }
}

// Export singleton instance
export const poolingService = new PoolingService()

// Helper function to create pool request from delivery form
export const createPoolRequest = (deliveryForm: any): PoolRequest => {
  return {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customerId: deliveryForm.customerId || 'demo_customer',
    pickup: {
      lat: 19.0760 + (Math.random() - 0.5) * 0.1, // Mock coordinates around Mumbai
      lng: 72.8777 + (Math.random() - 0.5) * 0.1,
      address: deliveryForm.pickupAddress
    },
    dropoff: {
      lat: 19.0760 + (Math.random() - 0.5) * 0.1,
      lng: 72.8777 + (Math.random() - 0.5) * 0.1,
      address: deliveryForm.dropoffAddress
    },
    packageWeight: deliveryForm.weight || 1,
    maxWaitTime: 30, // 30 minutes max wait
    createdAt: new Date()
  }
}