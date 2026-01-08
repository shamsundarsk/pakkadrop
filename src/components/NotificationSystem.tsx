import React, { useState, useEffect } from 'react'
import { deliveryService } from '../services/deliveryService'
import { CheckCircle, Package, Truck, X } from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'info' | 'warning'
  title: string
  message: string
  timestamp: Date
  autoHide?: boolean
}

const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // Listen for delivery events
    const handleDeliveryCreated = (delivery: any) => {
      addNotification({
        type: 'success',
        title: 'New Order Created',
        message: `Order ${delivery.id} has been created and is now visible to drivers`,
        autoHide: true
      })
    }

    const handleDeliveryAccepted = (delivery: any) => {
      addNotification({
        type: 'info',
        title: 'Order Accepted',
        message: `Driver ${delivery.driverName} has accepted order ${delivery.id}`,
        autoHide: true
      })
    }

    const handleDeliveryStatusUpdate = (data: any) => {
      const { delivery, newStatus } = data
      let message = ''
      
      switch (newStatus) {
        case 'PICKED_UP':
          message = `Order ${delivery.id} has been picked up`
          break
        case 'IN_TRANSIT':
          message = `Order ${delivery.id} is on the way`
          break
        case 'DELIVERED':
          message = `Order ${delivery.id} has been delivered successfully`
          break
        default:
          message = `Order ${delivery.id} status updated to ${newStatus}`
      }

      addNotification({
        type: 'info',
        title: 'Delivery Update',
        message,
        autoHide: true
      })
    }

    // Subscribe to events
    deliveryService.on('deliveryCreated', handleDeliveryCreated)
    deliveryService.on('deliveryAccepted', handleDeliveryAccepted)
    deliveryService.on('deliveryStatusUpdated', handleDeliveryStatusUpdate)

    return () => {
      deliveryService.off('deliveryCreated', handleDeliveryCreated)
      deliveryService.off('deliveryAccepted', handleDeliveryAccepted)
      deliveryService.off('deliveryStatusUpdated', handleDeliveryStatusUpdate)
    }
  }, [])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    setNotifications(prev => [newNotification, ...prev])

    // Auto-hide after 5 seconds if autoHide is true
    if (notification.autoHide) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.slice(0, 5).map((notification) => (
        <div
          key={notification.id}
          className={`bg-white border-l-4 rounded-lg shadow-lg p-4 transition-all duration-300 ${
            notification.type === 'success' 
              ? 'border-green-500' 
              : notification.type === 'info'
              ? 'border-blue-500'
              : 'border-yellow-500'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                notification.type === 'success' 
                  ? 'bg-green-100' 
                  : notification.type === 'info'
                  ? 'bg-blue-100'
                  : 'bg-yellow-100'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : notification.type === 'info' ? (
                  <Package className="w-4 h-4 text-blue-600" />
                ) : (
                  <Truck className="w-4 h-4 text-yellow-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default NotificationSystem