// Real-time Service - Handles seamless connectivity between customers and drivers
// Uses WebSocket/Socket.io for live updates and communication

import React from 'react'

export interface DeliveryUpdate {
  deliveryId: string
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  driverLocation?: {
    lat: number
    lng: number
    heading?: number
  }
  estimatedArrival?: string
  message?: string
  timestamp: Date
}

export interface ChatMessage {
  id: string
  deliveryId: string
  senderId: string
  senderType: 'CUSTOMER' | 'DRIVER'
  message: string
  timestamp: Date
  type: 'text' | 'location' | 'photo' | 'voice'
}

class RealtimeService {
  private socket: WebSocket | null = null
  private listeners: Map<string, Function[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    this.connect()
  }

  /**
   * Connect to WebSocket server
   */
  private connect() {
    try {
      // In production, this would be your actual WebSocket server
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5004'
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        console.log('✅ Real-time connection established')
        this.reconnectAttempts = 0
        this.emit('connected', true)
      }

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.socket.onclose = () => {
        console.log('❌ Real-time connection closed')
        this.emit('connected', false)
        this.attemptReconnect()
      }

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      this.attemptReconnect()
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, delay)
    } else {
      console.error('Max reconnection attempts reached. Please refresh the page.')
      this.emit('maxReconnectAttemptsReached', true)
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any) {
    const { type, payload } = data

    switch (type) {
      case 'delivery_update':
        this.emit('deliveryUpdate', payload as DeliveryUpdate)
        break
      case 'driver_location':
        this.emit('driverLocation', payload)
        break
      case 'chat_message':
        this.emit('chatMessage', payload as ChatMessage)
        break
      case 'job_accepted':
        this.emit('jobAccepted', payload)
        break
      case 'pool_matched':
        this.emit('poolMatched', payload)
        break
      default:
        console.log('Unknown message type:', type, payload)
    }
  }

  /**
   * Send message to server
   */
  private send(type: string, payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }))
    } else {
      console.warn('WebSocket not connected. Message not sent:', type, payload)
    }
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  /**
   * Emit events to listeners
   */
  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data))
    }
  }

  // Customer Methods

  /**
   * Track a delivery in real-time
   */
  trackDelivery(deliveryId: string) {
    this.send('track_delivery', { deliveryId })
  }

  /**
   * Send message to driver
   */
  sendMessageToDriver(deliveryId: string, message: string) {
    const chatMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      deliveryId,
      senderId: 'customer_id', // In real app, get from auth context
      senderType: 'CUSTOMER',
      message,
      type: 'text'
    }
    
    this.send('send_message', chatMessage)
  }

  /**
   * Share location with driver
   */
  shareLocationWithDriver(deliveryId: string, location: {lat: number, lng: number}) {
    this.send('share_location', { deliveryId, location, senderType: 'CUSTOMER' })
  }

  // Driver Methods

  /**
   * Update driver location
   */
  updateDriverLocation(driverId: string, location: {lat: number, lng: number, heading?: number}) {
    this.send('driver_location_update', { driverId, ...location })
  }

  /**
   * Accept a delivery job
   */
  acceptJob(jobId: string, driverId: string) {
    this.send('accept_job', { jobId, driverId })
  }

  /**
   * Update delivery status
   */
  updateDeliveryStatus(deliveryId: string, status: DeliveryUpdate['status'], message?: string) {
    const update: DeliveryUpdate = {
      deliveryId,
      status,
      message,
      timestamp: new Date()
    }
    
    this.send('delivery_status_update', update)
  }

  /**
   * Send message to customer
   */
  sendMessageToCustomer(deliveryId: string, message: string) {
    const chatMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      deliveryId,
      senderId: 'driver_id', // In real app, get from auth context
      senderType: 'DRIVER',
      message,
      type: 'text'
    }
    
    this.send('send_message', chatMessage)
  }

  /**
   * Request customer location
   */
  requestCustomerLocation(deliveryId: string) {
    this.send('request_location', { deliveryId, requesterType: 'DRIVER' })
  }

  // Pool Methods

  /**
   * Join pool delivery tracking
   */
  joinPoolTracking(poolId: string) {
    this.send('join_pool', { poolId })
  }

  /**
   * Update pool status
   */
  updatePoolStatus(poolId: string, status: string, updates: any) {
    this.send('pool_update', { poolId, status, updates })
  }

  // Utility Methods

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.socket) return 'disconnected'
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected'
      default:
        return 'error'
    }
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()

// React hook for using real-time service
export const useRealtime = () => {
  const [isConnected, setIsConnected] = React.useState(false)
  const [connectionStatus, setConnectionStatus] = React.useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')

  React.useEffect(() => {
    const handleConnection = (connected: boolean) => {
      setIsConnected(connected)
      setConnectionStatus(connected ? 'connected' : 'disconnected')
    }

    const handleError = () => {
      setConnectionStatus('error')
    }

    realtimeService.on('connected', handleConnection)
    realtimeService.on('error', handleError)

    // Initial status
    setIsConnected(realtimeService.isConnected())
    setConnectionStatus(realtimeService.getConnectionStatus())

    return () => {
      realtimeService.off('connected', handleConnection)
      realtimeService.off('error', handleError)
    }
  }, [])

  return {
    isConnected,
    connectionStatus,
    service: realtimeService
  }
}

// Mock WebSocket for development (when real server is not available)
export class MockRealtimeService {
  private listeners: Map<string, Function[]> = new Map()

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
      eventListeners.forEach(callback => callback(data))
    }
  }

  // Mock methods that simulate real-time updates
  trackDelivery(deliveryId: string) {
    console.log('Mock: Tracking delivery', deliveryId)
    
    // Simulate status updates
    setTimeout(() => {
      this.emit('deliveryUpdate', {
        deliveryId,
        status: 'ACCEPTED',
        message: 'Driver has accepted your delivery',
        timestamp: new Date()
      })
    }, 2000)

    setTimeout(() => {
      this.emit('driverLocation', {
        deliveryId,
        location: { lat: 19.0760, lng: 72.8777, heading: 45 }
      })
    }, 5000)
  }

  acceptJob(jobId: string, driverId: string) {
    console.log('Mock: Job accepted', jobId, driverId)
    
    setTimeout(() => {
      this.emit('jobAccepted', {
        jobId,
        driverId,
        message: 'Job accepted successfully'
      })
    }, 1000)
  }

  sendMessageToDriver(deliveryId: string, message: string) {
    console.log('Mock: Message sent to driver', deliveryId, message)
  }

  sendMessageToCustomer(deliveryId: string, message: string) {
    console.log('Mock: Message sent to customer', deliveryId, message)
  }

  updateDriverLocation(driverId: string, location: any) {
    console.log('Mock: Driver location updated', driverId, location)
  }

  isConnected() {
    return true
  }

  getConnectionStatus() {
    return 'connected' as const
  }
}

// Use mock service in development if WebSocket server is not available
const isDevelopment = process.env.NODE_ENV === 'development'
export const mockRealtimeService = new MockRealtimeService()