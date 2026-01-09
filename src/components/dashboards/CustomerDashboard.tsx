import React, { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import Map from '../Map'
import AddressAutocomplete from '../AddressAutocomplete'
import EnhancedFareBreakdown from '../EnhancedFareBreakdown'
import { poolingService, createPoolRequest } from '../../services/poolingService'
import { deliveryService, useDeliveries, type Delivery } from '../../services/deliveryService'
import { addressSuggestionService } from '../../services/addressSuggestionService'
import { enhancedPricingService, type DetailedFareBreakdown } from '../../services/enhancedPricingService'
import { 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  Plus,
  Truck,
  Star,
  Phone,
  MessageSquare,
  Navigation,
  Calendar,
  Filter,
  Search,
  Users,
  Calculator,
  Route,
  Scale,
  TrendingDown,
  CheckCircle
} from 'lucide-react'

interface DeliveryForm {
  pickupAddress: string
  pickupCoordinates?: { lat: number; lng: number }
  pickupContactName: string
  pickupContactPhone: string
  dropoffAddress: string
  dropoffCoordinates?: { lat: number; lng: number }
  dropoffContactName: string
  dropoffContactPhone: string
  packageType: string
  weight: number
  vehicleType: string
  specialInstructions: string
  deliveryType: 'EXPRESS' | 'POOL'
  paymentMethod: 'UPI' | 'CARD' | 'CASH'
}

interface VehicleRecommendation {
  vehicleType: string
  suitable: boolean
  reason: string
  estimatedFare: number
}

const CustomerDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'create'>('active')
  const [showCreateDelivery, setShowCreateDelivery] = useState(false)
  
  // Use shared delivery service
  const { deliveries, loading, createDelivery, getCustomerDeliveries, getStats } = useDeliveries()
  
  // Get customer-specific deliveries
  const customerDeliveries = user?.id ? getCustomerDeliveries(user.id) : getCustomerDeliveries('demo_customer_1')
  const activeDeliveries = customerDeliveries.filter(d => 
    ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)
  )
  const completedDeliveries = customerDeliveries.filter(d => 
    d.status === 'DELIVERED'
  )
  
  // Listen for real-time delivery updates
  useEffect(() => {
    const handleDeliveryAccepted = (delivery: any) => {
      if (delivery.customerId === user?.id) {
        console.log('✅ Your delivery was accepted by driver:', delivery.driverName)
        // The deliveries will automatically update through the useDeliveries hook
      }
    }

    const handleDeliveryStatusUpdate = (data: any) => {
      const { delivery } = data
      if (delivery.customerId === user?.id) {
        console.log('✅ Your delivery status updated:', delivery.status)
        // The deliveries will automatically update through the useDeliveries hook
      }
    }

    // Subscribe to delivery events
    deliveryService.on('deliveryAccepted', handleDeliveryAccepted)
    deliveryService.on('deliveryStatusUpdated', handleDeliveryStatusUpdate)

    return () => {
      deliveryService.off('deliveryAccepted', handleDeliveryAccepted)
      deliveryService.off('deliveryStatusUpdated', handleDeliveryStatusUpdate)
    }
  }, [user?.id])
  
  // Calculate stats
  const stats = {
    totalDeliveries: customerDeliveries.length,
    activeDeliveries: activeDeliveries.length,
    monthlySpent: customerDeliveries.reduce((sum, d) => sum + d.fare, 0),
    savedAmount: customerDeliveries
      .filter(d => d.deliveryType === 'POOL')
      .reduce((sum, d) => sum + (d.fare * 0.4), 0) // 40% savings calculation
  }
  
  // Form state for creating new delivery
  const [deliveryForm, setDeliveryForm] = useState<DeliveryForm>({
    pickupAddress: '',
    pickupContactName: '',
    pickupContactPhone: '',
    dropoffAddress: '',
    dropoffContactName: '',
    dropoffContactPhone: '',
    packageType: '',
    weight: 1,
    vehicleType: '',
    specialInstructions: '',
    deliveryType: 'POOL', // Default to pool for savings
    paymentMethod: 'UPI' // Default to UPI
  })

  // Enhanced pricing state
  const [fareBreakdown, setFareBreakdown] = useState<DetailedFareBreakdown | null>(null)
  const [vehicleRecommendations, setVehicleRecommendations] = useState<VehicleRecommendation[]>([])
  const [distance, setDistance] = useState<number>(0)
  const [calculatingFare, setCalculatingFare] = useState(false)
  const [fareCalculated, setFareCalculated] = useState(false)

  // Fare calculation based on form data
  const calculateFare = async () => {
    if (!deliveryForm.pickupCoordinates || !deliveryForm.dropoffCoordinates || !deliveryForm.vehicleType || deliveryForm.weight <= 0) {
      alert('Please fill in pickup address, dropoff address, vehicle type, and weight')
      return
    }

    setCalculatingFare(true)
    try {
      // Calculate distance between pickup and dropoff
      const calculatedDistance = addressSuggestionService['calculateDistance'](
        deliveryForm.pickupCoordinates.lat,
        deliveryForm.pickupCoordinates.lng,
        deliveryForm.dropoffCoordinates.lat,
        deliveryForm.dropoffCoordinates.lng
      )
      
      setDistance(calculatedDistance)

      // Calculate enhanced fare
      const fareDetails = enhancedPricingService.calculateAutoFare(
        calculatedDistance,
        deliveryForm.weight,
        deliveryForm.vehicleType as any,
        deliveryForm.deliveryType,
        deliveryForm.packageType
      )

      setFareBreakdown(fareDetails)
      setFareCalculated(true)

      // Get vehicle recommendations
      const recommendations = enhancedPricingService.getVehicleRecommendations(
        deliveryForm.weight,
        calculatedDistance
      )
      setVehicleRecommendations(recommendations)

    } catch (error) {
      console.error('Error calculating fare:', error)
      alert('Error calculating fare. Please try again.')
    } finally {
      setCalculatingFare(false)
    }
  }

  // Auto-calculate fare when key fields change
  useEffect(() => {
    if (deliveryForm.pickupCoordinates && 
        deliveryForm.dropoffCoordinates && 
        deliveryForm.vehicleType && 
        deliveryForm.weight > 0) {
      const debounceTimer = setTimeout(() => {
        calculateFare()
      }, 1000) // Auto-calculate after 1 second of no changes
      
      return () => clearTimeout(debounceTimer)
    } else {
      setFareBreakdown(null)
      setFareCalculated(false)
    }
  }, [
    deliveryForm.pickupCoordinates,
    deliveryForm.dropoffCoordinates,
    deliveryForm.vehicleType,
    deliveryForm.weight,
    deliveryForm.deliveryType,
    deliveryForm.packageType
  ])

  // Handle form input changes
  const handleFormChange = (field: keyof DeliveryForm, value: string | number) => {
    setDeliveryForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle address changes with coordinates
  const handleAddressChange = (field: 'pickupAddress' | 'dropoffAddress', address: string, coordinates?: { lat: number; lng: number }) => {
    const coordinateField = field === 'pickupAddress' ? 'pickupCoordinates' : 'dropoffCoordinates'
    setDeliveryForm(prev => ({
      ...prev,
      [field]: address,
      [coordinateField]: coordinates
    }))
  }

  // Handle form submission
  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!deliveryForm.pickupAddress || !deliveryForm.dropoffAddress || !deliveryForm.packageType || !fareBreakdown) {
      alert('Please fill in all required fields and calculate fare')
      return
    }

    if (!user?.id) {
      alert('Please log in to create a delivery')
      return
    }

    try {
      console.log('Creating delivery:', deliveryForm)
      
      // Create delivery with enhanced data
      const newDelivery: Omit<Delivery, 'id' | 'createdAt'> = {
        customerId: user.id,
        customerName: user.name || 'Customer',
        customerPhone: user.phone || '',
        status: 'PENDING',
        pickup: {
          address: deliveryForm.pickupAddress,
          contactName: deliveryForm.pickupContactName || user.name || '',
          contactPhone: deliveryForm.pickupContactPhone || user.phone || '',
          lat: deliveryForm.pickupCoordinates?.lat,
          lng: deliveryForm.pickupCoordinates?.lng
        },
        dropoff: {
          address: deliveryForm.dropoffAddress,
          contactName: deliveryForm.dropoffContactName,
          contactPhone: deliveryForm.dropoffContactPhone,
          lat: deliveryForm.dropoffCoordinates?.lat,
          lng: deliveryForm.dropoffCoordinates?.lng
        },
        packageType: deliveryForm.packageType,
        weight: deliveryForm.weight,
        vehicleType: deliveryForm.vehicleType,
        deliveryType: deliveryForm.deliveryType,
        paymentMethod: deliveryForm.paymentMethod,
        specialInstructions: deliveryForm.specialInstructions,
        fare: fareBreakdown.totalFare,
        distance: `${distance.toFixed(1)} km`,
        estimatedTime: `${fareBreakdown.estimatedTime} min`
      }

      await createDelivery(newDelivery)
      
      // Reset form
      setDeliveryForm({
        pickupAddress: '',
        pickupContactName: '',
        pickupContactPhone: '',
        dropoffAddress: '',
        dropoffContactName: '',
        dropoffContactPhone: '',
        packageType: '',
        weight: 1,
        vehicleType: '',
        specialInstructions: '',
        deliveryType: 'POOL',
        paymentMethod: 'UPI'
      })
      setFareBreakdown(null)
      setFareCalculated(false)
      setShowCreateDelivery(false)
      setActiveTab('active')
      
      alert('Delivery created successfully! Drivers will be notified.')
    } catch (error) {
      console.error('Error creating delivery:', error)
      alert('Error creating delivery. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800'
      case 'PICKED_UP': return 'bg-purple-100 text-purple-800'
      case 'IN_TRANSIT': return 'bg-orange-100 text-orange-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Finding Driver'
      case 'ACCEPTED': return 'Driver Assigned'
      case 'PICKED_UP': return 'Package Picked Up'
      case 'IN_TRANSIT': return 'On the Way'
      case 'DELIVERED': return 'Delivered'
      case 'CANCELLED': return 'Cancelled'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">PakkaDrop Customer</h1>
                <p className="text-sm text-slate-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateDelivery(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Delivery</span>
              </button>
              
              <button 
                onClick={logout}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalDeliveries}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-blue-600">5 this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Deliveries</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeDeliveries}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-orange-600">In progress</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Monthly Spent</p>
                <p className="text-2xl font-bold text-slate-900">₹{stats.monthlySpent}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">Average ₹278 per delivery</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Money Saved</p>
                <p className="text-2xl font-bold text-slate-900">₹{stats.savedAmount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-purple-600">vs traditional services</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'active', label: 'Active Deliveries', count: stats.activeDeliveries },
                { id: 'history', label: 'Delivery History', count: stats.totalDeliveries - stats.activeDeliveries },
                { id: 'create', label: 'Create Delivery' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'active' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Active Deliveries ({activeDeliveries.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <strong>Debug Info:</strong> 
                    <br />Total deliveries: {customerDeliveries.length}
                    <br />Active deliveries: {activeDeliveries.length}
                    <br />Customer ID: {user?.id}
                    <br />Loading: {loading ? 'Yes' : 'No'}
                  </div>
                )}

                {activeDeliveries.map((delivery) => (
                  <div key={delivery.id} className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                          {getStatusText(delivery.status)}
                        </span>
                        <span className="text-sm text-slate-600">#{delivery.id}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-900">₹{delivery.fare}</p>
                        <p className="text-sm text-slate-600">{delivery.distance} • {delivery.estimatedTime}</p>
                      </div>
                    </div>

                    {/* Live Map for Active Deliveries */}
                    {['IN_TRANSIT', 'PICKED_UP'].includes(delivery.status) && (
                      <div className="mb-4">
                        <Map
                          pickup={{ 
                            lat: 19.0760, 
                            lng: 72.8777, 
                            address: delivery.pickup.address 
                          }}
                          dropoff={{ 
                            lat: 19.1136, 
                            lng: 72.8697, 
                            address: delivery.dropoff.address 
                          }}
                          driverLocation={{ lat: 19.0950, lng: 72.8737 }}
                          height="200px"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">Pickup Details</h4>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600">{delivery.pickup.address}</p>
                          <p className="text-sm text-slate-600">{delivery.pickup.contactName}</p>
                          <p className="text-sm text-slate-600">{delivery.pickup.contactPhone}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">Dropoff Details</h4>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600">{delivery.dropoff.address}</p>
                          <p className="text-sm text-slate-600">{delivery.dropoff.contactName}</p>
                          <p className="text-sm text-slate-600">{delivery.dropoff.contactPhone}</p>
                        </div>
                      </div>
                    </div>

                    {delivery.driverName && (
                      <div className="bg-slate-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-slate-900 mb-2">Driver Information</h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-slate-700">
                                {delivery.driverName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{delivery.driverName}</p>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-slate-600">4.8</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300">
                              <Phone className="w-4 h-4 text-slate-600" />
                            </button>
                            <button className="p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300">
                              <MessageSquare className="w-4 h-4 text-slate-600" />
                            </button>
                            <button className="p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300">
                              <Navigation className="w-4 h-4 text-slate-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Package className="w-4 h-4" />
                          <span>{delivery.packageType} • {delivery.weight} kg</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(delivery.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button className="text-slate-900 hover:text-slate-700 font-medium text-sm">
                        Track Delivery →
                      </button>
                    </div>
                  </div>
                ))}

                {activeDeliveries.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No active deliveries</h3>
                    <p className="text-slate-600 mb-4">Create a new delivery to get started</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Create Delivery
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Delivery History</h3>
                
                {completedDeliveries.length > 0 ? (
                  <div className="space-y-4">
                    {completedDeliveries.map((delivery) => (
                      <div key={delivery.id} className="border border-slate-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                              DELIVERED
                            </span>
                            <span className="text-sm text-slate-600">#{delivery.id}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-slate-900">₹{delivery.fare}</p>
                            <p className="text-sm text-slate-600">{delivery.distance} • {delivery.estimatedTime}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-slate-700">From</p>
                            <p className="text-slate-900">{delivery.pickup.address}</p>
                            <p className="text-sm text-slate-600">{delivery.pickup.contactName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">To</p>
                            <p className="text-slate-900">{delivery.dropoff.address}</p>
                            <p className="text-sm text-slate-600">{delivery.dropoff.contactName}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <div className="flex items-center space-x-4">
                            <span>{delivery.packageType} • {delivery.weight}kg</span>
                            <span>{delivery.deliveryType === 'POOL' ? 'Pool Delivery' : 'Express Delivery'}</span>
                          </div>
                          <span>Delivered on {new Date(delivery.deliveredAt || delivery.createdAt).toLocaleDateString()}</span>
                        </div>

                        {delivery.driverName && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-slate-700">Delivered by</p>
                                <p className="text-slate-900">{delivery.driverName}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                  Rate Driver
                                </button>
                                <button className="text-slate-600 hover:text-slate-700 text-sm font-medium">
                                  Reorder
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No delivery history</h3>
                    <p className="text-slate-600">Your completed deliveries will appear here</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Create New Delivery</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-blue-800 font-medium">Quick & Fair Pricing</p>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    Get transparent pricing with no hidden charges. Pay only what's fair.
                  </p>
                </div>

                {/* Delivery Type Selection */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Delivery Type</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div 
                      onClick={() => handleFormChange('deliveryType', 'EXPRESS')}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        deliveryForm.deliveryType === 'EXPRESS' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Express Delivery</p>
                          <p className="text-sm text-slate-600">Fast, direct delivery</p>
                          <p className="text-xs text-blue-600 font-medium">Standard pricing</p>
                        </div>
                      </div>
                    </div>
                    <div 
                      onClick={() => handleFormChange('deliveryType', 'POOL')}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        deliveryForm.deliveryType === 'POOL' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Pool Delivery</p>
                          <p className="text-sm text-slate-600">Share ride, save money</p>
                          <p className="text-xs text-green-600 font-medium">Save up to 40%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitDelivery} className="space-y-8">
                  {/* Address Section */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h4 className="font-semibold text-slate-900 mb-6 flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-slate-600" />
                      <span>Delivery Addresses</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <h5 className="font-medium text-slate-900">Pickup Details</h5>
                        </div>
                        
                        <AddressAutocomplete
                          label="Pickup Address"
                          value={deliveryForm.pickupAddress}
                          onChange={(address, coordinates) => handleAddressChange('pickupAddress', address, coordinates)}
                          placeholder="Enter pickup address"
                          required
                          showPopularDestinations
                        />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                            <input
                              type="text"
                              value={deliveryForm.pickupContactName}
                              onChange={(e) => handleFormChange('pickupContactName', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                              placeholder="Contact person"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                            <input
                              type="tel"
                              value={deliveryForm.pickupContactPhone}
                              onChange={(e) => handleFormChange('pickupContactPhone', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                              placeholder="+91 98765 43210"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <h5 className="font-medium text-slate-900">Dropoff Details</h5>
                        </div>
                        
                        <AddressAutocomplete
                          label="Dropoff Address"
                          value={deliveryForm.dropoffAddress}
                          onChange={(address, coordinates) => handleAddressChange('dropoffAddress', address, coordinates)}
                          placeholder="Enter dropoff address"
                          required
                          showPopularDestinations
                        />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                            <input
                              type="text"
                              value={deliveryForm.dropoffContactName}
                              onChange={(e) => handleFormChange('dropoffContactName', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                              placeholder="Contact person"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                            <input
                              type="tel"
                              value={deliveryForm.dropoffContactPhone}
                              onChange={(e) => handleFormChange('dropoffContactPhone', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                              placeholder="+91 98765 43210"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Package Details Section */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h4 className="font-semibold text-slate-900 mb-6 flex items-center space-x-2">
                      <Package className="w-5 h-5 text-slate-600" />
                      <span>Package Information</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Package Type *</label>
                        <select 
                          required
                          value={deliveryForm.packageType}
                          onChange={(e) => handleFormChange('packageType', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                        >
                          <option value="">Select package type</option>
                          <option value="documents">📄 Documents</option>
                          <option value="electronics">📱 Electronics</option>
                          <option value="clothing">👕 Clothing</option>
                          <option value="food">🍕 Food Items</option>
                          <option value="fragile">🔸 Fragile Items</option>
                          <option value="other">📦 Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center space-x-1">
                          <Scale className="w-4 h-4" />
                          <span>Weight (kg) *</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="1000"
                          required
                          value={deliveryForm.weight || ''}
                          onChange={(e) => handleFormChange('weight', parseFloat(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                          placeholder="1.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type *</label>
                        <select 
                          required
                          value={deliveryForm.vehicleType}
                          onChange={(e) => handleFormChange('vehicleType', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                        >
                          <option value="">Select vehicle</option>
                          <option value="bike">🏍️ Bike (up to 10kg)</option>
                          <option value="auto">🛺 Auto Rickshaw (up to 50kg)</option>
                          <option value="mini-truck">🚛 Mini Truck (up to 500kg)</option>
                          <option value="pickup">🚚 Pickup Truck (up to 1000kg)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Special Instructions</label>
                      <textarea
                        rows={3}
                        value={deliveryForm.specialInstructions}
                        onChange={(e) => handleFormChange('specialInstructions', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                        placeholder="Any special handling instructions..."
                      ></textarea>
                    </div>
                  </div>

                  {/* Vehicle Recommendations */}
                  {vehicleRecommendations.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                      <h4 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Truck className="w-5 h-5 text-amber-600" />
                        <span>Vehicle Recommendations</span>
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
                          Based on weight & distance
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vehicleRecommendations.map((rec) => (
                          <div
                            key={rec.vehicleType}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              rec.suitable
                                ? deliveryForm.vehicleType === rec.vehicleType
                                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                                  : 'border-green-300 bg-green-50 hover:border-green-400 hover:shadow-md'
                                : 'border-red-300 bg-red-50 opacity-75 cursor-not-allowed'
                            }`}
                            onClick={() => rec.suitable && handleFormChange('vehicleType', rec.vehicleType)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-lg">
                                    {rec.vehicleType === 'bike' ? '🏍️' : 
                                     rec.vehicleType === 'auto' ? '🛺' : 
                                     rec.vehicleType === 'mini-truck' ? '🚛' : '🚚'}
                                  </span>
                                  <div className="font-semibold text-slate-900 capitalize">
                                    {rec.vehicleType.replace('-', ' ')}
                                  </div>
                                  {rec.suitable && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </div>
                                <div className={`text-sm ${rec.suitable ? 'text-green-600' : 'text-red-600'}`}>
                                  {rec.reason}
                                </div>
                              </div>
                              {rec.suitable && (
                                <div className="text-right">
                                  <div className="font-bold text-slate-900 text-lg">
                                    ₹{rec.estimatedFare}
                                  </div>
                                  <div className="text-xs text-slate-500">estimated</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delivery Type Selection - Single, Improved Design */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-slate-600" />
                      <span>Choose Delivery Type</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        onClick={() => handleFormChange('deliveryType', 'POOL')}
                        className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                          deliveryForm.deliveryType === 'POOL' 
                            ? 'border-green-500 bg-green-50 shadow-lg transform scale-105' 
                            : 'border-slate-200 hover:border-green-300 hover:shadow-md'
                        }`}
                      >
                        {deliveryForm.deliveryType === 'POOL' && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h5 className="font-semibold text-slate-900">Pool Delivery</h5>
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                Save 40%
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">
                              Share delivery with others going in the same direction
                            </p>
                            <div className="space-y-1 text-xs text-slate-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>45-60 minutes</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <TrendingDown className="w-3 h-3" />
                                <span>Eco-friendly option</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        onClick={() => handleFormChange('deliveryType', 'EXPRESS')}
                        className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                          deliveryForm.deliveryType === 'EXPRESS' 
                            ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105' 
                            : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        {deliveryForm.deliveryType === 'EXPRESS' && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Clock className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h5 className="font-semibold text-slate-900">Express Delivery</h5>
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                                Fast
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">
                              Direct delivery with priority handling
                            </p>
                            <div className="space-y-1 text-xs text-slate-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>25-35 minutes</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Navigation className="w-3 h-3" />
                                <span>Direct route</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Special Instructions</label>
                    <textarea
                      rows={3}
                      value={deliveryForm.specialInstructions}
                      onChange={(e) => handleFormChange('specialInstructions', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                      placeholder="Any special handling instructions..."
                    ></textarea>
                  </div>

                  {/* Enhanced Fare Breakdown */}
                  {fareBreakdown && (
                    <EnhancedFareBreakdown
                      fareBreakdown={fareBreakdown}
                      distance={distance}
                      weight={deliveryForm.weight}
                      vehicleType={deliveryForm.vehicleType}
                      deliveryType={deliveryForm.deliveryType}
                      className="mt-6"
                    />
                  )}

                  {/* Payment Method */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-slate-600" />
                      <span>Payment Method</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div 
                        onClick={() => handleFormChange('paymentMethod', 'UPI')}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          deliveryForm.paymentMethod === 'UPI' 
                            ? 'border-blue-500 bg-blue-50 shadow-lg' 
                            : 'border-slate-300 hover:border-slate-400 hover:shadow-md'
                        }`}
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">💳</span>
                          </div>
                          <p className="font-semibold text-slate-900 mb-1">UPI</p>
                          <p className="text-xs text-slate-600">PhonePe, GPay, Paytm</p>
                          {deliveryForm.paymentMethod === 'UPI' && (
                            <div className="mt-2">
                              <CheckCircle className="w-4 h-4 text-blue-500 mx-auto" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div 
                        onClick={() => handleFormChange('paymentMethod', 'CARD')}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          deliveryForm.paymentMethod === 'CARD' 
                            ? 'border-blue-500 bg-blue-50 shadow-lg' 
                            : 'border-slate-300 hover:border-slate-400 hover:shadow-md'
                        }`}
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">💳</span>
                          </div>
                          <p className="font-semibold text-slate-900 mb-1">Card</p>
                          <p className="text-xs text-slate-600">Credit/Debit Card</p>
                          {deliveryForm.paymentMethod === 'CARD' && (
                            <div className="mt-2">
                              <CheckCircle className="w-4 h-4 text-blue-500 mx-auto" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div 
                        onClick={() => handleFormChange('paymentMethod', 'CASH')}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          deliveryForm.paymentMethod === 'CASH' 
                            ? 'border-blue-500 bg-blue-50 shadow-lg' 
                            : 'border-slate-300 hover:border-slate-400 hover:shadow-md'
                        }`}
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">💵</span>
                          </div>
                          <p className="font-semibold text-slate-900 mb-1">Cash</p>
                          <p className="text-xs text-slate-600">Pay on delivery</p>
                          {deliveryForm.paymentMethod === 'CASH' && (
                            <div className="mt-2">
                              <CheckCircle className="w-4 h-4 text-blue-500 mx-auto" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Section */}
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        {fareBreakdown && deliveryForm.deliveryType === 'POOL' && (
                          <div className="flex items-center space-x-2 text-green-600 mb-2">
                            <TrendingDown className="w-5 h-5" />
                            <span className="font-semibold">Pool delivery saves you ₹{fareBreakdown.poolDiscount.toFixed(0)}</span>
                          </div>
                        )}
                        <p className="text-sm text-slate-600">
                          {fareBreakdown ? (
                            <>
                              <Clock className="w-4 h-4 inline mr-1" />
                              Estimated delivery: {fareBreakdown.estimatedTime} minutes
                            </>
                          ) : (
                            'Fill in all details to see estimated delivery time'
                          )}
                        </p>
                        {distance > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            Distance: {distance.toFixed(1)} km
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          onClick={calculateFare}
                          disabled={calculatingFare || !deliveryForm.pickupCoordinates || !deliveryForm.dropoffCoordinates || !deliveryForm.vehicleType || deliveryForm.weight <= 0}
                          className="px-6 py-3 border-2 border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium transition-all duration-200"
                        >
                          {calculatingFare ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500"></div>
                              <span>Calculating...</span>
                            </>
                          ) : (
                            <>
                              <Calculator className="w-4 h-4" />
                              <span>Calculate Fare</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          type="submit"
                          disabled={!fareCalculated || !fareBreakdown}
                          className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                          <DollarSign className="w-5 h-5" />
                          <span>
                            {fareBreakdown ? `Pay & Book ₹${fareBreakdown.totalFare}` : 'Calculate Fare First'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerDashboard