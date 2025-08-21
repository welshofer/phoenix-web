# Phoenix Web Testing Guide

## ✅ Testing Infrastructure Setup Complete

### What's Been Implemented

#### 1. Testing Framework
- **Jest** - Testing framework configured for Next.js
- **React Testing Library** - Component testing
- **node-mocks-http** - API route testing
- **TypeScript support** via ts-jest

#### 2. Test Commands Available
```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:ci      # CI-optimized test run
```

#### 3. Test Structure Created
```
phoenix-web/
├── jest.config.js                    # Jest configuration
├── jest.setup.js                     # Test environment setup
├── test-utils/
│   └── render.tsx                    # Custom render with providers
├── __mocks__/
│   └── firebase/                     # Firebase service mocks
│       ├── app.ts
│       ├── auth.ts
│       ├── firestore.ts
│       └── storage.ts
├── lib/
│   ├── firebase/__tests__/
│   │   ├── config.test.ts           # Firebase initialization
│   │   └── database.test.ts         # Database operations
│   └── models/__tests__/
│       └── coordinates.test.ts      # Coordinate utilities
├── hooks/__tests__/
│   └── useAuth.test.ts              # Authentication hook
├── components/__tests__/
│   └── SlideRenderer.test.tsx       # Slide rendering component
└── pages/api/__tests__/
    └── simple-presentation.test.ts  # API route testing
```

## 🧪 Writing Tests

### Component Testing Pattern
```typescript
import { render, screen, fireEvent } from '@/test-utils/render'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('should handle user interaction', () => {
    const onClick = jest.fn()
    render(<MyComponent onClick={onClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

### Hook Testing Pattern
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useMyHook } from '../useMyHook'

describe('useMyHook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe(null)
  })

  it('should update state', async () => {
    const { result } = renderHook(() => useMyHook())
    
    act(() => {
      result.current.setValue('new value')
    })
    
    await waitFor(() => {
      expect(result.current.value).toBe('new value')
    })
  })
})
```

### API Route Testing Pattern
```typescript
import { createMocks } from 'node-mocks-http'
import handler from '../api/my-endpoint'

describe('/api/my-endpoint', () => {
  it('should handle POST request', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { data: 'test' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({ success: true })
    )
  })
})
```

### Firebase Testing Pattern
```typescript
// Mock Firebase services before importing components
jest.mock('firebase/auth')
jest.mock('firebase/firestore')

import { signInAnonymously } from 'firebase/auth'

describe('Firebase Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should authenticate user', async () => {
    const mockUser = { uid: 'test-123' }
    ;(signInAnonymously as jest.Mock).mockResolvedValue({
      user: mockUser
    })

    // Test your authentication logic
  })
})
```

## 📊 Coverage Goals

### Current Coverage: ~15%
### Target Coverage: 75%

| Component | Current | Target | Priority |
|-----------|---------|--------|----------|
| API Routes | 5% | 80% | HIGH |
| Firebase Ops | 10% | 90% | CRITICAL |
| Components | 5% | 70% | MEDIUM |
| Hooks | 20% | 85% | HIGH |
| Models/Utils | 25% | 95% | LOW |

## 🚀 Next Steps for Full Coverage

### Immediate Priorities (Week 1)
1. **Fix failing tests** in Firebase config and database
2. **Add more API route tests** for critical endpoints:
   - `/api/imagen/generate`
   - `/api/ai/generate-presentation`
   - `/api/full-presentation`

### Week 2 Priorities
3. **Component tests** for:
   - `ImageGenerationPanel`
   - `ImageGenerationProgress`
   - Individual slide renderers
   
4. **Hook tests** for:
   - `useImageGeneration`
   - `usePptxExport`
   - `useAI`

### Week 3-4 Priorities
5. **Integration tests** using Playwright
6. **CI/CD pipeline** with GitHub Actions
7. **Performance benchmarks**

## 🐛 Common Testing Issues & Solutions

### Issue: Firebase Mock Not Working
```typescript
// Solution: Ensure mocks are set up before imports
jest.mock('firebase/auth')
const component = require('../MyComponent')
```

### Issue: React State Updates Not Wrapped in Act
```typescript
// Solution: Use waitFor for async updates
await waitFor(() => {
  expect(result.current.value).toBe(expected)
})
```

### Issue: Next.js Router Not Mocked
```typescript
// Solution: Already configured in jest.setup.js
// Router mock is available globally
```

## 📝 Testing Checklist for New Features

- [ ] Write unit tests for new functions/utilities
- [ ] Write component tests for new UI components
- [ ] Write integration tests for new API routes
- [ ] Ensure tests pass locally before committing
- [ ] Check coverage report for untested code
- [ ] Update this guide with new patterns if needed

## 🔧 Debugging Tests

```bash
# Run specific test file
npm test -- lib/models/__tests__/coordinates.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should validate"

# Debug mode with Node inspector
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Update snapshots
npm test -- -u
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Next.js Apps](https://nextjs.org/docs/testing)
- [Firebase Mock Examples](https://github.com/firebase/firebase-js-sdk/tree/master/packages/firestore/test)

## ⚠️ Important Notes

1. **Always mock external services** (Firebase, APIs, etc.)
2. **Test behavior, not implementation** details
3. **Keep tests isolated** - each test should be independent
4. **Use descriptive test names** that explain what's being tested
5. **Follow AAA pattern**: Arrange, Act, Assert

## 🎯 Testing Philosophy

> "Write tests not because they catch bugs, but because they define behavior."

Focus on:
- **Critical user paths** (authentication, data operations)
- **Business logic** (calculations, transformations)
- **Error scenarios** (network failures, invalid inputs)
- **Edge cases** (empty states, boundaries)

Remember: A well-tested codebase is a maintainable codebase!