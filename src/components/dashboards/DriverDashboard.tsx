import React, { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { deliveryService, useDeliveries, type Delivery } from '../../services/deliveryService'
import { 
  Truck, 
  MapPin, 
  Clock, 
  DollarSign, 
  Package, 
  Star,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Wallet
} from 'lucide-react'



const DriverDashboard = () => {
  const { user, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<string>('Mumbai, Maharashtra')
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings' | 'profile'>('jobs')
  const [acceptedJobs, setAcceptedJobs] = useState<string[]>([]) // Track accepted job IDs
  
  // Use shared delivery service
  const { deliveries, loading, acceptDelivery, getAvailableJobs, getDriverDeliveries } = useDeliveries()
  
  // Get available jobs and driver's deliveries
  const availableJobs = getAvailableJobs()
  const driverDeliveries = user?.id ? getDriverDeliveries(user.id) : []
  
  // Calculate stats from actual deliveries
  const stats = {
    todayEarnings: driverDeliveries
      .filter(d => {
        const today = new Date()
        const deliveryDate = new Date(d.createdAt)
        return deliveryDate.toDateString() === today.toDateString() && d.status === 'DELIVERED'
      })
      .reduce((sum, d) => sum + d.fare, 0),
    weeklyEarnings: driverDeliveries
      .filter(d => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(d.createdAt) >= weekAgo && d.status === 'DELIVERED'
      })
      .reduce((sum, d) => sum + d.fare, 0),
    monthlyEarnings: driverDeliveries
      .filter(d => {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return new Date(d.createdAt) >= monthAgo && d.status === 'DELIVERED'
      })
      .reduce((sum, d) => sum + d.fare, 0),
    completedDeliveries: driverDeliveries.filter(d => d.status === 'DELIVERED').length,
    rating: 4.8, // Mock rating - in real app, calculate from reviews
    totalDistance: '2,450 km' // Mock - in real app, sum from all deliveries
  }

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline)
    if (!isOnline) {
      // Simulate getting current location when going online
      navigator.geolocation?.getCurrentPosition(
        (position) => {
          console.log('Location updated:', position.coords)
          // In real app, this would update the driver's location in the database
        },
        (error) => {
          console.error('Location error:', error)
        }
      )
    }
  }

  const acceptJob = async (jobId: string) => {
    if (!isOnline) {
      alert('Please go online first to accept jobs')
      return
    }

    if (!user?.id || !user?.name) {
      alert('Please complete your profile to accept jobs')
      return
    }

    try {
      console.log('Accepting job:', jobId)
      
      // Accept the delivery using shared service
      const success = acceptDelivery(
        jobId, 
        user.id, 
        user.name, 
        user.phone || ''
      )
      
      if (success) {
        // Add to accepted jobs for UI feedback
        setAcceptedJobs(prev => [...prev, jobId])
        
        // Show success message
        alert(`🎉 Job ${jobId} accepted successfully! Customer has been notified.`)
        
        console.log('✅ Job accepted successfully')
      } else {
        alert('Failed to accept job. It may have been taken by another driver.')
      }
      
    } catch (error) {
      console.error('Error accepting job:', error)
      alert('Failed to accept job. Please try again.')
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
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">FairLoad Driver</h1>
                <p className="text-sm text-slate-600">{user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Online Status Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-700">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <button
                  onClick={toggleOnlineStatus}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isOnline ? 'bg-green-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isOnline ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
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
        {/* Status Banner */}
        <div className={`rounded-lg p-4 mb-6 ${
          isOnline 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <div>
                <p className={`font-medium ${
                  isOnline ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {isOnline ? 'You are online and ready for deliveries' : 'You are offline'}
                </p>
                <p className={`text-sm ${
                  isOnline ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Current location: {currentLocation}
                </p>
              </div>
            </div>
            {!isOnline && (
              <button
                onClick={toggleOnlineStatus}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Go Online
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Today's Earnings</p>
                <p className="text-2xl font-bold text-slate-900">₹{stats.todayEarnings}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+12% from yesterday</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completed Trips</p>
                <p className="text-2xl font-bold text-slate-900">{stats.completedDeliveries}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-blue-600">8 completed today</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Rating</p>
                <p className="text-2xl font-bold text-slate-900">{stats.rating}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Star className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-yellow-600">Based on 142 reviews</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Distance Covered</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalDistance}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Navigation className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <MapPin className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-purple-600">45 km today</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'jobs', label: 'Available Jobs', icon: Package },
                { id: 'earnings', label: 'Earnings', icon: Wallet },
                { id: 'profile', label: 'Profile', icon: Truck }
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
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Available Delivery Jobs
                  </h3>
                  <span className="text-sm text-slate-600">
                    {availableJobs.length} jobs available
                  </span>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-2"></div>
                    <p className="text-slate-600">Loading jobs...</p>
                  </div>
                ) : availableJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No jobs available</h3>
                    <p className="text-slate-600">
                      {isOnline ? 'New delivery requests will appear here' : 'Go online to see available jobs'}
                    </p>
                  </div>
                ) : (
                  availableJobs.map((job) => {
                    const isAccepted = acceptedJobs.includes(job.id) || job.driverId === user?.id
                    
                    return (
                      <div key={job.id} className={`border rounded-lg p-4 transition-colors ${
                        isAccepted 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-3">
                              <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                                isAccepted 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {isAccepted ? 'ACCEPTED' : job.packageType}
                              </span>
                              <span className="text-sm text-slate-600">{job.weight} kg</span>
                              {job.deliveryType === 'POOL' && (
                                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded">
                                  POOL
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-start space-x-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5"></div>
                                <div>
                                  <p className="font-medium text-slate-900">{job.pickup.address}</p>
                                  <p className="text-sm text-slate-600">{job.pickup.contactName}</p>
                                  <p className="text-xs text-slate-500">{job.pickup.contactPhone}</p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                                <div>
                                  <p className="font-medium text-slate-900">{job.dropoff.address}</p>
                                  <p className="text-sm text-slate-600">{job.dropoff.contactName}</p>
                                  <p className="text-xs text-slate-500">{job.dropoff.contactPhone}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-slate-600">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{job.distance}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{job.estimatedTime}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>{job.paymentMethod}</span>
                              </div>
                            </div>

                            {job.specialInstructions && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                                <strong>Instructions:</strong> {job.specialInstructions}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-slate-900">₹{job.fare}</p>
                            {isAccepted ? (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center text-green-600 text-sm">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  <span>Job Accepted</span>
                                </div>
                                <div className="flex space-x-2">
                                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                                    <Navigation className="w-3 h-3 inline mr-1" />
                                    Navigate
                                  </button>
                                  <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                                    <Phone className="w-3 h-3 inline mr-1" />
                                    Call
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => acceptJob(job.id)}
                                disabled={!isOnline}
                                className={`mt-3 px-4 py-2 rounded-lg font-medium ${
                                  isOnline
                                    ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {isOnline ? 'Accept Job' : 'Go Online First'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Earnings Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600">This Week</p>
                    <p className="text-2xl font-bold text-slate-900">₹{stats.weeklyEarnings}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600">This Month</p>
                    <p className="text-2xl font-bold text-slate-900">₹{stats.monthlyEarnings}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600">Average per Trip</p>
                    <p className="text-2xl font-bold text-slate-900">₹{Math.round(stats.monthlyEarnings / stats.completedDeliveries)}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Recent Earnings</h4>
                  <div className="space-y-3">
                    {[
                      { date: 'Today', amount: 1250, trips: 8 },
                      { date: 'Yesterday', amount: 1100, trips: 7 },
                      { date: 'Jan 6', amount: 1350, trips: 9 },
                      { date: 'Jan 5', amount: 980, trips: 6 }
                    ].map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{day.date}</p>
                          <p className="text-sm text-slate-600">{day.trips} trips</p>
                        </div>
                        <p className="font-semibold text-slate-900">₹{day.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Driver Profile</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={user?.name || ''}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={user?.phone || ''}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                      <input
                        type="text"
                        value={user?.vehicleType || ''}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Number</label>
                      <input
                        type="text"
                        value={user?.vehicleNumber || ''}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.floor(stats.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-slate-600">({stats.rating}/5.0)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverDashboard