/**
 * User Registration Service
 * Manages user registration data and prevents duplicates
 */

interface RegisteredUser {
  id: string
  email: string
  phone: string
  vehicleNumber?: string
  userType: 'CUSTOMER' | 'DRIVER' | 'BUSINESS' | 'ADMIN'
  name: string
  registeredAt: Date
}

class UserRegistrationService {
  private storageKey = 'pakkadrop_registered_users'

  /**
   * Get all registered users from localStorage
   */
  private getRegisteredUsers(): RegisteredUser[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const users = JSON.parse(stored)
        return users.map((user: any) => ({
          ...user,
          registeredAt: new Date(user.registeredAt)
        }))
      }
      return []
    } catch (error) {
      console.error('Failed to load registered users:', error)
      return []
    }
  }

  /**
   * Save registered users to localStorage
   */
  private saveRegisteredUsers(users: RegisteredUser[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(users))
    } catch (error) {
      console.error('Failed to save registered users:', error)
    }
  }

  /**
   * Check if phone number is already registered
   */
  isPhoneNumberRegistered(phoneNumber: string): boolean {
    if (!phoneNumber) return false
    
    const users = this.getRegisteredUsers()
    return users.some(user => user.phone === phoneNumber.trim())
  }

  /**
   * Check if vehicle number is already registered
   */
  isVehicleNumberRegistered(vehicleNumber: string): boolean {
    if (!vehicleNumber) return false
    
    const users = this.getRegisteredUsers()
    return users.some(user => 
      user.vehicleNumber && 
      user.vehicleNumber.toUpperCase().replace(/\s/g, '') === vehicleNumber.toUpperCase().replace(/\s/g, '')
    )
  }

  /**
   * Check if email is already registered
   */
  isEmailRegistered(email: string): boolean {
    if (!email) return false
    
    const users = this.getRegisteredUsers()
    return users.some(user => user.email.toLowerCase() === email.toLowerCase().trim())
  }

  /**
   * Get user by phone number
   */
  getUserByPhone(phoneNumber: string): RegisteredUser | null {
    if (!phoneNumber) return null
    
    const users = this.getRegisteredUsers()
    return users.find(user => user.phone === phoneNumber.trim()) || null
  }

  /**
   * Get user by vehicle number
   */
  getUserByVehicleNumber(vehicleNumber: string): RegisteredUser | null {
    if (!vehicleNumber) return null
    
    const users = this.getRegisteredUsers()
    return users.find(user => 
      user.vehicleNumber && 
      user.vehicleNumber.toUpperCase().replace(/\s/g, '') === vehicleNumber.toUpperCase().replace(/\s/g, '')
    ) || null
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): RegisteredUser | null {
    if (!email) return null
    
    const users = this.getRegisteredUsers()
    return users.find(user => user.email.toLowerCase() === email.toLowerCase().trim()) || null
  }

  /**
   * Register a new user
   */
  registerUser(userData: {
    id: string
    email: string
    phone: string
    vehicleNumber?: string
    userType: 'CUSTOMER' | 'DRIVER' | 'BUSINESS' | 'ADMIN'
    name: string
  }): boolean {
    try {
      // Check for duplicates
      if (this.isEmailRegistered(userData.email)) {
        throw new Error('Email is already registered')
      }
      
      if (this.isPhoneNumberRegistered(userData.phone)) {
        throw new Error('Phone number is already registered')
      }
      
      if (userData.vehicleNumber && this.isVehicleNumberRegistered(userData.vehicleNumber)) {
        throw new Error('Vehicle number is already registered')
      }

      const users = this.getRegisteredUsers()
      const newUser: RegisteredUser = {
        ...userData,
        registeredAt: new Date()
      }

      users.push(newUser)
      this.saveRegisteredUsers(users)
      
      console.log('✅ User registered successfully:', userData.email)
      return true
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  /**
   * Update user information
   */
  updateUser(userId: string, updates: Partial<RegisteredUser>): boolean {
    try {
      const users = this.getRegisteredUsers()
      const userIndex = users.findIndex(user => user.id === userId)
      
      if (userIndex === -1) {
        throw new Error('User not found')
      }

      // Check for duplicates if updating phone or vehicle
      if (updates.phone && updates.phone !== users[userIndex].phone) {
        if (this.isPhoneNumberRegistered(updates.phone)) {
          throw new Error('Phone number is already registered by another user')
        }
      }

      if (updates.vehicleNumber && updates.vehicleNumber !== users[userIndex].vehicleNumber) {
        if (this.isVehicleNumberRegistered(updates.vehicleNumber)) {
          throw new Error('Vehicle number is already registered by another user')
        }
      }

      users[userIndex] = { ...users[userIndex], ...updates }
      this.saveRegisteredUsers(users)
      
      console.log('✅ User updated successfully:', userId)
      return true
    } catch (error) {
      console.error('Update failed:', error)
      throw error
    }
  }

  /**
   * Get registration statistics
   */
  getStats() {
    const users = this.getRegisteredUsers()
    
    return {
      total: users.length,
      customers: users.filter(u => u.userType === 'CUSTOMER').length,
      drivers: users.filter(u => u.userType === 'DRIVER').length,
      businesses: users.filter(u => u.userType === 'BUSINESS').length,
      admins: users.filter(u => u.userType === 'ADMIN').length,
      withVehicles: users.filter(u => u.vehicleNumber).length
    }
  }

  /**
   * Clear all registration data (for testing)
   */
  clearAll(): void {
    localStorage.removeItem(this.storageKey)
    console.log('🗑️ All registration data cleared')
  }

  /**
   * Get all registered users (admin only)
   */
  getAllUsers(): RegisteredUser[] {
    return this.getRegisteredUsers()
  }

  /**
   * Validate registration data
   */
  validateRegistrationData(data: {
    email: string
    phone: string
    vehicleNumber?: string
    userType: string
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check email
    if (this.isEmailRegistered(data.email)) {
      errors.push('Email is already registered')
    }

    // Check phone
    if (this.isPhoneNumberRegistered(data.phone)) {
      const existingUser = this.getUserByPhone(data.phone)
      errors.push(`Phone number is already registered by ${existingUser?.name || 'another user'}`)
    }

    // Check vehicle number (for drivers)
    if (data.vehicleNumber && this.isVehicleNumberRegistered(data.vehicleNumber)) {
      const existingUser = this.getUserByVehicleNumber(data.vehicleNumber)
      errors.push(`Vehicle number is already registered by ${existingUser?.name || 'another driver'}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const userRegistrationService = new UserRegistrationService()

// React hook for using registration service
export const useRegistrationValidation = () => {
  const checkPhone = (phoneNumber: string) => {
    return userRegistrationService.isPhoneNumberRegistered(phoneNumber)
  }

  const checkVehicle = (vehicleNumber: string) => {
    return userRegistrationService.isVehicleNumberRegistered(vehicleNumber)
  }

  const checkEmail = (email: string) => {
    return userRegistrationService.isEmailRegistered(email)
  }

  const validateRegistration = (data: {
    email: string
    phone: string
    vehicleNumber?: string
    userType: string
  }) => {
    return userRegistrationService.validateRegistrationData(data)
  }

  return {
    checkPhone,
    checkVehicle,
    checkEmail,
    validateRegistration,
    getStats: userRegistrationService.getStats.bind(userRegistrationService)
  }
}