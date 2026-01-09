// Address Suggestion Service with Local Areas Support
// Provides autocomplete suggestions for Indian addresses with local landmarks

export interface AddressSuggestion {
  id: string
  address: string
  area: string
  city: string
  state: string
  pincode: string
  lat: number
  lng: number
  type: 'landmark' | 'area' | 'street' | 'building'
  category?: 'residential' | 'commercial' | 'industrial' | 'hospital' | 'school' | 'mall'
}

class AddressSuggestionService {
  private localAreas: AddressSuggestion[] = []
  private cache: Map<string, AddressSuggestion[]> = new Map()

  constructor() {
    this.initializeLocalAreas()
  }

  /**
   * Initialize local areas database for major Indian cities
   */
  private initializeLocalAreas() {
    this.localAreas = [
      // Mumbai Areas
      {
        id: 'mumbai_bandra_west',
        address: 'Bandra West',
        area: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        lat: 19.0596,
        lng: 72.8295,
        type: 'area',
        category: 'residential'
      },
      {
        id: 'mumbai_andheri_east',
        address: 'Andheri East',
        area: 'Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400069',
        lat: 19.1136,
        lng: 72.8697,
        type: 'area',
        category: 'commercial'
      },
      {
        id: 'mumbai_powai',
        address: 'Powai',
        area: 'Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400076',
        lat: 19.1176,
        lng: 72.9060,
        type: 'area',
        category: 'residential'
      },
      {
        id: 'mumbai_bkc',
        address: 'Bandra Kurla Complex (BKC)',
        area: 'Bandra East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        lat: 19.0728,
        lng: 72.8826,
        type: 'landmark',
        category: 'commercial'
      },
      {
        id: 'mumbai_phoenix_mall',
        address: 'Phoenix Mills Mall, Lower Parel',
        area: 'Lower Parel',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400013',
        lat: 19.0135,
        lng: 72.8302,
        type: 'landmark',
        category: 'mall'
      },
      {
        id: 'mumbai_airport',
        address: 'Chhatrapati Shivaji International Airport',
        area: 'Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400099',
        lat: 19.0896,
        lng: 72.8656,
        type: 'landmark',
        category: 'commercial'
      },

      // Delhi Areas
      {
        id: 'delhi_cp',
        address: 'Connaught Place',
        area: 'Central Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        lat: 28.6315,
        lng: 77.2167,
        type: 'landmark',
        category: 'commercial'
      },
      {
        id: 'delhi_gurgaon',
        address: 'Cyber City, Gurgaon',
        area: 'Gurgaon',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122002',
        lat: 28.4595,
        lng: 77.0266,
        type: 'area',
        category: 'commercial'
      },
      {
        id: 'delhi_noida',
        address: 'Sector 18, Noida',
        area: 'Noida',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        lat: 28.5355,
        lng: 77.3910,
        type: 'area',
        category: 'commercial'
      },

      // Bangalore Areas
      {
        id: 'bangalore_koramangala',
        address: 'Koramangala',
        area: 'Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        lat: 12.9352,
        lng: 77.6245,
        type: 'area',
        category: 'residential'
      },
      {
        id: 'bangalore_whitefield',
        address: 'Whitefield',
        area: 'Whitefield',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560066',
        lat: 12.9698,
        lng: 77.7500,
        type: 'area',
        category: 'commercial'
      },
      {
        id: 'bangalore_electronic_city',
        address: 'Electronic City',
        area: 'Electronic City',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560100',
        lat: 12.8456,
        lng: 77.6603,
        type: 'area',
        category: 'industrial'
      },

      // Pune Areas
      {
        id: 'pune_hinjewadi',
        address: 'Hinjewadi IT Park',
        area: 'Hinjewadi',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411057',
        lat: 18.5912,
        lng: 73.7389,
        type: 'landmark',
        category: 'commercial'
      },
      {
        id: 'pune_kothrud',
        address: 'Kothrud',
        area: 'Kothrud',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
        lat: 18.5074,
        lng: 73.8077,
        type: 'area',
        category: 'residential'
      },

      // Chennai Areas
      {
        id: 'chennai_omr',
        address: 'Old Mahabalipuram Road (OMR)',
        area: 'Thoraipakkam',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600097',
        lat: 12.9398,
        lng: 80.2297,
        type: 'area',
        category: 'commercial'
      },
      {
        id: 'chennai_t_nagar',
        address: 'T. Nagar',
        area: 'T. Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600017',
        lat: 13.0418,
        lng: 80.2341,
        type: 'area',
        category: 'commercial'
      },

      // Coimbatore Areas
      {
        id: 'coimbatore_rs_puram',
        address: 'R.S. Puram',
        area: 'R.S. Puram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641002',
        lat: 11.0168,
        lng: 76.9558,
        type: 'area',
        category: 'commercial'
      },
      {
        id: 'coimbatore_gandhipuram',
        address: 'Gandhipuram',
        area: 'Gandhipuram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641012',
        lat: 11.0183,
        lng: 76.9725,
        type: 'area',
        category: 'commercial'
      },
      {
        id: 'coimbatore_peelamedu',
        address: 'Peelamedu',
        area: 'Peelamedu',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641004',
        lat: 11.0255,
        lng: 77.0059,
        type: 'area',
        category: 'residential'
      },
      {
        id: 'coimbatore_airport',
        address: 'Coimbatore International Airport',
        area: 'Peelamedu',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641014',
        lat: 11.0297,
        lng: 77.0436,
        type: 'landmark',
        category: 'commercial'
      },
      {
        id: 'coimbatore_saravanampatti',
        address: 'Saravanampatti',
        area: 'Saravanampatti',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641035',
        lat: 11.0777,
        lng: 77.0026,
        type: 'area',
        category: 'residential'
      },

      // Hyderabad Areas
      {
        id: 'hyderabad_hitech_city',
        address: 'HITEC City',
        area: 'Madhapur',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        lat: 17.4435,
        lng: 78.3772,
        type: 'area',
        category: 'commercial'
      },
      {
        id: 'hyderabad_gachibowli',
        address: 'Gachibowli',
        area: 'Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032',
        lat: 17.4399,
        lng: 78.3489,
        type: 'area',
        category: 'commercial'
      },
      {
        id: 'hyderabad_banjara_hills',
        address: 'Banjara Hills',
        area: 'Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500034',
        lat: 17.4126,
        lng: 78.4482,
        type: 'area',
        category: 'residential'
      },

      // Kolkata Areas
      {
        id: 'kolkata_salt_lake',
        address: 'Salt Lake City (Bidhannagar)',
        area: 'Salt Lake',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700064',
        lat: 22.5958,
        lng: 88.4497,
        type: 'area',
        category: 'commercial'
      },
      {
        id: 'kolkata_park_street',
        address: 'Park Street',
        area: 'Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
        lat: 22.5549,
        lng: 88.3516,
        type: 'area',
        category: 'commercial'
      },

      // Ahmedabad Areas
      {
        id: 'ahmedabad_sg_highway',
        address: 'S.G. Highway',
        area: 'Bodakdev',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380054',
        lat: 23.0395,
        lng: 72.5293,
        type: 'area',
        category: 'commercial'
      },
      {
        id: 'ahmedabad_cg_road',
        address: 'C.G. Road',
        area: 'Navrangpura',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380009',
        lat: 23.0395,
        lng: 72.5293,
        type: 'area',
        category: 'commercial'
      },

      // Kochi Areas
      {
        id: 'kochi_marine_drive',
        address: 'Marine Drive',
        area: 'Ernakulam',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682031',
        lat: 9.9312,
        lng: 76.2673,
        type: 'area',
        category: 'commercial'
      },
      {
        id: 'kochi_kakkanad',
        address: 'Kakkanad',
        area: 'Kakkanad',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682030',
        lat: 10.0261,
        lng: 76.3479,
        type: 'area',
        category: 'commercial'
      },

      // Jaipur Areas
      {
        id: 'jaipur_malviya_nagar',
        address: 'Malviya Nagar',
        area: 'Malviya Nagar',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        lat: 26.8467,
        lng: 75.8139,
        type: 'area',
        category: 'residential'
      },
      {
        id: 'jaipur_vaishali_nagar',
        address: 'Vaishali Nagar',
        area: 'Vaishali Nagar',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302021',
        lat: 26.9157,
        lng: 75.7441,
        type: 'area',
        category: 'residential'
      }
    ]
  }

