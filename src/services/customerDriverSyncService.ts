// Customer-Driver Sync Service
// Ensures seamless real-time communication and synchronization between customers and drivers

import { deliveryService } from './deliveryService'
import { realtimeService } from './realtimeService'

export interface SyncEvent {
  type: 'DELIVERY_ACCEPTED' | 'DRIVER_LOCATION_UPDATE' | 'STATUS_CHANGE' | 'MESSAGE' | 'ETA_UPDATE'
  deliveryId: string
  customerId: string
  driverId?: string
  data: any
  timestamp: Date
}

export interface LocationUpdate {
  lat: number
  lng: number
  heading?: number
  speed?: number
  accuracy?: number
}

export interface ETAUpdate {
  estimatedMinutes: number
  distance: string
  trafficCondition: 'light' | 'moderate' | 'heavy'
}

class CustomerDriverSyncService {
  private syncListeners: Map<string, Function[]> = new Map()
  private activeDeliveries: Map<string, any> = new Map()
  private locationUpdateInterval: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.initializeRealtimeListeners()
  }

  /**
   * Initialize real-time event listeners
   */
  private initializeRealtimeListeners() {
    // Listen for delivery acceptance
    deliveryService.on('deliveryAccepted', (delivery) => {
      this.handleDeliveryAccepted(delivery)
    })

    // Listen for status updates
    deliveryService.on('deliveryStatusUpdated', (data) => {
      this.handleStatusUpdate(data.delivery)
    })

    // Listen for driver location updates
    realtimeService.on('driverLocationUpdate', (data) => {
      this.handleDriverLocationUpdate(data)
    })

    // Listen for messages
    realtimeService.on('messageReceived', (message) => {
      this.handleMessageReceived(message)
    })
  }

  /**
   * Handle delivery acceptance by driver
   */
  private handleDeliveryAccepted(delivery: any) {
    const syncEvent: SyncEvent = {
      type: 'DELIVERY_ACCEPTED',
      deliveryId: delivery.id,
      customerId: delivery.customerId,
      driverId: delivery.driverId,
      data: {
        driverName: delivery.driverName,
        driverPhone: delivery.driverPhone,
        vehicleDetails: delivery.vehicleDetails,
        estimatedPickupTime: delivery.estimatedPickupTime
      },
      timestamp: new Date()
    }

    this.activeDeliveries.set(delivery.id, delivery)
    this.emitSyncEvent(syncEvent)
    this.startLocationTracking(delivery.id, delivery.driverId)
  }

  /**
   * Handle delivery status updates
   */
  private handleStatusUpdate(delivery: any) {
    const syncEvent: SyncEvent = {
      type: 'STATUS_CHANGE',
      deliveryId: delivery.id,
      customerId: delivery.customerId,
      driverId: delivery.driverId,
      data: {
        status: delivery.status,
        statusMessage: this.getStatusMessage(delivery.status),
        timestamp: delivery.updatedAt || new Date()
      },
      timestamp: new Date()
    }

    this.activeDeliveries.set(delivery.id, delivery)
    this.emitSyncEvent(syncEvent)

    // Stop location tracking if delivery is completed or cancelled
    if (['DELIVERED', 'CANCELLED'].includes(delivery.status)) {
      this.stopLocationTracking(delivery.id)
      this.activeDeliveries.delete(delivery.id)
    }
  }

  /**
   * Handle driver location updates
   */
  private handleDriverLocationUpdate(data: any) {
    const { deliveryId, location } = data
    const delivery = this.activeDeliveries.get(deliveryId)
    
    if (!delivery) return

    // Calculate ETA based on current location
    const eta = this.calculateETA(location, delivery)

    const syncEvent: SyncEvent = {
      type: 'DRIVER_LOCATION_UPDATE',
      deliveryId,
      customerId: delivery.customerId,
      driverId: delivery.driverId,
      data: {
        location,
        eta,
        lastUpdated: new Date()
      },
      timestamp: new Date()
    }

    this.emitSyncEvent(syncEvent)
  }

  /**
   * Handle message reception
   */
  private handleMessageReceived(message: any) {
    const syncEvent: SyncEvent = {
      type: 'MESSAGE',
      deliveryId: message.deliveryId,
      customerId: message.receiverId,
      driverId: message.senderId,
      data: message,
      timestamp: new Date()
    }

    this.emitSyncEvent(syncEvent)
  }

  /**
   * Start tracking driver location for a delivery
   */
  private startLocationTracking(deliveryId: string, driverId: string) {
    // Clear existing interval if any
    this.stopLocationTracking(deliveryId)

    // Start new location tracking interval (every 30 seconds)
    const interval = setInterval(() => {
      this.requestDriverLocation(deliveryId, driverId)
    }, 30000)

    this.locationUpdateInterval.set(deliveryId, interval)
  }

  /**
   * Stop location tracking for a delivery
   */
  private stopLocationTracking(deliveryId: string) {
    const interval = this.locationUpdateInterval.get(deliveryId)
    if (interval) {
      clearInterval(interval)
      this.locationUpdateInterval.delete(deliveryId)
    }
  }

  /**
   * Request current driver location
   */
  private requestDriverLocation(deliveryId: string, driverId: string) {
    // In a real implementation, this would request location from the driver's device
    // For demo purposes, we'll simulate location updates
    const delivery = this.activeDeliveries.get(deliveryId)
    if (!delivery) return

    // Simulate driver movement towards pickup/dropoff
    const mockLocation = this.simulateDriverMovement(delivery)
    
    this.handleDriverLocationUpdate({
      deliveryId,
      driverId,
      location: mockLocation
    })
  }

  /**
   * Simulate driver movement for demo purposes
   */
  private simulateDriverMovement(delivery: any): LocationUpdate {
    const now = new Date()
    const createdAt = new Date(delivery.createdAt)
    const elapsedMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)

    // Simulate movement based on delivery status and elapsed time
    let targetLat, targetLng

    if (delivery.status === 'ACCEPTED' || delivery.status === 'PICKED_UP') {
      // Moving towards pickup location
      targetLat = delivery.pickup.lat || 19.0760
      targetLng = delivery.pickup.lng || 72.8777
    } else {
      // Moving towards dropoff location
      targetLat = delivery.dropoff.lat || 19.0896
      targetLng = delivery.dropoff.lng || 72.8656
    }

    // Add some randomness to simulate realistic movement
    const randomOffset = 0.001 * (Math.random() - 0.5)
    
    return {
      lat: targetLat + randomOffset,
      lng: targetLng + randomOffset,
      heading: Math.random() * 360,
      speed: 25 + Math.random() * 15, // 25-40 km/h
      accuracy: 5 + Math.random() * 10 // 5-15 meters
    }
  }

  /**
   * Calculate ETA based on current driver location
   */
  private calculateETA(driverLocation: LocationUpdate, delivery: any): ETAUpdate {
    // Simple ETA calculation (in a real app, this would use routing APIs)
    const targetLat = delivery.status === 'ACCEPTED' ? delivery.pickup.lat : delivery.dropoff.lat
    const targetLng = delivery.status === 'ACCEPTED' ? delivery.pickup.lng : delivery.dropoff.lng

    if (!targetLat || !targetLng) {
      return {
        estimatedMinutes: 30,
        distance: '5.0 km',
        trafficCondition: 'moderate'
      }
    }

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      driverLocation.lat,
      driverLocation.lng,
      targetLat,
      targetLng
    )

    // Estimate time based on average speed and traffic
    const averageSpeed = this.getAverageSpeed()
    const estimatedMinutes = Math.round((distance / averageSpeed) * 60)

    return {
      estimatedMinutes: Math.max(5, estimatedMinutes), // Minimum 5 minutes
      distance: `${distance.toFixed(1)} km`,
      trafficCondition: this.getTrafficCondition()
    }
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Get average speed based on time of day and traffic
   */
  private getAverageSpeed(): number {
    const hour = new Date().getHours()
    
    // Peak hours: slower speed
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      return 15 // km/h
    }
    // Night hours: faster speed
    else if (hour >= 22 || hour <= 6) {
      return 35 // km/h
    }
    // Normal hours
    else {
      return 25 // km/h
    }
  }

  /**
   * Get current traffic condition
   */
  private getTrafficCondition(): 'light' | 'moderate' | 'heavy' {
    const hour = new Date().getHours()
    
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      return 'heavy'
    } else if (hour >= 11 && hour <= 16) {
      return 'moderate'
    } else {
      return 'light'
    }
  }

  /**
   * Get user-friendly status message
   */
  private getStatusMessage(status: string): string {
    const messages = {
      'PENDING': 'Looking for a driver...',
      'ACCEPTED': 'Driver is on the way to pickup',
      'PICKED_UP': 'Package picked up, heading to destination',
      'IN_TRANSIT': 'Package is on the way',
      'DELIVERED': 'Package delivered successfully',
      'CANCELLED': 'Delivery was cancelled'
    }
    
    return messages[status as keyof typeof messages] || 'Status updated'
  }

  /**
   * Emit sync event to all listeners
   */
  private emitSyncEvent(event: SyncEvent) {
    const listeners = this.syncListeners.get(event.customerId) || []
    listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in sync event listener:', error)
      }
    })

    // Also emit to global listeners
    const globalListeners = this.syncListeners.get('*') || []
    globalListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in global sync event listener:', error)
      }
    })
  }

  /**
   * Subscribe to sync events for a specific customer
   */
  public subscribe(customerId: string, listener: (event: SyncEvent) => void): () => void {
    if (!this.syncListeners.has(customerId)) {
      this.syncListeners.set(customerId, [])
    }
    
    this.syncListeners.get(customerId)!.push(listener)
    
    // Return unsubscribe function
    return () => {
      const listeners = this.syncListeners.get(customerId)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  /**
   * Send message from customer to driver
   */
  public sendMessageToDriver(deliveryId: string, customerId: string, message: string): void {
    const delivery = this.activeDeliveries.get(deliveryId)
    if (!delivery || !delivery.driverId) {
      throw new Error('No active driver for this delivery')
    }

    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deliveryId,
      senderId: customerId,
      receiverId: delivery.driverId,
      senderType: 'CUSTOMER',
      message,
      timestamp: new Date(),
      type: 'text'
    }

    // Send via realtime service
    realtimeService.sendMessage(messageData)
  }

  /**
   * Request driver's current location
   */
  public requestDriverLocation(deliveryId: string): void {
    const delivery = this.activeDeliveries.get(deliveryId)
    if (!delivery || !delivery.driverId) {
      throw new Error('No active driver for this delivery')
    }

    // Request location update
    realtimeService.requestLocation(deliveryId, delivery.driverId)
  }

  /**
   * Get current delivery status
   */
  public getDeliveryStatus(deliveryId: string): any {
    return this.activeDeliveries.get(deliveryId)
  }

  /**
   * Get all active deliveries for a customer
   */
  public getActiveDeliveries(customerId: string): any[] {
    return Array.from(this.activeDeliveries.values())
      .filter(delivery => delivery.customerId === customerId)
  }

  /**
   * Cancel delivery
   */
  public cancelDelivery(deliveryId: string, customerId: string, reason: string): void {
    const delivery = this.activeDeliveries.get(deliveryId)
    if (!delivery) {
      throw new Error('Delivery not found')
    }

    if (delivery.customerId !== customerId) {
      throw new Error('Unauthorized to cancel this delivery')
    }

    if (['DELIVERED', 'CANCELLED'].includes(delivery.status)) {
      throw new Error('Cannot cancel completed or already cancelled delivery')
    }

    // Update delivery status
    deliveryService.cancelDelivery(deliveryId, reason)
  }
}

export const customerDriverSyncService = new CustomerDriverSyncService()
export default customerDriverSyncService