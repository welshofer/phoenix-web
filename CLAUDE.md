# Phoenix Web - Project Documentation & Development Guidelines

## Project Overview
Phoenix Web is a production-ready Next.js application with Firebase backend services, built with TypeScript for type safety and enterprise-grade features. The application generates AI-powered presentations using Google Vertex AI (Gemini 2.5 Flash) with comprehensive security, caching, and error recovery mechanisms.

## Current Architecture Status ✅

### Core Technologies
- **Next.js 15.5.0** - React framework with Pages Router
- **TypeScript 5.9.2** - Strict type checking enabled
- **Firebase Suite** - Auth (Admin SDK), Firestore, Storage with security rules
- **Google Vertex AI** - Gemini 2.5 Flash for AI generation
- **React Query** - Client-side data fetching and caching
- **Upstash Redis** - Server-side caching and rate limiting
- **MUI & MUI X** - Component library with data grid
- **Zod** - Runtime type validation for all inputs

### Security Features ✅
- **Authentication**: Firebase Admin SDK with ID token verification
- **Authorization**: Role-based access control in Firestore rules
- **Rate Limiting**: Sliding window with Redis/Upstash
- **Input Validation**: Comprehensive Zod schemas
- **Security Headers**: CSP, HSTS, XSS protection
- **API Protection**: All endpoints require authentication

### Performance Optimizations ✅
- **API Timeout**: Reduced from 7min to 30s
- **Caching**: Multi-layer (React Query → CDN → Redis → Memory)
- **Code Splitting**: Separate chunks for MUI, Firebase, vendors
- **Lazy Loading**: Dynamic imports for heavy components
- **Bundle Size**: ~40% reduction with tree shaking

### Reliability Features ✅
- **Error Recovery**: Circuit breakers with exponential backoff
- **Resilient Operations**: Wrapped Firebase operations
- **Job Queues**: Async processing with priority and retries
- **Graceful Degradation**: Fallback strategies for all services
- **Monitoring**: Performance metrics and Web Vitals tracking

## Project Structure
```
phoenix-web/app/
├── pages/              # Next.js pages (Pages Router)
├── components/         # React components
│   ├── slides/        # Slide presentation components
│   ├── presentation/  # Editor components
│   ├── imagen/        # Image generation UI
│   └── LazyComponents.tsx # Lazy-loaded components
├── hooks/             # Custom React hooks with caching
├── lib/               # Core libraries
│   ├── firebase/      # Firebase config + admin + error recovery
│   ├── server/        # Server-side utilities
│   ├── cache/         # Redis caching implementation
│   ├── errors/        # Error handling system
│   ├── validation/    # Zod schemas
│   ├── monitoring/    # Performance tracking
│   ├── utils/         # Async queues and utilities
│   └── providers/     # React providers
├── __tests__/         # Jest test files
├── .github/workflows/ # CI/CD pipelines
└── [config files]     # Jest, ESLint, Prettier, TypeScript
```

## Development Guidelines

### 1. Code Quality Standards

#### TypeScript Requirements
```typescript
// ✅ ALWAYS use proper types
interface UserData {
  id: string;
  email: string;
  createdAt: Date;
}

// ❌ NEVER use 'any'
const processData = (data: any) => { }  // BAD

// ✅ Use 'unknown' and type guards
const processData = (data: unknown) => {
  if (isUserData(data)) {
    // Process safely
  }
}

// ✅ ALWAYS validate external data with Zod
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  createdAt: z.date(),
});
```

#### Component Guidelines
```typescript
// ✅ ALWAYS define Props interfaces
interface ComponentProps {
  title: string;
  onUpdate: (value: string) => void;
  children?: React.ReactNode;
}

// ✅ Use functional components with proper typing
export const MyComponent: React.FC<ComponentProps> = ({ title, onUpdate }) => {
  // Component logic
};

// ✅ Lazy load heavy components
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { loading: () => <Skeleton />, ssr: false }
);
```

### 2. Testing Requirements

#### Minimum Coverage Targets
- **Overall**: 80% coverage required
- **Critical Paths**: 100% coverage required
- **API Routes**: 100% coverage required
- **Security Functions**: 100% coverage required
- **New Features**: Must include tests before merge

#### Test Structure
```typescript
// ✅ ALWAYS write tests for new features
describe('FeatureName', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test happy path
  it('should handle successful case', async () => {
    // Arrange
    const input = { /* test data */ };
    
    // Act
    const result = await myFunction(input);
    
    // Assert
    expect(result).toMatchObject(expectedOutput);
  });

  // Test error cases
  it('should handle errors gracefully', async () => {
    // Test validation errors
    // Test network errors
    // Test auth errors
  });

  // Test edge cases
  it('should handle edge cases', () => {
    // Empty inputs
    // Boundary values
    // Concurrent operations
  });
});
```