  /**
   * Get address suggestions based on user input
   */
  async getSuggestions(query: string, limit: number = 8): Promise<AddressSuggestion[]> {
    if (!query || query.length < 2) {
      return []
    }

    const cacheKey = `${query.toLowerCase()}_${limit}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const normalizedQuery = query.toLowerCase().trim()
    
    // Filter and score suggestions
    const suggestions = this.localAreas
      .map(area => ({
        ...area,
        score: this.calculateRelevanceScore(area, normalizedQuery)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...area }) => area)

    // Cache results
    this.cache.set(cacheKey, suggestions)
    
    return suggestions
  }

  /**
   * Calculate relevance score for address matching
   */
  private calculateRelevanceScore(area: AddressSuggestion, query: string): number {
    let score = 0
    const queryWords = query.split(' ').filter(word => word.length > 1)
    
    for (const word of queryWords) {
      // Exact match in address (highest priority)
      if (area.address.toLowerCase().includes(word)) {
        score += 10
      }
      
      // Match in area name
      if (area.area.toLowerCase().includes(word)) {
        score += 8
      }
      
      // Match in city name
      if (area.city.toLowerCase().includes(word)) {
        score += 6
      }
      
      // Match in pincode
      if (area.pincode.includes(word)) {
        score += 5
      }
      
      // Partial match bonus
      if (area.address.toLowerCase().startsWith(word)) {
        score += 3
      }
    }
    
    // Boost popular landmarks and commercial areas
    if (area.type === 'landmark') {
      score += 2
    }
    if (area.category === 'commercial') {
      score += 1
    }
    
    return score
  }

  /**
   * Get coordinates for an address
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const suggestions = await this.getSuggestions(address, 1)
    if (suggestions.length > 0) {
      const suggestion = suggestions[0]
      return { lat: suggestion.lat, lng: suggestion.lng }
    }
    
    // Fallback to mock geocoding for unknown addresses
    return this.mockGeocode(address)
  }

  /**
   * Mock geocoding for addresses not in our database
   */
  private mockGeocode(address: string): { lat: number; lng: number } | null {
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'delhi': { lat: 28.7041, lng: 77.1025 },
      'bangalore': { lat: 12.9716, lng: 77.5946 },
      'pune': { lat: 18.5204, lng: 73.8567 },
      'chennai': { lat: 13.0827, lng: 80.2707 },
      'hyderabad': { lat: 17.3850, lng: 78.4867 },
      'kolkata': { lat: 22.5726, lng: 88.3639 },
      'ahmedabad': { lat: 23.0225, lng: 72.5714 },
      'coimbatore': { lat: 11.0168, lng: 76.9558 },
      'kochi': { lat: 9.9312, lng: 76.2673 },
      'jaipur': { lat: 26.9124, lng: 75.7873 },
      'lucknow': { lat: 26.8467, lng: 80.9462 },
      'kanpur': { lat: 26.4499, lng: 80.3319 },
      'nagpur': { lat: 21.1458, lng: 79.0882 },
      'indore': { lat: 22.7196, lng: 75.8577 },
      'thane': { lat: 19.2183, lng: 72.9781 },
      'bhopal': { lat: 23.2599, lng: 77.4126 },
      'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
      'pimpri': { lat: 18.6298, lng: 73.7997 },
      'patna': { lat: 25.5941, lng: 85.1376 },
      'vadodara': { lat: 22.3072, lng: 73.1812 },
      'ludhiana': { lat: 30.9010, lng: 75.8573 },
      'agra': { lat: 27.1767, lng: 78.0081 },
      'nashik': { lat: 19.9975, lng: 73.7898 },
      'faridabad': { lat: 28.4089, lng: 77.3178 },
      'meerut': { lat: 28.9845, lng: 77.7064 },
      'rajkot': { lat: 22.3039, lng: 70.8022 },
      'kalyan': { lat: 19.2437, lng: 73.1355 },
      'vasai': { lat: 19.4912, lng: 72.8054 },
      'varanasi': { lat: 25.3176, lng: 82.9739 },
      'srinagar': { lat: 34.0837, lng: 74.7973 },
      'aurangabad': { lat: 19.8762, lng: 75.3433 },
      'dhanbad': { lat: 23.7957, lng: 86.4304 },
      'amritsar': { lat: 31.6340, lng: 74.8723 },
      'navi mumbai': { lat: 19.0330, lng: 73.0297 },
      'allahabad': { lat: 25.4358, lng: 81.8463 },
      'ranchi': { lat: 23.3441, lng: 85.3096 },
      'howrah': { lat: 22.5958, lng: 88.2636 },
      'jabalpur': { lat: 23.1815, lng: 79.9864 },
      'gwalior': { lat: 26.2183, lng: 78.1828 },
      'vijayawada': { lat: 16.5062, lng: 80.6480 },
      'jodhpur': { lat: 26.2389, lng: 73.0243 },
      'madurai': { lat: 9.9252, lng: 78.1198 },
      'raipur': { lat: 21.2514, lng: 81.6296 },
      'kota': { lat: 25.2138, lng: 75.8648 },
      'chandigarh': { lat: 30.7333, lng: 76.7794 },
      'guwahati': { lat: 26.1445, lng: 91.7362 },
      'solapur': { lat: 17.6599, lng: 75.9064 },
      'hubli': { lat: 15.3647, lng: 75.1240 },
      'tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
      'bareilly': { lat: 28.3670, lng: 79.4304 },
      'mysore': { lat: 12.2958, lng: 76.6394 },
      'tiruppur': { lat: 11.1085, lng: 77.3411 },
      'gurgaon': { lat: 28.4595, lng: 77.0266 },
      'aligarh': { lat: 27.8974, lng: 78.0880 },
      'jalandhar': { lat: 31.3260, lng: 75.5762 },
      'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
      'salem': { lat: 11.6643, lng: 78.1460 },
      'warangal': { lat: 17.9689, lng: 79.5941 },
      'mira bhayandar': { lat: 19.2952, lng: 72.8544 },
      'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
      'bhiwandi': { lat: 19.3002, lng: 73.0635 },
      'saharanpur': { lat: 29.9680, lng: 77.5552 },
      'guntur': { lat: 16.3067, lng: 80.4365 },
      'amravati': { lat: 20.9374, lng: 77.7796 },
      'bikaner': { lat: 28.0229, lng: 73.3119 },
      'noida': { lat: 28.5355, lng: 77.3910 },
      'jamshedpur': { lat: 22.8046, lng: 86.2029 },
      'bhilai nagar': { lat: 21.1938, lng: 81.3509 },
      'cuttack': { lat: 20.4625, lng: 85.8828 },
      'firozabad': { lat: 27.1592, lng: 78.3957 },
      'bhavnagar': { lat: 21.7645, lng: 72.1519 },
      'dehradun': { lat: 30.3165, lng: 78.0322 },
      'durgapur': { lat: 23.5204, lng: 87.3119 },
      'asansol': { lat: 23.6739, lng: 86.9524 },
      'nanded': { lat: 19.1383, lng: 77.2975 },
      'kolhapur': { lat: 16.7050, lng: 74.2433 },
      'ajmer': { lat: 26.4499, lng: 74.6399 },
      'akola': { lat: 20.7002, lng: 77.0082 },
      'gulbarga': { lat: 17.3297, lng: 76.8343 },
      'jamnagar': { lat: 22.4707, lng: 70.0577 },
      'ujjain': { lat: 23.1765, lng: 75.7885 },
      'loni': { lat: 28.7333, lng: 77.2833 },
      'siliguri': { lat: 26.7271, lng: 88.3953 },
      'jhansi': { lat: 25.4484, lng: 78.5685 },
      'ulhasnagar': { lat: 19.2215, lng: 73.1645 },
      'nellore': { lat: 14.4426, lng: 79.9865 },
      'jammu': { lat: 32.7266, lng: 74.8570 },
      'sangli miraj kupwad': { lat: 16.8524, lng: 74.5815 },
      'belgaum': { lat: 15.8497, lng: 74.4977 },
      'mangalore': { lat: 12.9141, lng: 74.8560 },
      'ambattur': { lat: 13.1143, lng: 80.1548 },
      'tirunelveli': { lat: 8.7139, lng: 77.7567 },
      'malegaon': { lat: 20.5579, lng: 74.5287 },
      'gaya': { lat: 24.7914, lng: 85.0002 }
    }

    const normalizedAddress = address.toLowerCase()
    
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (normalizedAddress.includes(city)) {
        // Add random offset for demo purposes
        return {
          lat: coords.lat + (Math.random() - 0.5) * 0.1,
          lng: coords.lng + (Math.random() - 0.5) * 0.1
        }
      }
    }
    
    return null
  }

  /**
   * Get nearby areas for a given location
   */
  async getNearbyAreas(lat: number, lng: number, radiusKm: number = 10): Promise<AddressSuggestion[]> {
    return this.localAreas.filter(area => {
      const distance = this.calculateDistance(lat, lng, area.lat, area.lng)
      return distance <= radiusKm
    }).sort((a, b) => {
      const distanceA = this.calculateDistance(lat, lng, a.lat, a.lng)
      const distanceB = this.calculateDistance(lat, lng, b.lat, b.lng)
      return distanceA - distanceB
    })
  }

  /**
   * Calculate distance between two points using Haversine formula
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
   * Add custom address to local database
   */
  addCustomAddress(suggestion: Omit<AddressSuggestion, 'id'>): void {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.localAreas.push({ ...suggestion, id })
    this.cache.clear() // Clear cache to include new address
  }

  /**
   * Get popular destinations by category
   */
  getPopularDestinations(category?: string, limit: number = 10): AddressSuggestion[] {
    let filtered = this.localAreas
    
    if (category) {
      filtered = filtered.filter(area => area.category === category)
    }
    
    // Sort by type priority (landmarks first) and then alphabetically
    return filtered
      .sort((a, b) => {
        if (a.type === 'landmark' && b.type !== 'landmark') return -1
        if (a.type !== 'landmark' && b.type === 'landmark') return 1
        return a.address.localeCompare(b.address)
      })
      .slice(0, limit)
  }
}

export const addressSuggestionService = new AddressSuggestionService()
export default addressSuggestionService