// Delivery Service - Manages deliveries across the entire application
// Provides shared state between customer and driver dashboards

import React from 'react'

export interface Delivery {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  driverId?: string
  driverName?: string
  driverPhone?: string
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  pickup: {
    address: string
    contactName: string
    contactPhone: string
    lat?: number
    lng?: number
  }
  dropoff: {
    address: string
    contactName: string
    contactPhone: string
    lat?: number
    lng?: number
  }
  packageType: string
  weight: number
  vehicleType: string
  deliveryType: 'EXPRESS' | 'POOL'
  paymentMethod: 'UPI' | 'CARD' | 'CASH'
  specialInstructions?: string
  fare: number
  distance: string
  estimatedTime: string
  poolId?: string
  createdAt: Date
  acceptedAt?: Date
  pickedUpAt?: Date
  deliveredAt?: Date
}

class DeliveryService {
  private deliveries: Map<string, Delivery> = new Map()
  private listeners: Map<string, Function[]> = new Map()

  constructor() {
    // Initialize with some mock data for demonstration
    this.initializeMockData()
  }

  private initializeMockData() {
    const mockDeliveries: Delivery[] = [
      {
        id: 'DEL001',
        customerId: 'customer1',
        customerName: 'John Doe',
        customerPhone: '+91 98765 43210',
        status: 'PENDING',
        pickup: {
          address: 'Bandra West, Mumbai',
          contactName: 'John Doe',
          contactPhone: '+91 98765 43210',
          lat: 19.0596,
          lng: 72.8295
        },
        dropoff: {
          address: 'Andheri East, Mumbai',
          contactName: 'Jane Smith',
          contactPhone: '+91 87654 32109',
          lat: 19.1136,
          lng: 72.8697
        },
        packageType: 'Electronics',
        weight: 2.5,
        vehicleType: 'bike',
        deliveryType: 'EXPRESS',
        paymentMethod: 'UPI',
        specialInstructions: 'Handle with care',
        fare: 180,
        distance: '8.2 km',
        estimatedTime: '25 min',
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      }
    ]

    mockDeliveries.forEach(delivery => {
      this.deliveries.set(delivery.id, delivery)
    })
  }