### 3. API Development Standards

#### New API Endpoint Checklist
```typescript
// ✅ Required for ALL new API endpoints:

// 1. Authentication
import { verifyIdToken } from '@/lib/firebase/admin';

// 2. Input validation with Zod
import { z } from 'zod';
const InputSchema = z.object({
  field: z.string().min(1).max(100),
});

// 3. Rate limiting
import { checkRateLimit } from '@/lib/server/rate-limiter';

// 4. Error handling
import { asyncHandler, handleApiError } from '@/lib/errors/handler';

// 5. Caching (if applicable)
import { cache } from '@/lib/cache/redis';

// Template for new endpoint:
export default asyncHandler(async (req, res) => {
  // Method check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate input
  const validation = InputSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      error: validation.error.errors 
    });
  }

  // Verify authentication
  const token = await verifyIdToken(req.body.idToken);
  
  // Check rate limits
  const rateLimit = await checkRateLimit(token.uid);
  if (!rateLimit.allowed) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded' 
    });
  }

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  // Process request with error recovery
  const result = await retryWithBackoff(async () => {
    // Your logic here
  });

  // Cache result
  await cache.set(cacheKey, result, ttl);

  return res.json(result);
});
```

### 4. Firebase Operations

#### Always Use Resilient Wrappers
```typescript
// ❌ DON'T use Firebase directly
const doc = await getDoc(docRef);  // BAD

// ✅ DO use resilient wrappers
import { resilientFirestore } from '@/lib/firebase/error-recovery';
const doc = await resilientFirestore.getDoc(docRef);  // GOOD

// ✅ Batch operations with error recovery
await resilientFirestore.executeBatch(batch, [
  () => batch.set(doc1, data1),
  () => batch.set(doc2, data2),
]);
```

### 5. State Management & Data Fetching

#### Use React Query for All Data Fetching
```typescript
// ✅ ALWAYS use React Query hooks
export function useUserData(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      // Check cache first
      const cached = await cache.get(`user:${userId}`);
      if (cached) return cached;
      
      // Fetch with error recovery
      const data = await resilientFirestore.getDoc(userDoc);
      
      // Update cache
      await cache.set(`user:${userId}`, data);
      return data;
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  });
}

// ✅ Optimistic updates for mutations
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newData) => {
    // Cancel queries
    await queryClient.cancelQueries(['user', userId]);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['user', userId]);
    
    // Optimistically update
    queryClient.setQueryData(['user', userId], newData);
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['user', userId], context.previous);
  },
});
```

### 6. Performance Guidelines

#### Code Splitting Requirements
```typescript
// ✅ Lazy load heavy components
const Editor = dynamic(() => import('./Editor'), {
  loading: () => <EditorSkeleton />,
  ssr: false,
});

// ✅ Lazy load heavy libraries
const generatePDF = async () => {
  const { jsPDF } = await import('jspdf');
  // Use library
};

// ✅ Split API routes by functionality
// pages/api/ai/[...].ts - AI features
// pages/api/export/[...].ts - Export features
// pages/api/imagen/[...].ts - Image features
```

#### Caching Strategy
```typescript
// Cache hierarchy (check in order):
// 1. React Query (client) - 1-5 min
// 2. CDN/Edge (Vercel) - 5-60 min  
// 3. Redis (server) - 1-24 hours
// 4. Memory (fallback) - 1-5 min

// ✅ Use appropriate TTLs
const CACHE_TTLS = {
  user: 5 * 60,           // 5 minutes
  presentation: 10 * 60,  // 10 minutes
  aiGeneration: 24 * 60 * 60,  // 24 hours
  image: 7 * 24 * 60 * 60,     // 7 days
};
```

### 7. Security Checklist

#### For Every Feature
- [ ] Authentication required?
- [ ] Rate limiting applied?
- [ ] Input validation with Zod?
- [ ] Output sanitization?
- [ ] RBAC rules updated?
- [ ] Security headers set?
- [ ] Audit logging added?
- [ ] Threat model reviewed?

#### Security Patterns
```typescript
// ✅ ALWAYS validate ownership
if (resource.userId !== currentUser.uid) {
  throw new AuthorizationError('Access denied');
}

// ✅ ALWAYS sanitize user input
const sanitized = sanitizeHtml(userInput);

// ✅ NEVER log sensitive data
logger.info('User action', {
  userId: user.uid,
  // DON'T log: email, tokens, passwords, PII
});

// ✅ Use secure defaults
const config = {
  isPublic: false,  // Default to private
  maxSize: 10 * 1024 * 1024,  // 10MB limit
  allowedTypes: ['image/jpeg', 'image/png'],
};
```

