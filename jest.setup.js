// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id'
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Suppress console errors during tests unless explicitly testing error handling
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented') ||
       args[0].includes('Warning:'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})