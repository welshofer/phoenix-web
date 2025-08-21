import { renderHook, waitFor } from '@testing-library/react'
import { onAuthStateChanged } from 'firebase/auth'
import { useAuth } from '../useAuth'

// Mock Firebase auth
jest.mock('firebase/auth')
jest.mock('@/lib/firebase/config', () => ({
  auth: {},
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    // Mock onAuthStateChanged to not call callback immediately
    ;(onAuthStateChanged as jest.Mock).mockImplementation(() => jest.fn())
    
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
  })

  it('should set user when authenticated', async () => {
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    }
    
    // Mock onAuthStateChanged to call callback with user
    ;(onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      // Simulate async auth state change
      setTimeout(() => callback(mockUser), 0)
      return jest.fn() // Return unsubscribe function
    })
    
    const { result } = renderHook(() => useAuth())
    
    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
    
    // Wait for auth state to update
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.user).toEqual(mockUser)
    })
  })

  it('should handle unauthenticated state', async () => {
    // Mock onAuthStateChanged to call callback with null
    ;(onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => callback(null), 0)
      return jest.fn()
    })
    
    const { result } = renderHook(() => useAuth())
    
    // Wait for auth state to update
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.user).toBe(null)
    })
  })

  it('should clean up subscription on unmount', () => {
    const unsubscribe = jest.fn()
    ;(onAuthStateChanged as jest.Mock).mockReturnValue(unsubscribe)
    
    const { unmount } = renderHook(() => useAuth())
    
    // Verify subscription was created
    expect(onAuthStateChanged).toHaveBeenCalled()
    
    // Unmount the hook
    unmount()
    
    // Verify unsubscribe was called
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('should handle auth state changes', async () => {
    let authCallback: ((user: any) => void) | null = null
    
    // Capture the callback
    ;(onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      authCallback = callback
      return jest.fn()
    })
    
    const { result } = renderHook(() => useAuth())
    
    // Initially loading
    expect(result.current.loading).toBe(true)
    
    // Simulate user login
    const user1 = { uid: 'user1', email: 'user1@test.com' }
    authCallback?.(user1)
    
    await waitFor(() => {
      expect(result.current.user).toEqual(user1)
      expect(result.current.loading).toBe(false)
    })
    
    // Simulate user change
    const user2 = { uid: 'user2', email: 'user2@test.com' }
    authCallback?.(user2)
    
    await waitFor(() => {
      expect(result.current.user).toEqual(user2)
    })
    
    // Simulate logout
    authCallback?.(null)
    
    await waitFor(() => {
      expect(result.current.user).toBe(null)
    })
  })

  it('should only subscribe once on mount', () => {
    const { rerender } = renderHook(() => useAuth())
    
    expect(onAuthStateChanged).toHaveBeenCalledTimes(1)
    
    // Rerender should not create new subscription
    rerender()
    
    expect(onAuthStateChanged).toHaveBeenCalledTimes(1)
  })
})