### 8. Error Handling Patterns

#### Consistent Error Responses
```typescript
// ✅ Use standardized error classes
import { ValidationError, AuthenticationError, RateLimitError } from '@/lib/errors/handler';

// ✅ Provide helpful error messages
throw new ValidationError('Topic must be between 3 and 200 characters');

// ✅ Handle errors at appropriate level
try {
  await riskyOperation();
} catch (error) {
  // Log error details
  logger.error('Operation failed', { error, context });
  
  // Return user-friendly message
  throw new AppError('Unable to complete request. Please try again.');
}
```

### 9. Git Workflow & PR Standards

#### Branch Naming
```bash
feature/add-export-pdf
fix/auth-token-validation  
chore/update-dependencies
test/add-api-coverage
```

#### Commit Messages
```bash
feat: add PDF export functionality
fix: resolve authentication token validation issue
chore: update dependencies to latest versions
test: add test coverage for API endpoints
docs: update architecture diagrams
perf: optimize bundle size with code splitting
security: implement rate limiting on all endpoints
```

#### PR Checklist
- [ ] Tests written and passing
- [ ] TypeScript checks passing
- [ ] Linting passing
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Breaking changes documented

### 10. Monitoring & Observability

#### Required Metrics
```typescript
// ✅ Track key metrics
performanceMonitor.recordMetric('api.latency', responseTime);
performanceMonitor.recordMetric('cache.hit_rate', hitRate);
performanceMonitor.recordMetric('error.rate', errorCount);

// ✅ Add context to errors
logger.error('Operation failed', {
  error,
  userId: user.uid,
  operation: 'generatePresentation',
  duration: Date.now() - startTime,
  context: { topic, slideCount },
});
```

## Architecture Decisions

### Why These Technologies?

1. **Next.js + TypeScript**: Type safety, SSR/SSG, API routes
2. **Firebase + Admin SDK**: Managed services, scalability, security
3. **Vertex AI**: Google's latest AI, better than alternatives
4. **React Query**: Superior caching, optimistic updates
5. **Upstash Redis**: Serverless Redis, global edge
6. **Zod**: Runtime validation, type inference
7. **MUI**: Comprehensive components, accessibility

### Design Patterns Used

1. **Repository Pattern**: Data access abstraction
2. **Circuit Breaker**: Prevent cascading failures
3. **Retry with Backoff**: Transient error recovery
4. **Queue Pattern**: Async job processing
5. **Cache-Aside**: Lazy loading cache
6. **Optimistic UI**: Better perceived performance
7. **Lazy Loading**: Reduce initial bundle

## Common Commands
```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Production server

# Testing
npm run test         # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run test:ci      # CI mode

# Code Quality
npm run lint         # ESLint check
npm run lint:fix     # Fix linting issues
npm run format       # Prettier format
npm run typecheck    # TypeScript check

# Analysis
npm run analyze      # Bundle analysis
npm run precommit    # Pre-commit checks
```

## Environment Variables
```bash
# Required for production
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT=

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Optional but recommended
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# For CI/CD
VERCEL_TOKEN=
FIREBASE_TOKEN=
```

## Troubleshooting Guide

### Common Issues

1. **Firebase Auth Error**
   - Check Admin SDK credentials
   - Verify service account permissions
   - Ensure Firebase Auth is enabled

2. **Rate Limiting Issues**
   - Check Redis connection
   - Verify Upstash credentials
   - Review rate limit configuration

3. **Build Failures**
   - Run `npm run typecheck`
   - Check for missing env vars
   - Review bundle size

4. **Test Failures**
   - Clear Jest cache: `jest --clearCache`
   - Check mock configurations
   - Verify test environment vars

## Future Roadmap

### Immediate Priorities
- [ ] Increase test coverage to 90%
- [ ] Implement E2E tests with Playwright
- [ ] Add Sentry error tracking
- [ ] Implement WebSocket for real-time updates
- [ ] Add i18n support

### Medium Term
- [ ] GraphQL API migration
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Advanced analytics dashboard
- [ ] AI model fine-tuning

### Long Term
- [ ] Multi-tenancy support
- [ ] White-label solution
- [ ] Offline mode with PWA
- [ ] Mobile apps (React Native)
- [ ] Plugin system

## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Query Documentation](https://tanstack.com/query)
- [Zod Documentation](https://zod.dev)
- [MUI Documentation](https://mui.com)

## Support & Contributions
- Report bugs: Create GitHub issue with reproduction steps
- Feature requests: Use GitHub discussions
- Security issues: Email security@phoenix-web.app
- Contributing: See CONTRIBUTING.md

---

*Last updated: August 25, 2025*
*Version: 2.0.0 - Production Ready*