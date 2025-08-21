import { User } from 'firebase/auth'

export const mockUser: User = {
  uid: 'test-user-123',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  isAnonymous: false,
  photoURL: null,
  providerData: [],
  phoneNumber: null,
  providerId: 'firebase',
  metadata: {} as any,
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn(),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
} as User

export const getAuth = jest.fn(() => ({
  currentUser: null,
  languageCode: null,
  settings: {},
  tenantId: null,
  onAuthStateChanged: jest.fn(),
  onIdTokenChanged: jest.fn(),
  signOut: jest.fn(),
}))

export const signInAnonymously = jest.fn(() => 
  Promise.resolve({
    user: { ...mockUser, isAnonymous: true },
    providerId: null,
    operationType: 'signIn',
  })
)

export const signOut = jest.fn(() => Promise.resolve())

export const onAuthStateChanged = jest.fn((auth, callback) => {
  // Immediately call the callback with null (not signed in)
  callback(null)
  // Return unsubscribe function
  return jest.fn()
})

export const createUserWithEmailAndPassword = jest.fn((auth, email, password) =>
  Promise.resolve({
    user: { ...mockUser, email },
    providerId: null,
    operationType: 'signIn',
  })
)

export const signInWithEmailAndPassword = jest.fn((auth, email, password) =>
  Promise.resolve({
    user: { ...mockUser, email },
    providerId: null,
    operationType: 'signIn',
  })
)