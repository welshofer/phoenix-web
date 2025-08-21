import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Mock Firebase modules
jest.mock('firebase/app')
jest.mock('firebase/auth')
jest.mock('firebase/firestore')
jest.mock('firebase/storage')

describe('Firebase Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset modules to ensure fresh imports
    jest.resetModules()
    // Ensure mocks are functions
    ;(initializeApp as jest.Mock).mockReturnValue({ name: '[DEFAULT]', options: {} })
    ;(getAuth as jest.Mock).mockReturnValue({ currentUser: null })
    ;(getFirestore as jest.Mock).mockReturnValue({ type: 'firestore' })
    ;(getStorage as jest.Mock).mockReturnValue({ app: {} })
    // Set up environment variables
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id'
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id'
  })

  it('should initialize Firebase app with correct config', () => {
    // Mock getApps to return empty array (no apps initialized)
    ;(getApps as jest.Mock).mockReturnValue([])
    
    // Import the config module
    require('../config')
    
    // Verify Firebase was initialized with correct config
    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      authDomain: 'phoenix-web-app.firebaseapp.com',
      projectId: 'phoenix-web-app',
      storageBucket: 'phoenix-web-app.appspot.com',
      messagingSenderId: 'test-sender-id',
      appId: 'test-app-id',
    })
  })

  it('should not reinitialize Firebase if app already exists', () => {
    // Mock getApps to return existing app
    const mockApp = { name: '[DEFAULT]', options: {} }
    ;(getApps as jest.Mock).mockReturnValue([mockApp])
    
    // Import the config module
    require('../config')
    
    // Verify Firebase was not initialized again
    expect(initializeApp).not.toHaveBeenCalled()
  })

  it('should export auth instance', () => {
    ;(getApps as jest.Mock).mockReturnValue([])
    const mockApp = { name: '[DEFAULT]' }
    ;(initializeApp as jest.Mock).mockReturnValue(mockApp)
    
    const config = require('../config')
    
    expect(getAuth).toHaveBeenCalledWith(mockApp)
    expect(config.auth).toBeDefined()
  })

  it('should export firestore instance', () => {
    ;(getApps as jest.Mock).mockReturnValue([])
    const mockApp = { name: '[DEFAULT]' }
    ;(initializeApp as jest.Mock).mockReturnValue(mockApp)
    
    const config = require('../config')
    
    expect(getFirestore).toHaveBeenCalledWith(mockApp)
    expect(config.db).toBeDefined()
  })

  it('should export storage instance', () => {
    ;(getApps as jest.Mock).mockReturnValue([])
    const mockApp = { name: '[DEFAULT]' }
    ;(initializeApp as jest.Mock).mockReturnValue(mockApp)
    
    const config = require('../config')
    
    expect(getStorage).toHaveBeenCalledWith(mockApp)
    expect(config.storage).toBeDefined()
  })

  it('should handle missing environment variables gracefully', () => {
    // Clear environment variables
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    delete process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    
    ;(getApps as jest.Mock).mockReturnValue([])
    
    // Should not throw error
    expect(() => require('../config')).not.toThrow()
    
    // Should still initialize with partial config
    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: undefined,
      authDomain: 'phoenix-web-app.firebaseapp.com',
      projectId: 'phoenix-web-app',
      storageBucket: 'phoenix-web-app.appspot.com',
      messagingSenderId: undefined,
      appId: undefined,
    })
  })
})