  /**
   * Create a new delivery
   */
  createDelivery(deliveryData: Omit<Delivery, 'id' | 'createdAt' | 'status'>): Delivery {
    const delivery: Delivery = {
      ...deliveryData,
      id: `DEL${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      status: 'PENDING',
      createdAt: new Date()
    }

    this.deliveries.set(delivery.id, delivery)
    this.emit('deliveryCreated', delivery)
    this.emit('deliveriesUpdated', this.getAllDeliveries())

    console.log('✅ New delivery created:', delivery.id, delivery)
    return delivery
  }

  /**
   * Get all deliveries
   */
  getAllDeliveries(): Delivery[] {
    return Array.from(this.deliveries.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    )
  }

  /**
   * Get deliveries by status
   */
  getDeliveriesByStatus(status: Delivery['status']): Delivery[] {
    return this.getAllDeliveries().filter(delivery => delivery.status === status)
  }

  /**
   * Get available jobs for drivers (PENDING status)
   */
  getAvailableJobs(): Delivery[] {
    return this.getDeliveriesByStatus('PENDING')
  }

  /**
   * Get deliveries for a specific customer
   */
  getCustomerDeliveries(customerId: string): Delivery[] {
    return this.getAllDeliveries().filter(delivery => delivery.customerId === customerId)
  }

  /**
   * Get deliveries for a specific driver
   */
  getDriverDeliveries(driverId: string): Delivery[] {
    return this.getAllDeliveries().filter(delivery => delivery.driverId === driverId)
  }

  /**
   * Accept a delivery job (driver action)
   */
  acceptDelivery(deliveryId: string, driverId: string, driverName: string, driverPhone: string): boolean {
    const delivery = this.deliveries.get(deliveryId)
    
    if (!delivery || delivery.status !== 'PENDING') {
      console.error('Cannot accept delivery:', deliveryId, 'Status:', delivery?.status)
      return false
    }

    delivery.status = 'ACCEPTED'
    delivery.driverId = driverId
    delivery.driverName = driverName
    delivery.driverPhone = driverPhone
    delivery.acceptedAt = new Date()

    this.deliveries.set(deliveryId, delivery)
    this.emit('deliveryAccepted', delivery)
    this.emit('deliveriesUpdated', this.getAllDeliveries())

    console.log('✅ Delivery accepted:', deliveryId, 'by driver:', driverName)
    return true
  }

  /**
   * Update delivery status
   */
  updateDeliveryStatus(deliveryId: string, status: Delivery['status']): boolean {
    const delivery = this.deliveries.get(deliveryId)
    
    if (!delivery) {
      console.error('Delivery not found:', deliveryId)
      return false
    }

    const oldStatus = delivery.status
    delivery.status = status

    // Update timestamps
    switch (status) {
      case 'PICKED_UP':
        delivery.pickedUpAt = new Date()
        break
      case 'DELIVERED':
        delivery.deliveredAt = new Date()
        break
    }

    this.deliveries.set(deliveryId, delivery)
    this.emit('deliveryStatusUpdated', { delivery, oldStatus, newStatus: status })
    this.emit('deliveriesUpdated', this.getAllDeliveries())

    console.log('✅ Delivery status updated:', deliveryId, oldStatus, '→', status)
    return true
  }

  /**
   * Get a specific delivery
   */
  getDelivery(deliveryId: string): Delivery | null {
    return this.deliveries.get(deliveryId) || null
  }

  /**
   * Cancel a delivery
   */
  cancelDelivery(deliveryId: string, reason?: string): boolean {
    const delivery = this.deliveries.get(deliveryId)
    
    if (!delivery) {
      console.error('Delivery not found:', deliveryId)
      return false
    }

    if (['DELIVERED', 'CANCELLED'].includes(delivery.status)) {
      console.error('Cannot cancel delivery in status:', delivery.status)
      return false
    }

    delivery.status = 'CANCELLED'
    this.deliveries.set(deliveryId, delivery)
    
    this.emit('deliveryCancelled', { delivery, reason })
    this.emit('deliveriesUpdated', this.getAllDeliveries())

    console.log('✅ Delivery cancelled:', deliveryId, reason)
    return true
  }

  /**
   * Get delivery statistics
   */
  getStats() {
    const allDeliveries = this.getAllDeliveries()
    
    return {
      total: allDeliveries.length,
      pending: allDeliveries.filter(d => d.status === 'PENDING').length,
      accepted: allDeliveries.filter(d => d.status === 'ACCEPTED').length,
      inProgress: allDeliveries.filter(d => ['PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
      completed: allDeliveries.filter(d => d.status === 'DELIVERED').length,
      cancelled: allDeliveries.filter(d => d.status === 'CANCELLED').length
    }
  }

  // Event system for real-time updates
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in event listener:', error)
        }
      })
    }
  }

  /**
   * Clear all deliveries (for testing)
   */
  clearAll() {
    this.deliveries.clear()
    this.emit('deliveriesUpdated', [])
  }

  /**
   * Get delivery count by customer
   */
  getCustomerDeliveryCount(customerId: string): number {
    return this.getCustomerDeliveries(customerId).length
  }

  /**
   * Get active deliveries for customer
   */
  getActiveCustomerDeliveries(customerId: string): Delivery[] {
    return this.getCustomerDeliveries(customerId).filter(d => 
      ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)
    )
  }

  /**
   * Get completed deliveries for customer
   */
  getCompletedCustomerDeliveries(customerId: string): Delivery[] {
    return this.getCustomerDeliveries(customerId).filter(d => 
      d.status === 'DELIVERED'
    )
  }
}

// Export singleton instance
export const deliveryService = new DeliveryService()

// React hook for using delivery service
export const useDeliveries = () => {
  const [deliveries, setDeliveries] = React.useState<Delivery[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Initial load
    setDeliveries(deliveryService.getAllDeliveries())
    setLoading(false)

    // Listen for updates
    const handleDeliveriesUpdate = (updatedDeliveries: Delivery[]) => {
      setDeliveries(updatedDeliveries)
    }

    deliveryService.on('deliveriesUpdated', handleDeliveriesUpdate)

    return () => {
      deliveryService.off('deliveriesUpdated', handleDeliveriesUpdate)
    }
  }, [])

  return {
    deliveries,
    loading,
    createDelivery: deliveryService.createDelivery.bind(deliveryService),
    acceptDelivery: deliveryService.acceptDelivery.bind(deliveryService),
    updateStatus: deliveryService.updateDeliveryStatus.bind(deliveryService),
    cancelDelivery: deliveryService.cancelDelivery.bind(deliveryService),
    getAvailableJobs: deliveryService.getAvailableJobs.bind(deliveryService),
    getCustomerDeliveries: deliveryService.getCustomerDeliveries.bind(deliveryService),
    getDriverDeliveries: deliveryService.getDriverDeliveries.bind(deliveryService),
    getStats: deliveryService.getStats.bind(deliveryService)
  }
}